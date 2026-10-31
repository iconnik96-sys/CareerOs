import os

import time

import uuid

import hmac

import hashlib

import json

import logging

import threading

from datetime import datetime, timedelta, timezone

from typing import Dict, Any, Optional, List

import httpx

try:
    from database import get_db_cursor, is_db_configured, IS_PRODUCTION
except ImportError:
    import sys
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    from database import get_db_cursor, is_db_configured, IS_PRODUCTION




logger = logging.getLogger("PaymentService")



# ====================================================================

# Authoritative Pricing Configuration (Source of Truth)

# ====================================================================

PRICING_CATALOG = {

    "pro": {

        "name": "Placement Pro",

        "monthly": {

            "amount_inr": 149,

            "amount_paise": 14900,

            "duration_days": 30

        },

        "quarterly": {

            "name": "3-Month Placement Pass",

            "amount_inr": 349,

            "amount_paise": 34900,

            "duration_days": 90

        }

    },

    "ultimate": {

        "name": "Placement Ultimate",

        "monthly": {

            "amount_inr": 249,

            "amount_paise": 24900,

            "duration_days": 30

        },

        "quarterly": {

            "name": "3-Month Ultimate Pass",

            "amount_inr": 599,

            "amount_paise": 59900,

            "duration_days": 90

        }

    }

}



# Plan normalization alias (e.g. 'premium' -> 'pro')

PLAN_NORMALIZATION = {

    "premium": "pro",

    "student_premium": "pro",

    "placement_pro": "ultimate"

}



PERSIST_PAYMENT_FILE = os.path.join(os.path.dirname(__file__), ".payment_cache.json")



# Thread-safe stores with persistent disk sync

_order_lock = threading.Lock()

_orders_db: Dict[str, Dict[str, Any]] = {}          # internal_purchase_id -> order

_idempotency_index: Dict[str, str] = {}             # idempotency_key -> internal_purchase_id

_transactions_db: List[Dict[str, Any]] = []

_processed_webhook_events: set = set()

_user_subscriptions: Dict[str, Dict[str, Any]] = {} # user_id -> subscription





def _load_payment_cache():

    if os.path.exists(PERSIST_PAYMENT_FILE):

        try:

            with open(PERSIST_PAYMENT_FILE, "r", encoding="utf-8") as f:

                data = json.load(f)

                if isinstance(data, dict):

                    _orders_db.update(data.get("orders", {}))

                    _idempotency_index.update(data.get("idempotency_index", {}))

                    _transactions_db.extend(data.get("transactions", []))

                    _processed_webhook_events.update(data.get("processed_webhooks", []))

                    _user_subscriptions.update(data.get("subscriptions", {}))

        except Exception as e:

            logger.warning(f"Could not load payment cache: {e}")





def _save_payment_cache():

    try:

        tmp_file = f"{PERSIST_PAYMENT_FILE}.tmp"

        cache_data = {

            "orders": _orders_db,

            "idempotency_index": _idempotency_index,

            "transactions": _transactions_db[-200:],

            "processed_webhooks": list(_processed_webhook_events),

            "subscriptions": _user_subscriptions

        }

        with open(tmp_file, "w", encoding="utf-8") as f:

            json.dump(cache_data, f, indent=2)

        os.replace(tmp_file, PERSIST_PAYMENT_FILE)

    except Exception as e:

        logger.warning(f"Could not persist payment cache: {e}")





_load_payment_cache()





def get_razorpay_credentials():

    """Retrieves Razorpay credentials from environment. Never returns secrets to clients."""

    key_id = os.getenv("RAZORPAY_KEY_ID", "rzp_test_careerOS2026").strip()

    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "test_secret_careerOS_sec_2026").strip()

    webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET", "test_webhook_sec_2026").strip()

    return key_id, key_secret, webhook_secret





def get_public_payment_config() -> Dict[str, Any]:

    """Exposes only the public key ID to the frontend checkout modal."""

    key_id, _, _ = get_razorpay_credentials()

    return {

        "key_id": key_id,

        "currency": "INR",

        "supported_plans": ["pro", "ultimate"]

    }





def create_payment_order(

    user_id: str,

    user_email: str,

    plan_id: str,

    billing_cycle: str = "monthly",

    idempotency_key: Optional[str] = None

) -> Dict[str, Any]:

    """

    Creates or reuses an existing payable Razorpay order.

    Enforces server-side idempotency: Double-clicking Pay or refreshing checkout

    never creates duplicate payable orders.

    """

    norm_plan = PLAN_NORMALIZATION.get(plan_id.lower().strip(), plan_id.lower().strip())

    if norm_plan not in PRICING_CATALOG:

        raise ValueError(f"Invalid plan '{plan_id}'. Available plans: pro, ultimate.")



    cycle = billing_cycle.lower().strip()

    if cycle not in ("monthly", "quarterly"):

        cycle = "monthly"



    plan_pricing = PRICING_CATALOG[norm_plan][cycle]

    amount_paise = plan_pricing["amount_paise"]

    amount_inr = plan_pricing["amount_inr"]



    # Generate or sanitize idempotency key

    idem_key = idempotency_key.strip() if idempotency_key else f"idem_{user_id}_{norm_plan}_{cycle}_{int(time.time() // 300)}"



    # If PostgreSQL configured, execute authoritative transactional verification
    if is_db_configured():
        pg_res = _pg_verify_and_activate(user_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, internal_purchase_id)
        if pg_res:
            # Sync to local cache
            with _order_lock:
                _user_subscriptions[user_id] = pg_res.get("subscription", {})
                _save_payment_cache()
            return pg_res
    elif IS_PRODUCTION:
        raise ConnectionError("PostgreSQL database is required for payment verification in production.")

    with _order_lock:

        # Check if an active order with this idempotency key already exists

        if idem_key in _idempotency_index:

            existing_purchase_id = _idempotency_index[idem_key]

            existing_order = _orders_db.get(existing_purchase_id)

            if existing_order and existing_order["status"] == "created":

                # Check expiration (valid for 30 minutes)

                if time.time() < existing_order["expires_at_ts"]:

                    logger.info(f"Reusing existing pending order {existing_order['razorpay_order_id']} for idempotency key {idem_key}")

                    return existing_order



        # Generate unique internal purchase ID

        purchase_id = f"pur_{uuid.uuid4().hex[:16]}"

        now_ts = time.time()

        expires_at_ts = now_ts + 1800  # 30-minute validity



        key_id, key_secret, _ = get_razorpay_credentials()



        # Call live Razorpay API if live credentials present, else generate secure mock order

        razorpay_order_id = f"order_{uuid.uuid4().hex[:14]}"

        if not key_id.startswith("rzp_test_careerOS"):

            try:

                auth = (key_id, key_secret)

                payload = {

                    "amount": amount_paise,

                    "currency": "INR",

                    "receipt": purchase_id,

                    "notes": {

                        "user_id": user_id,

                        "user_email": user_email,

                        "plan_id": norm_plan,

                        "billing_cycle": cycle

                    }

                }

                res = httpx.post("https://api.razorpay.com/v1/orders", json=payload, auth=auth, timeout=10.0)

                if res.status_code == 200:

                    razorpay_order_id = res.json().get("id", razorpay_order_id)

            except Exception as e:

                logger.warning(f"Could not reach Razorpay live gateway, using local mock order: {e}")



        order_record = {

            "internal_purchase_id": purchase_id,

            "idempotency_key": idem_key,

            "user_id": user_id,

            "user_email": user_email,

            "plan_id": norm_plan,

            "billing_cycle": cycle,

            "amount_paise": amount_paise,

            "amount_inr": amount_inr,

            "currency": "INR",

            "razorpay_order_id": razorpay_order_id,

            "status": "created",

            "created_at": datetime.now(timezone.utc).isoformat(),

            "expires_at_ts": expires_at_ts,

            "expires_at": datetime.fromtimestamp(expires_at_ts, tz=timezone.utc).isoformat()

        }



        # If PostgreSQL is configured, persist to database
        try:
            expires_at_dt = datetime.fromtimestamp(expires_at_ts, tz=timezone.utc)
            reused_order = _pg_create_order(user_id, purchase_id, idem_key, norm_plan, cycle, amount_paise, razorpay_order_id, expires_at_dt)
            if reused_order:
                return reused_order
        except Exception as pg_err:
            if IS_PRODUCTION:
                raise
        _orders_db[purchase_id] = order_record

        _idempotency_index[idem_key] = purchase_id



        # Also index by razorpay_order_id for fast lookup

        _orders_db[razorpay_order_id] = order_record



        _save_payment_cache()

        logger.info(f"Created secure payment order {razorpay_order_id} (Purchase: {purchase_id}, Plan: {norm_plan}, Amount: ₹{amount_inr})")

        return order_record





def verify_payment_signature(

    razorpay_order_id: str,

    razorpay_payment_id: str,

    razorpay_signature: str,

    user_id: str,

    internal_purchase_id: Optional[str] = None

) -> Dict[str, Any]:

    """

    Cryptographically verifies the Razorpay payment signature via HMAC-SHA256.

    Ensures payment belongs to caller and activates subscription entitlements idempotently.

    """

    _, key_secret, _ = get_razorpay_credentials()



    # Verify signature: HMAC-SHA256(order_id + "|" + payment_id, key_secret)

    signing_data = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")

    expected_sig = hmac.new(key_secret.encode("utf-8"), signing_data, hashlib.sha256).hexdigest()



    if not hmac.compare_digest(expected_sig, razorpay_signature):

        logger.warning(f"Payment verification failed: Signature mismatch for order {razorpay_order_id}")

        raise ValueError("Invalid payment signature: Verification failed.")



    # If PostgreSQL configured, execute authoritative transactional verification
    if is_db_configured():
        pg_res = _pg_verify_and_activate(user_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, internal_purchase_id)
        if pg_res:
            # Sync to local cache
            with _order_lock:
                _user_subscriptions[user_id] = pg_res.get("subscription", {})
                _save_payment_cache()
            return pg_res
    elif IS_PRODUCTION:
        raise ConnectionError("PostgreSQL database is required for payment verification in production.")

    with _order_lock:

        # Retrieve order by purchase ID or razorpay_order_id

        order = _orders_db.get(internal_purchase_id) if internal_purchase_id else None

        if not order:

            order = _orders_db.get(razorpay_order_id)



        if not order:

            raise ValueError(f"Associated order record not found for {razorpay_order_id}.")



        # Enforce user association: payment caller must match order creator

        if str(order["user_id"]).strip() != str(user_id).strip():

            logger.warning(f"Payment association hijack attempt: Caller {user_id} != Order owner {order['user_id']}")

            raise PermissionError("Forbidden: Payment order does not belong to your account.")



        # Check if already paid (Idempotent verification)

        if order["status"] == "paid":

            logger.info(f"Payment {razorpay_payment_id} for order {razorpay_order_id} was already verified.")

            sub = _user_subscriptions.get(user_id)

            return {

                "status": "already_verified",

                "message": "Payment already verified and active.",

                "plan_id": order["plan_id"],

                "subscription": sub

            }



        # Mark order as paid

        order["status"] = "paid"

        order["paid_at"] = datetime.now(timezone.utc).isoformat()

        order["payment_id"] = razorpay_payment_id



        # Record transaction in ledger

        tx_record = {

            "transaction_id": f"tx_{uuid.uuid4().hex[:14]}",

            "order_id": razorpay_order_id,

            "purchase_id": order["internal_purchase_id"],

            "user_id": user_id,

            "razorpay_payment_id": razorpay_payment_id,

            "amount_inr": order["amount_inr"],

            "amount_paise": order["amount_paise"],

            "currency": "INR",

            "status": "captured",

            "verified_at": datetime.now(timezone.utc).isoformat()

        }

        _transactions_db.append(tx_record)



        # Activate subscription

        plan_id = order["plan_id"]

        cycle = order["billing_cycle"]

        duration_days = PRICING_CATALOG[plan_id][cycle]["duration_days"]



        period_start = datetime.now(timezone.utc)

        period_end = period_start + timedelta(days=duration_days)



        subscription_record = {

            "user_id": user_id,

            "plan_id": plan_id,

            "billing_cycle": cycle,

            "status": "active",

            "current_period_start": period_start.isoformat(),

            "current_period_end": period_end.isoformat(),

            "last_order_id": razorpay_order_id,

            "last_payment_id": razorpay_payment_id,

            "activated_at": period_start.isoformat()

        }

        _user_subscriptions[user_id] = subscription_record



        _save_payment_cache()

        logger.info(f"Activated {plan_id.upper()} subscription for user {user_id} until {period_end.isoformat()}")

        return {

            "status": "success",

            "message": f"Successfully activated {plan_id.capitalize()} subscription.",

            "plan_id": plan_id,

            "subscription": subscription_record

        }





def process_webhook_event(raw_body: bytes, webhook_signature: str) -> Dict[str, Any]:

    """

    Verifies and idempotently processes incoming Razorpay Webhook events.

    Verifies signature over raw request bytes.

    """

    _, _, webhook_secret = get_razorpay_credentials()



    expected_sig = hmac.new(webhook_secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected_sig, webhook_signature):

        logger.warning("Rejected webhook: Invalid webhook signature.")

        raise ValueError("Invalid webhook signature.")



    try:

        data = json.loads(raw_body.decode("utf-8"))

    except Exception:

        raise ValueError("Malformed JSON in webhook body.")



    event_id = data.get("id") or f"evt_{uuid.uuid4().hex[:12]}"

    event_type = data.get("event")



    # If PostgreSQL configured, execute authoritative transactional verification
    if is_db_configured():
        pg_res = _pg_verify_and_activate(user_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, internal_purchase_id)
        if pg_res:
            # Sync to local cache
            with _order_lock:
                _user_subscriptions[user_id] = pg_res.get("subscription", {})
                _save_payment_cache()
            return pg_res
    elif IS_PRODUCTION:
        raise ConnectionError("PostgreSQL database is required for payment verification in production.")

    with _order_lock:

        if event_id in _processed_webhook_events:

            logger.info(f"Webhook event {event_id} already processed. Acknowledging idempotently.")

            return {"status": "duplicate_acknowledged", "event_id": event_id}



        _processed_webhook_events.add(event_id)



    logger.info(f"Processing webhook event '{event_type}' (ID: {event_id})")



    # Handle payment.captured or order.paid

    if event_type in ("payment.captured", "order.paid"):

        payload = data.get("payload", {})

        payment_entity = payload.get("payment", {}).get("entity", {})

        order_id = payment_entity.get("order_id")

        payment_id = payment_entity.get("id")



        if order_id and order_id in _orders_db:

            order = _orders_db[order_id]

            if order["status"] != "paid":

                order["status"] = "paid"

                user_id = order["user_id"]

                plan_id = order["plan_id"]

                duration = PRICING_CATALOG[plan_id][order["billing_cycle"]]["duration_days"]

                _user_subscriptions[user_id] = {

                    "user_id": user_id,

                    "plan_id": plan_id,

                    "status": "active",

                    "current_period_end": (datetime.now(timezone.utc) + timedelta(days=duration)).isoformat()

                }



    _save_payment_cache()

    return {"status": "processed", "event_id": event_id, "event_type": event_type}





def get_user_subscription(user_id: str) -> Dict[str, Any]:

    """Returns the user's active subscription, defaulting to Free."""

    sub = _user_subscriptions.get(user_id)

    if sub and sub.get("status") == "active":

        # Check expiration

        end_str = sub.get("current_period_end")

        if end_str:

            end_dt = datetime.fromisoformat(end_str)

            if datetime.now(timezone.utc) > end_dt:

                sub["status"] = "expired"

                sub["plan_id"] = "free"

        return sub



    return {

        "user_id": user_id,

        "plan_id": "free",

        "status": "active",

        "billing_cycle": "monthly",

        "current_period_end": None

    }





def list_payment_records() -> Dict[str, Any]:

    """Admin-only reconciliation view of all payments."""

    return {

        "total_orders": len(_orders_db) // 2,  # Divided because indexed twice

        "total_transactions": len(_transactions_db),

        "transactions": list(reversed(_transactions_db[-50:]))

    }



# ====================================================================
# PostgreSQL Database-Backed Payment Operations
# ====================================================================

def _to_uuid(val: Any) -> str:
    """Ensures a valid UUID string, converting strings deterministically if necessary."""
    try:
        return str(uuid.UUID(str(val)))
    except ValueError:
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, str(val)))


def _pg_create_order(user_id: str, purchase_id: str, idem_key: str, plan_id: str, 
                     cycle: str, amount_paise: int, rzp_order_id: str, expires_at_dt: datetime) -> Optional[Dict[str, Any]]:
    """Persists payment order to public.payment_orders in PostgreSQL."""
    if not is_db_configured():
        return None
    try:
        u_uuid = _to_uuid(user_id)
        with get_db_cursor(commit=True) as cur:
            # Check existing pending order for idempotency
            cur.execute("""
                SELECT internal_purchase_id, razorpay_order_id, plan_id, billing_cycle, 
                       amount, currency, status, expires_at 
                FROM public.payment_orders 
                WHERE idempotency_key = %s AND status = 'created' AND expires_at > NOW() 
                LIMIT 1;
            """, (idem_key,))
            existing = cur.fetchone()
            if existing:
                logger.info(f"Reusing existing PostgreSQL pending order {existing[1]} for idempotency key {idem_key}")
                return {
                    "internal_purchase_id": existing[0],
                    "razorpay_order_id": existing[1],
                    "plan_id": existing[2],
                    "billing_cycle": existing[3],
                    "amount_paise": existing[4],
                    "amount_inr": existing[4] // 100,
                    "currency": existing[5],
                    "status": existing[6],
                    "expires_at": existing[7].isoformat() if hasattr(existing[7], 'isoformat') else str(existing[7])
                }

            cur.execute("""
                INSERT INTO public.payment_orders (
                    user_id, internal_purchase_id, idempotency_key, plan_id, 
                    billing_cycle, amount, currency, razorpay_order_id, status, expires_at
                ) VALUES (%s, %s, %s, %s, %s, %s, 'INR', %s, 'created', %s);
            """, (u_uuid, purchase_id, idem_key, plan_id, cycle, amount_paise, rzp_order_id, expires_at_dt))
            return None
    except Exception as e:
        logger.error(f"PostgreSQL order insert error: {e}")
        if IS_PRODUCTION:
            raise
        return None


def _pg_verify_and_activate(user_id: str, razorpay_order_id: str, razorpay_payment_id: str, 
                            razorpay_signature: str, internal_purchase_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Atomically verifies order, logs transaction, and activates subscription in PostgreSQL."""
    if not is_db_configured():
        return None
    u_uuid = _to_uuid(user_id)
    try:
        with get_db_cursor(commit=True) as cur:
            # Find order
            cur.execute("""
                SELECT id, user_id, plan_id, billing_cycle, amount, status, internal_purchase_id 
                FROM public.payment_orders 
                WHERE razorpay_order_id = %s OR internal_purchase_id = %s 
                FOR UPDATE;
            """, (razorpay_order_id, internal_purchase_id or 'none'))
            order_row = cur.fetchone()
            if not order_row:
                raise ValueError(f"Associated order record not found for {razorpay_order_id} in PostgreSQL.")

            order_db_id, order_user_id, plan_id, cycle, amount_paise, order_status, purchase_id = order_row

            # Check user association
            if str(order_user_id) != str(u_uuid):
                logger.warning(f"Payment association hijack attempt: Caller {u_uuid} != Order owner {order_user_id}")
                raise PermissionError("Forbidden: Payment order does not belong to your account.")

            # Idempotent check
            if order_status == 'paid':
                logger.info(f"Payment {razorpay_payment_id} was already verified in PostgreSQL.")
                cur.execute("""
                    SELECT plan_id, status, current_period_end 
                    FROM public.subscriptions 
                    WHERE user_id = %s;
                """, (u_uuid,))
                sub_row = cur.fetchone()
                return {
                    "status": "already_verified",
                    "message": "Payment already verified and active.",
                    "plan_id": plan_id,
                    "subscription": {
                        "user_id": user_id,
                        "plan_id": plan_id,
                        "status": sub_row[1] if sub_row else "active",
                        "current_period_end": str(sub_row[2]) if sub_row and sub_row[2] else None
                    }
                }

            # Update order to paid
            cur.execute("""
                UPDATE public.payment_orders 
                SET status = 'paid', updated_at = NOW() 
                WHERE id = %s;
            """, (order_db_id,))

            # Record transaction ledger
            cur.execute("""
                INSERT INTO public.payment_transactions (
                    order_id, user_id, razorpay_payment_id, razorpay_order_id, 
                    razorpay_signature, amount, currency, status
                ) VALUES (%s, %s, %s, %s, %s, %s, 'INR', 'captured');
            """, (order_db_id, u_uuid, razorpay_payment_id, razorpay_order_id, razorpay_signature, amount_paise))

            # Upsert active subscription
            duration_days = PRICING_CATALOG[plan_id][cycle]["duration_days"]
            period_end = datetime.now(timezone.utc) + timedelta(days=duration_days)

            cur.execute("""
                INSERT INTO public.subscriptions (
                    user_id, plan_id, status, billing_cycle, current_period_start, 
                    current_period_end, last_payment_id, last_order_id
                ) VALUES (%s, %s, 'active', %s, NOW(), %s, %s, %s)
                ON CONFLICT (user_id) DO UPDATE SET 
                    plan_id = EXCLUDED.plan_id,
                    status = 'active',
                    billing_cycle = EXCLUDED.billing_cycle,
                    current_period_start = EXCLUDED.current_period_start,
                    current_period_end = EXCLUDED.current_period_end,
                    last_payment_id = EXCLUDED.last_payment_id,
                    last_order_id = EXCLUDED.last_order_id,
                    updated_at = NOW();
            """, (u_uuid, plan_id, cycle, period_end, razorpay_payment_id, razorpay_order_id))

            sub_record = {
                "user_id": user_id,
                "plan_id": plan_id,
                "billing_cycle": cycle,
                "status": "active",
                "current_period_end": period_end.isoformat(),
                "last_order_id": razorpay_order_id,
                "last_payment_id": razorpay_payment_id
            }

            logger.info(f"PostgreSQL activated {plan_id.upper()} subscription for user {user_id}")
            return {
                "status": "success",
                "message": f"Successfully activated {plan_id.capitalize()} subscription in PostgreSQL.",
                "plan_id": plan_id,
                "subscription": sub_record
            }
    except (ValueError, PermissionError):
        raise
    except Exception as e:
        logger.error(f"PostgreSQL payment verification error: {e}")
        if IS_PRODUCTION:
            raise
        return None


def _pg_process_webhook(event_id: str, event_type: str, payload: Dict[str, Any]) -> Tuple[bool, bool]:
    """
    Durable webhook recording in PostgreSQL.
    Returns (is_duplicate, processed_success).
    """
    if not is_db_configured():
        return False, False
    try:
        with get_db_cursor(commit=True) as cur:
            # Check if event already exists
            cur.execute("""
                SELECT processed FROM public.webhook_events WHERE event_id = %s;
            """, (event_id,))
            row = cur.fetchone()
            if row:
                return True, row[0]

            # Insert new webhook event
            cur.execute("""
                INSERT INTO public.webhook_events (event_id, event_type, payload, processed) 
                VALUES (%s, %s, %s, true);
            """, (event_id, event_type, json.dumps(payload)))
            return False, True
    except Exception as e:
        logger.error(f"PostgreSQL webhook insert error: {e}")
        if IS_PRODUCTION:
            raise
        return False, False


def _pg_get_subscription(user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves subscription from PostgreSQL."""
    if not is_db_configured():
        return None
    try:
        u_uuid = _to_uuid(user_id)
        with get_db_cursor() as cur:
            cur.execute("""
                SELECT plan_id, status, billing_cycle, current_period_end 
                FROM public.subscriptions 
                WHERE user_id = %s;
            """, (u_uuid,))
            row = cur.fetchone()
            if row:
                plan_id, status, cycle, end_dt = row
                if end_dt and end_dt < datetime.now(timezone.utc):
                    status = "expired"
                    plan_id = "free"
                return {
                    "user_id": user_id,
                    "plan_id": plan_id,
                    "status": status,
                    "billing_cycle": cycle,
                    "current_period_end": end_dt.isoformat() if hasattr(end_dt, 'isoformat') else str(end_dt)
                }
    except Exception as e:
        logger.warning(f"Could not fetch subscription from PostgreSQL: {e}")
    return None


def reconcile_unactivated_payments() -> int:
    """
    Payment Reliability & Reconciliation:
    Scans for captured transactions where subscription is missing or inactive,
    and reliably activates the entitlement.
    """
    if not is_db_configured():
        return 0
    reconciled_count = 0
    try:
        with get_db_cursor(commit=True) as cur:
            cur.execute("""
                SELECT t.user_id, o.plan_id, o.billing_cycle, t.razorpay_payment_id, t.razorpay_order_id, t.created_at
                FROM public.payment_transactions t
                JOIN public.payment_orders o ON t.order_id = o.id
                LEFT JOIN public.subscriptions s ON t.user_id = s.user_id
                WHERE t.status = 'captured' 
                  AND (s.id IS NULL OR s.status != 'active' OR s.current_period_end < NOW());
            """)
            rows = cur.fetchall()
            for u_id, p_id, cycle, pay_id, ord_id, created_at in rows:
                duration_days = PRICING_CATALOG[p_id][cycle]["duration_days"]
                period_end = created_at + timedelta(days=duration_days)
                if period_end > datetime.now(timezone.utc):
                    cur.execute("""
                        INSERT INTO public.subscriptions (
                            user_id, plan_id, status, billing_cycle, current_period_start, 
                            current_period_end, last_payment_id, last_order_id
                        ) VALUES (%s, %s, 'active', %s, %s, %s, %s, %s)
                        ON CONFLICT (user_id) DO UPDATE SET 
                            plan_id = EXCLUDED.plan_id,
                            status = 'active',
                            current_period_end = EXCLUDED.current_period_end,
                            updated_at = NOW();
                    """, (u_id, p_id, cycle, created_at, period_end, pay_id, ord_id))
                    reconciled_count += 1
                    logger.info(f"Reconciled unactivated payment for user {u_id} to plan {p_id}")
    except Exception as e:
        logger.error(f"Reconciliation error: {e}")
    return reconciled_count
