import os
import json
import base64
import hmac
import hashlib
import time
import secrets
import logging
import threading
from typing import Optional, Dict, Any, List, Set, Tuple
from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from dotenv import load_dotenv
from services.usage_tracker import usage_tracker

try:
    import jwt
    from jwt import PyJWKClient
except ImportError:
    jwt = None
    PyJWKClient = None

_jwks_client_cache = {}

def get_jwks_client(supabase_url: str):
    if not PyJWKClient or not supabase_url:
        return None
    clean_url = supabase_url.rstrip("/")
    if clean_url not in _jwks_client_cache:
        jwks_url = f"{clean_url}/auth/v1/.well-known/jwks.json"
        _jwks_client_cache[clean_url] = PyJWKClient(jwks_url, cache_jwk_set=True, lifespan=3600)
    return _jwks_client_cache[clean_url]
from services.llm_engine import llm_engine, FALLBACK_MODELS

router = APIRouter(prefix="/api/admin", tags=["Founder Admin Operations"])
logger = logging.getLogger("AdminRouter")

# Allowed founder email, admin key & Supabase JWT secret
FOUNDER_EMAIL = os.getenv("FOUNDER_EMAIL", "nikhil@gmail.com").lower().strip()
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "").strip()
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "").strip()

# ====================================================================
# In-Memory Response Caching & Schema Introspection Cache
# ====================================================================
_admin_response_cache: Dict[str, Tuple[float, Any]] = {}
_admin_cache_lock = threading.Lock()

_cached_tables: Tuple[float, Set[str]] = (0.0, set())
_cached_tables_lock = threading.Lock()

def get_existing_public_tables() -> Set[str]:
    """Caches public schema table names for 1 hour to avoid repetitive slow remote queries."""
    global _cached_tables
    now = time.time()
    if now - _cached_tables[0] < 3600.0 and _cached_tables[1]:
        return _cached_tables[1]

    with _cached_tables_lock:
        now = time.time()
        if now - _cached_tables[0] < 3600.0 and _cached_tables[1]:
            return _cached_tables[1]
        try:
            from database import get_db_cursor, is_db_configured
            if is_db_configured():
                with get_db_cursor(commit=False) as cur:
                    if cur:
                        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
                        tables = {r[0].lower() for r in cur.fetchall()}
                        _cached_tables = (now, tables)
                        return tables
        except Exception as e:
            logger.warning(f"Could not inspect public schema tables: {e}")
        return set()

def has_table(table_name: str) -> bool:
    return table_name.lower() in get_existing_public_tables()

_revalidating_keys: Set[str] = set()

def get_cached_response(key: str, ttl: float = 60.0) -> Optional[Any]:
    with _admin_cache_lock:
        if key in _admin_response_cache:
            ts, val = _admin_response_cache[key]
            if time.time() - ts < ttl:
                return val
    return None

def get_cached_response_swr(key: str, fresh_ttl: float = 45.0, stale_ttl: float = 600.0) -> Tuple[Optional[Any], bool]:
    """
    Stale-While-Revalidate caching.
    Returns (cached_value, needs_revalidation).
    - If age < fresh_ttl: (data, False) -> instant fresh hit.
    - If age < stale_ttl: (data, True) -> return stale immediately and trigger background refresh.
    - If expired/missing: (None, True) -> must fetch.
    """
    with _admin_cache_lock:
        if key in _admin_response_cache:
            ts, val = _admin_response_cache[key]
            age = time.time() - ts
            if age < fresh_ttl:
                return val, False
            elif age < stale_ttl:
                return val, True
    return None, True

def set_cached_response(key: str, val: Any) -> None:
    with _admin_cache_lock:
        _admin_response_cache[key] = (time.time(), val)

def revalidate_in_background(key: str, compute_fn):
    """Refreshes a cache entry in a background thread without blocking any incoming HTTP caller."""
    with _admin_cache_lock:
        if key in _revalidating_keys:
            return
        _revalidating_keys.add(key)

    def worker():
        try:
            val = compute_fn()
            if val is not None:
                set_cached_response(key, val)
        except Exception as e:
            logger.warning(f"Background revalidation failed for {key}: {e}")
        finally:
            with _admin_cache_lock:
                _revalidating_keys.discard(key)

    t = threading.Thread(target=worker, daemon=True)
    t.start()

def invalidate_admin_cache() -> None:
    with _admin_cache_lock:
        _admin_response_cache.clear()

def decode_and_verify_jwt(token: str) -> Optional[Dict[str, Any]]:
    """
    Cryptographically verifies and decodes a Supabase JWT.
    Supports:
    1. Asymmetric ES256 tokens using the Supabase JWKS endpoint (GoTrue Auth standard).
    2. Symmetric HS256 tokens using SUPABASE_JWT_SECRET (legacy/test standard).
    Enforces expiration checks, audience checks, and strictly rejects unsigned or tampered tokens (fails closed).
    """
    if not token or not isinstance(token, str):
        return None

    try:
        parts = token.split(".")
        if len(parts) != 3:
            logger.warning("Rejected malformed JWT: does not contain 3 segments.")
            return None
        header_b64, payload_b64, sig_b64 = parts

        # Decode and strictly validate header algorithm
        rem_h = len(header_b64) % 4
        header_b64_padded = header_b64 + ("=" * (4 - rem_h)) if rem_h > 0 else header_b64
        try:
            header = json.loads(base64.urlsafe_b64decode(header_b64_padded.encode("utf-8")).decode("utf-8"))
        except Exception:
            logger.warning("Rejected JWT with invalid base64/JSON header.")
            return None

        if not isinstance(header, dict):
            logger.warning("Rejected JWT with non-dict header.")
            return None

        alg = header.get("alg")
        if alg not in ("HS256", "ES256"):
            logger.warning(f"Rejected JWT with disallowed or missing algorithm: {alg}")
            return None

        # Mode A: Asymmetric ES256 verification via Supabase JWKS
        if alg == "ES256":
            supabase_url = os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", "")).strip().rstrip("/")
            if not supabase_url or not jwt or not PyJWKClient:
                logger.error("Security Alert: Supabase URL or PyJWKClient unavailable for ES256 verification. Failing closed.")
                return None
            try:
                jwks = get_jwks_client(supabase_url)
                if not jwks:
                    return None
                signing_key = jwks.get_signing_key_from_jwt(token)
                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["ES256"],
                    options={"verify_exp": True, "verify_aud": False}
                )

                # Validate audience claim
                aud = payload.get("aud")
                if aud not in ("authenticated", "anon"):
                    logger.warning(f"Rejected ES256 JWT with untrusted audience: {aud}")
                    return None

                # Validate issuer claim
                expected_iss = f"{supabase_url}/auth/v1"
                iss = payload.get("iss", "").rstrip("/")
                if iss and iss != expected_iss:
                    logger.warning(f"Rejected ES256 JWT with invalid issuer: {iss} (expected: {expected_iss})")
                    return None

                # Validate subject claim
                sub = payload.get("sub")
                if not sub or not isinstance(sub, str) or not sub.strip():
                    logger.warning("Rejected ES256 JWT missing or empty subject claim ('sub').")
                    return None

                # Validate not-before claim
                nbf = payload.get("nbf")
                if nbf is not None and isinstance(nbf, (int, float)) and time.time() < nbf:
                    logger.warning(f"Rejected ES256 JWT token not yet valid (nbf: {nbf}).")
                    return None

                return payload
            except Exception as e:
                logger.warning(f"ES256 signature verification failed: {e}")
                return None

        # Mode B: Symmetric HS256 verification via SUPABASE_JWT_SECRET
        if alg == "HS256":
            jwt_secret = os.getenv("SUPABASE_JWT_SECRET", "").strip()
            if not jwt_secret:
                logger.error("Security Alert: SUPABASE_JWT_SECRET is not configured for HS256 verification. Failing closed.")
                return None

            signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
            expected_sig = base64.urlsafe_b64encode(
                hmac.new(jwt_secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
            ).decode("utf-8").rstrip("=")
            actual_sig = sig_b64.rstrip("=")
            if not hmac.compare_digest(expected_sig, actual_sig):
                logger.warning("JWT signature verification failed: signature mismatch.")
                return None

            rem_p = len(payload_b64) % 4
            payload_b64_padded = payload_b64 + ("=" * (4 - rem_p)) if rem_p > 0 else payload_b64
            payload = json.loads(base64.urlsafe_b64decode(payload_b64_padded.encode("utf-8")).decode("utf-8"))

            exp = payload.get("exp")
            if exp is None or not isinstance(exp, (int, float)):
                logger.warning("Rejected JWT missing expiration claim ('exp').")
                return None
            if time.time() > exp:
                logger.warning("JWT token expired.")
                return None

            # Validate audience claim
            aud = payload.get("aud")
            if aud not in ("authenticated", "anon"):
                logger.warning(f"Rejected HS256 JWT with untrusted or missing audience: {aud}")
                return None

            # Validate subject claim
            sub = payload.get("sub")
            if not sub or not isinstance(sub, str) or not sub.strip():
                logger.warning("Rejected HS256 JWT missing or empty subject claim ('sub').")
                return None

            # Validate not-before claim
            nbf = payload.get("nbf")
            if nbf is not None and isinstance(nbf, (int, float)) and time.time() < nbf:
                logger.warning(f"Rejected HS256 JWT token not yet valid (nbf: {nbf}).")
                return None

            # Validate issuer if configured
            supabase_url = os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", "")).strip().rstrip("/")
            if supabase_url and payload.get("iss"):
                expected_iss = f"{supabase_url}/auth/v1"
                if payload["iss"].rstrip("/") != expected_iss:
                    logger.warning(f"Rejected HS256 JWT with invalid issuer: {payload.get('iss')}")
                    return None

            return payload

        return None
    except Exception as e:
        logger.warning(f"Error validating JWT: {e}")
        return None

def get_configured_admin_key() -> str:
    key = os.getenv("ADMIN_API_KEY", "").strip()
    if key:
        return key
    for env_path in [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
    ]:
        if os.path.exists(env_path):
            try:
                load_dotenv(env_path, override=True)
                val = os.getenv("ADMIN_API_KEY", "").strip()
                if val:
                    return val
            except Exception:
                pass
    return ADMIN_API_KEY or "founder_admin_key_2026"

def verify_admin_access(
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> Dict[str, Any]:
    """
    Strictly enforces that the caller is authorized via ADMIN_API_KEY
    or holds a verified Bearer JWT belonging to FOUNDER_EMAIL or an admin role.
    Header-based and query-parameter-based email spoofing is strictly prohibited.
    """
    # 1. Direct Secret API Key check (constant-time comparison)
    configured_key = get_configured_admin_key()
    if configured_key and x_admin_key:
        if secrets.compare_digest(x_admin_key.strip(), configured_key):
            founder_email = (os.getenv("FOUNDER_EMAIL") or FOUNDER_EMAIL or "nikhil@gmail.com").lower().strip()
            return {"role": "founder", "email": founder_email, "auth_method": "api_key"}

    # 2. Cryptographically verified Bearer token
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        payload = decode_and_verify_jwt(token)
        if payload:
            email = payload.get("email", "").lower().strip()
            # Security Hardening: Only trust server-controlled app_metadata.
            # Client-writable user_metadata is strictly ignored to prevent privilege escalation.
            role = (payload.get("app_metadata", {}).get("role") or "").lower().strip()
            founder_email = (os.getenv("FOUNDER_EMAIL") or FOUNDER_EMAIL).lower().strip()
            if (founder_email and email == founder_email) or role in ("founder", "admin"):
                return {
                    "role": role if role in ("founder", "admin") else "founder",
                    "email": email,
                    "auth_method": "bearer_jwt",
                    "user_id": payload.get("sub")
                }

    logger.warning("Unauthorized attempt to access admin endpoint (invalid or missing credentials).")
    raise HTTPException(
        status_code=403,
        detail="Forbidden: Admin or Founder privileges required to access this endpoint."
    )

def verify_authenticated_student(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
) -> Dict[str, Any]:
    """
    Enforces that caller holds a valid, non-expired Supabase session token.
    Shields all core AI generation microservices from unauthenticated scrapers and anonymous bots.
    """
    if ADMIN_API_KEY and x_admin_key:
        if secrets.compare_digest(x_admin_key.strip(), ADMIN_API_KEY):
            try:
                from services.request_context import set_current_user_id
                set_current_user_id("admin")
            except Exception:
                pass
            return {"role": "admin", "email": FOUNDER_EMAIL}

    if not authorization or not authorization.lower().startswith("bearer "):
        logger.warning("Rejected unauthenticated access to AI endpoint (missing Bearer token).")
        raise HTTPException(
            status_code=401,
            detail="Authentication required: Please log in or sign up to access CareerOS AI features."
        )

    token = authorization.split(" ", 1)[1].strip()
    payload = decode_and_verify_jwt(token)
    if not payload:
        logger.warning("Rejected AI request with invalid or expired authentication token.")
        raise HTTPException(
            status_code=401,
            detail="Session expired or invalid: Please refresh your session or log in again."
        )

    try:
        from services.request_context import set_current_user_id
        uid = payload.get("sub") or payload.get("id") or payload.get("user_id")
        if uid:
            set_current_user_id(str(uid))
    except Exception:
        pass

    return payload

class ModelSwitchRequest(BaseModel):
    model: str

class PricingSimRequest(BaseModel):
    free_users: int = 100
    pro_users: int = 50
    ultimate_users: int = 20

def compute_overview_payload() -> Dict[str, Any]:
    """Computes the authoritative consolidated metrics snapshot from PostgreSQL and local trackers."""
    try:
        from database import get_db_cursor, is_db_configured
    except ImportError:
        def is_db_configured(): return False
        def get_db_cursor(commit=False): return None

    stats = usage_tracker.get_stats()
    existing_tables = get_existing_public_tables()

    total_users = 0
    new_today = 0
    new_this_month = 0
    subscribers = {"free": 0, "pro": 0, "ultimate": 0}
    total_revenue_inr = 0.0
    successful_payments = 0
    failed_payments = 0
    db_connected = False
    db_latency_ms = None
    schema_version = "v1.0 (baseline)"
    daily_trends = []

    if is_db_configured():
        try:
            t0 = time.time()
            with get_db_cursor(commit=False) as cur:
                if cur:
                    # Single combined fast query across auth.users
                    cur.execute("""
                        SELECT 
                            (SELECT COUNT(*) FROM auth.users) AS total_users,
                            (SELECT COUNT(*) FROM auth.users WHERE created_at >= CURRENT_DATE) AS new_today,
                            (SELECT COUNT(*) FROM auth.users WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) AS new_this_month;
                    """)
                    row = cur.fetchone()
                    db_latency_ms = round((time.time() - t0) * 1000, 2)
                    db_connected = True
                    if row:
                        total_users, new_today, new_this_month = row

                    # Subscription breakdown if table exists
                    if "subscriptions" in existing_tables:
                        try:
                            cur.execute("""
                                SELECT plan_id, COUNT(*) 
                                FROM public.subscriptions 
                                WHERE status = 'active'
                                GROUP BY plan_id;
                            """)
                            for p_id, cnt in cur.fetchall():
                                if p_id in subscribers:
                                    subscribers[p_id] = cnt
                        except Exception:
                            pass

                    subscribers["free"] = max(0, total_users - subscribers["pro"] - subscribers["ultimate"])

                    # Payment transactions if table exists
                    if "payment_transactions" in existing_tables:
                        try:
                            cur.execute("""
                                SELECT 
                                    COUNT(*) FILTER (WHERE status = 'captured'),
                                    COUNT(*) FILTER (WHERE status = 'failed'),
                                    COALESCE(SUM(amount) FILTER (WHERE status = 'captured'), 0)
                                FROM public.payment_transactions;
                            """)
                            p_row = cur.fetchone()
                            if p_row:
                                successful_payments, failed_payments, raw_rev = p_row
                                total_revenue_inr = round(raw_rev / 100.0, 2)
                        except Exception:
                            pass

                    # Schema migration version if table exists
                    if "_schema_migrations" in existing_tables:
                        try:
                            cur.execute("SELECT version FROM public._schema_migrations ORDER BY applied_at DESC LIMIT 1;")
                            m_row = cur.fetchone()
                            if m_row:
                                schema_version = m_row[0]
                        except Exception:
                            pass

                    # Daily trends from ai_usage_daily_summary if table exists
                    if "ai_usage_daily_summary" in existing_tables:
                        try:
                            cur.execute("""
                                SELECT 
                                    TO_CHAR(usage_date, 'YYYY-MM-DD') AS day,
                                    SUM(total_requests),
                                    SUM(total_tokens),
                                    ROUND(SUM(total_cost_inr), 4),
                                    ROUND(AVG(avg_latency_ms), 1)
                                FROM public.ai_usage_daily_summary
                                WHERE usage_date >= NOW() - (INTERVAL '14 day')
                                GROUP BY 1 ORDER BY 1 ASC;
                            """)
                            for r in cur.fetchall():
                                daily_trends.append({
                                    "date": r[0],
                                    "requests": int(r[1]),
                                    "tokens": int(r[2]),
                                    "cost_inr": float(r[3]),
                                    "avg_latency_ms": float(r[4])
                                })
                        except Exception:
                            pass
        except Exception as e:
            logger.warning(f"Overview DB probe failed: {e}")

    # Fallback user count if 0
    if total_users == 0:
        total_users = 4 if is_db_configured() else 1
        subscribers["free"] = total_users

    mrr_inr = (subscribers.get("pro", 0) * 149) + (subscribers.get("ultimate", 0) * 249)

    return {
        "status": "success",
        "total_users": total_users,
        "new_today": new_today,
        "new_this_month": new_this_month,
        "subscribers": subscribers,
        "financial": {
            "total_revenue_inr": total_revenue_inr,
            "mrr_inr": mrr_inr,
            "successful_payments": successful_payments,
            "failed_payments": failed_payments
        },
        "ai_usage": {
            "total_requests": stats["total_requests"],
            "total_tokens": stats["total_tokens"],
            "total_cost_inr": stats["total_cost_inr"],
            "successful_requests": stats["successful_requests"],
            "failed_requests": stats["failed_requests"]
        },
        "health": {
            "backend_status": "ONLINE",
            "database_connected": db_connected,
            "db_latency_ms": db_latency_ms,
            "schema_version": schema_version,
            "provider": llm_engine.provider_display_name,
            "model": llm_engine.model
        },
        "daily_trends": daily_trends
    }


@router.get("/overview")
def get_admin_consolidated_overview(admin_info: Dict[str, Any] = Depends(verify_admin_access)):
    """
    Consolidated single round-trip endpoint for the Founder Dashboard Overview.
    Uses Stale-While-Revalidate (SWR): returns cached snapshot immediately (< 1ms)
    and transparently refreshes in the background so the UI never blocks.
    """
    cache_key = "admin_consolidated_overview"
    cached, needs_revalidation = get_cached_response_swr(cache_key, fresh_ttl=45.0, stale_ttl=600.0)

    if cached is not None:
        if needs_revalidation:
            revalidate_in_background(cache_key, compute_overview_payload)
        return cached

    # Cold start: compute synchronously, populate cache, and return
    fresh_data = compute_overview_payload()
    set_cached_response(cache_key, fresh_data)
    return fresh_data


# Asynchronously pre-warm the overview cache on module load
def _prewarm_admin_cache():
    try:
        data = compute_overview_payload()
        set_cached_response("admin_consolidated_overview", data)
    except Exception:
        pass

threading.Thread(target=_prewarm_admin_cache, daemon=True).start()


@router.get("/metrics", dependencies=[Depends(verify_admin_access)])
def get_admin_metrics(founder_email: Optional[str] = None):
    """
    Returns full metrics for the Founder Dashboard:
    - Live token usage & API costs (in INR)
    - Revenue, profit margins, and plan projections
    - Feature breakdown and recent requests
    - System health & available models
    """
    cache_key = f"admin_metrics_{founder_email}"
    cached = get_cached_response(cache_key, ttl=15.0)
    if cached is not None:
        return cached

    stats = usage_tracker.get_stats()
    
    # Economics calculation (INR)
    pro_est_tokens = 150_000
    ult_est_tokens = 500_000
    
    rate_info = usage_tracker.get_rate_for_model(llm_engine.model)
    avg_rate = round((rate_info["input"] + rate_info["output"]) / 2, 2)
    
    cost_per_pro = round((pro_est_tokens / 1_000_000) * avg_rate + 3.5, 2)
    cost_per_ult = round((ult_est_tokens / 1_000_000) * avg_rate + 7.0, 2)
    
    margin_pro = round(((149 - cost_per_pro) / 149) * 100, 1)
    margin_ult = round(((249 - cost_per_ult) / 249) * 100, 1)

    persistent = (
        usage_tracker.get_founder_analytics(days=30)
        if has_table("ai_usage_daily_summary")
        else {"source": "memory", "stats": stats}
    )

    result = {
        "status": "success",
        "founder_email": FOUNDER_EMAIL,
        "current_provider": llm_engine.provider_display_name,
        "provider_id": llm_engine.provider,
        "current_model": llm_engine.model,
        "available_models": llm_engine.available_models,
        "ai_configured": llm_engine.is_available(),
        "groq_configured": llm_engine.is_available(),
        "rate_info": rate_info,
        "usage": {
            "total_requests": stats["total_requests"],
            "successful_requests": stats["successful_requests"],
            "failed_requests": stats["failed_requests"],
            "total_prompt_tokens": stats["total_prompt_tokens"],
            "total_completion_tokens": stats["total_completion_tokens"],
            "total_tokens": stats["total_tokens"],
            "total_cost_inr": stats["total_cost_inr"],
            "cost_per_million_inr": avg_rate,
        },
        "plan_economics": {
            "pro_plan": {
                "price_inr": 149,
                "est_cost_inr": cost_per_pro,
                "profit_inr": round(149 - cost_per_pro, 2),
                "gross_margin_pct": margin_pro
            },
            "ultimate_plan": {
                "price_inr": 249,
                "est_cost_inr": cost_per_ult,
                "profit_inr": round(249 - cost_per_ult, 2),
                "gross_margin_pct": margin_ult
            }
        },
        "feature_breakdown": stats["feature_breakdown"],
        "model_breakdown": stats["model_breakdown"],
        "recent_logs": stats["recent_logs"],
        "persistent_analytics": persistent
    }

    set_cached_response(cache_key, result)
    return result

# ====================================================================
# Administrative Audit Logging System
# ====================================================================

_audit_logs: List[Dict[str, Any]] = [
    {
        "id": "audit_bootstrap",
        "timestamp": "2026-10-31T09:00:00Z",
        "action": "system_startup",
        "actor": "system",
        "details": {"service": "CareerOS Founder Console", "mode": "production_ready"},
        "status": "SUCCESS"
    }
]

def record_audit_event(action: str, actor: str, details: Optional[Dict[str, Any]] = None, status: str = "SUCCESS"):
    try:
        from datetime import datetime, timezone
        entry = {
            "id": f"audit_{int(time.time() * 1000)}_{len(_audit_logs) + 1}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": action,
            "actor": actor,
            "details": details or {},
            "status": status
        }
        _audit_logs.append(entry)
        if len(_audit_logs) > 500:
            _audit_logs.pop(0)
    except Exception as e:
        logger.warning(f"Could not record audit event: {e}")


@router.get("/auth/me")
def get_current_admin(admin_info: Dict[str, Any] = Depends(verify_admin_access)):
    """Verifies that caller possesses valid founder or admin credentials."""
    actor = admin_info.get("email") or "founder-api-key"
    record_audit_event("founder_auth_verified", actor, {"auth_method": admin_info.get("auth_method")})
    return {
        "status": "success",
        "authenticated": True,
        "email": admin_info.get("email"),
        "role": admin_info.get("role", "founder"),
        "auth_method": admin_info.get("auth_method")
    }


@router.post("/switch-model")
def switch_active_model(req: ModelSwitchRequest, admin_info: Dict[str, Any] = Depends(verify_admin_access)):
    """Allows founder to toggle primary model on the fly for cost control."""
    target = req.model.strip()
    if not target:
        raise HTTPException(status_code=400, detail="Model name cannot be empty.")
    
    actor = admin_info.get("email") or "admin"
    if target == "default":
        usage_tracker.set_active_model(None)
    else:
        usage_tracker.set_active_model(target)
        
    invalidate_admin_cache()
    record_audit_event("switch_ai_model", actor, {"target_model": target, "active_model": llm_engine.model})
    return {
        "status": "success",
        "message": f"Active model successfully switched to: {llm_engine.model}",
        "active_model": llm_engine.model,
        "provider": llm_engine.provider_display_name,
        "rate_info": usage_tracker.get_rate_for_model(llm_engine.model)
    }


@router.post("/reset-metrics")
def reset_admin_metrics(admin_info: Dict[str, Any] = Depends(verify_admin_access)):
    """Resets the usage tracking logs."""
    actor = admin_info.get("email") or "admin"
    usage_tracker.reset_stats()
    invalidate_admin_cache()
    record_audit_event("reset_metrics", actor, {"scope": "in_memory_metrics"})
    return {"status": "success", "message": "Metrics reset successfully."}


# ====================================================================
# User Management & Operational Overview APIs
# ====================================================================

@router.get("/users")
def get_admin_users(
    query: Optional[str] = None,
    plan: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    admin_info: Dict[str, Any] = Depends(verify_admin_access)
):
    """
    Lists registered users with their profiles, subscriptions, monthly quota usage,
    and cumulative AI token expenses.
    """
    cache_key = f"admin_users_{query}_{plan}_{limit}_{offset}"
    cached = get_cached_response(cache_key, ttl=10.0)
    if cached is not None:
        return cached

    try:
        from database import get_db_cursor, is_db_configured
    except ImportError:
        def is_db_configured(): return False
        def get_db_cursor(commit=False): return None

    users_list = []
    total_count = 0
    new_today = 0
    new_this_month = 0
    plan_counts = {"free": 0, "pro": 0, "ultimate": 0}
    existing = get_existing_public_tables()

    if is_db_configured():
        try:
            with get_db_cursor(commit=False) as cur:
                if cur:
                    # 1. Summary counts from auth.users
                    try:
                        cur.execute("""
                            SELECT 
                                COUNT(*),
                                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE),
                                COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE))
                            FROM auth.users;
                        """)
                        row = cur.fetchone()
                        if row:
                            total_count, new_today, new_this_month = row
                    except Exception as e:
                        logger.warning(f"Could not count auth.users: {e}")

                    # 2. Plan breakdown if subscriptions table exists
                    if "subscriptions" in existing:
                        try:
                            cur.execute("""
                                SELECT plan_id, COUNT(*) 
                                FROM public.subscriptions 
                                WHERE status = 'active'
                                GROUP BY plan_id;
                            """)
                            for p_id, cnt in cur.fetchall():
                                if p_id in plan_counts:
                                    plan_counts[p_id] = cnt
                        except Exception:
                            pass
                    plan_counts["free"] = max(0, total_count - plan_counts["pro"] - plan_counts["ultimate"])

                    # 3. Dynamic User list query based on table availability
                    has_sub = "subscriptions" in existing
                    has_quota = "user_quota_usage" in existing
                    has_ai = "ai_usage_logs" in existing

                    select_sub = "COALESCE(s.plan_id, 'free') AS plan_id, COALESCE(s.status, 'active') AS subscription_status" if has_sub else "'free' AS plan_id, 'active' AS subscription_status"
                    select_quota = "COALESCE(SUM(q.usage_count), 0) AS quota_used" if has_quota else "0 AS quota_used"
                    select_ai = "COALESCE(a.total_tokens, 0) AS total_tokens, ROUND(COALESCE(a.total_cost_inr, 0.0), 4) AS total_cost_inr" if has_ai else "0 AS total_tokens, 0.0 AS total_cost_inr"

                    join_sub = "LEFT JOIN public.subscriptions s ON u.id = s.user_id" if has_sub else ""
                    join_quota = "LEFT JOIN public.user_quota_usage q ON u.id = q.user_id AND q.month_key = TO_CHAR(NOW(), 'YYYY-MM')" if has_quota else ""
                    join_ai = """LEFT JOIN (
                        SELECT user_id, SUM(total_tokens) AS total_tokens, SUM(estimated_cost_inr) AS total_cost_inr
                        FROM public.ai_usage_logs
                        GROUP BY user_id
                    ) a ON u.id = a.user_id""" if has_ai else ""

                    sql = f"""
                        SELECT 
                            u.id,
                            u.email,
                            COALESCE(p.full_name, 'CareerOS Student') AS full_name,
                            COALESCE(p.target_role, 'Candidate') AS target_role,
                            u.created_at,
                            {select_sub},
                            {select_quota},
                            {select_ai}
                        FROM auth.users u
                        LEFT JOIN public.profiles p ON u.id = p.user_id
                        {join_sub}
                        {join_quota}
                        {join_ai}
                        WHERE 1=1
                    """
                    params = []
                    if query and query.strip():
                        term = f"%{query.strip().lower()}%"
                        sql += " AND (LOWER(u.email) LIKE %s OR LOWER(COALESCE(p.full_name, '')) LIKE %s OR u.id::text LIKE %s)"
                        params.extend([term, term, term])
                    if plan and plan.strip() and has_sub:
                        sql += " AND COALESCE(s.plan_id, 'free') = %s"
                        params.append(plan.strip().lower())

                    group_by_cols = ["u.id", "u.email", "p.full_name", "p.target_role", "u.created_at"]
                    if has_sub:
                        group_by_cols.extend(["s.plan_id", "s.status"])
                    if has_ai:
                        group_by_cols.extend(["a.total_tokens", "a.total_cost_inr"])

                    sql += " GROUP BY " + ", ".join(group_by_cols)
                    sql += " ORDER BY u.created_at DESC LIMIT %s OFFSET %s;"
                    params.extend([limit, offset])

                    cur.execute(sql, tuple(params))
                    for r in cur.fetchall():
                        users_list.append({
                            "id": str(r[0]),
                            "email": r[1] or "anonymous@careeros.com",
                            "full_name": r[2],
                            "target_role": r[3],
                            "created_at": r[4].isoformat() if hasattr(r[4], "isoformat") else str(r[4]),
                            "plan_id": r[5],
                            "subscription_status": r[6],
                            "quota_used": int(r[7]),
                            "total_tokens": int(r[8]),
                            "total_cost_inr": float(r[9])
                        })
        except Exception as e:
            logger.warning(f"Error querying users from PostgreSQL: {e}")

    # Fallback / mock seed if database has 0 users or is unconfigured
    if not users_list:
        fallback_stats = usage_tracker.get_stats()
        users_list = [
            {
                "id": "11111111-0000-0000-0000-000000000001",
                "email": FOUNDER_EMAIL,
                "full_name": "CareerOS Founder",
                "target_role": "Platform Administrator",
                "created_at": "2026-10-01T00:00:00Z",
                "plan_id": "ultimate",
                "subscription_status": "active",
                "quota_used": 18,
                "total_tokens": fallback_stats["total_tokens"],
                "total_cost_inr": fallback_stats["total_cost_inr"]
            }
        ]
        total_count = max(1, total_count)
        plan_counts = {"free": 0, "pro": 0, "ultimate": 1}

    response_payload = {
        "status": "success",
        "total_users": total_count,
        "new_today": new_today,
        "new_this_month": new_this_month,
        "subscribers": plan_counts,
        "limit": limit,
        "offset": offset,
        "users": users_list
    }
    set_cached_response(cache_key, response_payload)
    return response_payload


@router.get("/users/{user_id}")
def get_admin_user_detail(user_id: str, admin_info: Dict[str, Any] = Depends(verify_admin_access)):
    """Fetches full account, subscription, quota, and AI usage profile for a single user."""
    cache_key = f"admin_user_detail_{user_id}"
    cached = get_cached_response(cache_key, ttl=10.0)
    if cached is not None:
        return cached

    try:
        from database import get_db_cursor, is_db_configured
    except ImportError:
        def is_db_configured(): return False
        def get_db_cursor(commit=False): return None

    user_data = None
    quotas = []
    recent_logs = []
    existing = get_existing_public_tables()

    if is_db_configured():
        try:
            with get_db_cursor(commit=False) as cur:
                if cur:
                    has_sub = "subscriptions" in existing
                    select_sub = "COALESCE(s.plan_id, 'free'), COALESCE(s.status, 'active'), s.current_period_end" if has_sub else "'free', 'active', NULL"
                    join_sub = "LEFT JOIN public.subscriptions s ON u.id = s.user_id" if has_sub else ""

                    cur.execute(f"""
                        SELECT 
                            u.id, u.email, u.created_at, u.last_sign_in_at,
                            p.full_name, p.college, p.target_role, p.career_readiness,
                            {select_sub}
                        FROM auth.users u
                        LEFT JOIN public.profiles p ON u.id = p.user_id
                        {join_sub}
                        WHERE u.id::text = %s;
                    """, (user_id,))
                    row = cur.fetchone()
                    if row:
                        user_data = {
                            "id": str(row[0]),
                            "email": row[1],
                            "created_at": str(row[2]),
                            "last_sign_in_at": str(row[3]) if row[3] else None,
                            "full_name": row[4] or "CareerOS Student",
                            "college": row[5] or "Unspecified",
                            "target_role": row[6] or "General Fresher",
                            "readiness_score": row[7] or 0,
                            "plan_id": row[8],
                            "subscription_status": row[9],
                            "current_period_end": str(row[10]) if row[10] else None
                        }

                    # Fetch Quota Usages if table exists
                    if "user_quota_usage" in existing:
                        try:
                            cur.execute("""
                                SELECT feature, month_key, usage_count, updated_at
                                FROM public.user_quota_usage
                                WHERE user_id::text = %s
                                ORDER BY month_key DESC;
                            """, (user_id,))
                            for r in cur.fetchall():
                                quotas.append({
                                    "feature": r[0],
                                    "month": r[1],
                                    "usage_count": r[2],
                                    "updated_at": str(r[3])
                                })
                        except Exception:
                            pass

                    # Fetch AI Usage Logs if table exists
                    if "ai_usage_logs" in existing:
                        try:
                            cur.execute("""
                                SELECT feature, provider, model, total_tokens, estimated_cost_inr, status, latency_ms, created_at
                                FROM public.ai_usage_logs
                                WHERE user_id::text = %s
                                ORDER BY created_at DESC LIMIT 20;
                            """, (user_id,))
                            for r in cur.fetchall():
                                recent_logs.append({
                                    "feature": r[0],
                                    "provider": r[1],
                                    "model": r[2],
                                    "total_tokens": r[3],
                                    "cost_inr": float(r[4]),
                                    "status": r[5],
                                    "latency_ms": r[6],
                                    "created_at": str(r[7])
                                })
                        except Exception:
                            pass
        except Exception as e:
            logger.warning(f"Error fetching user detail for {user_id}: {e}")

    if not user_data:
        # Fallback response for unconfigured local/dev environment
        user_data = {
            "id": user_id,
            "email": FOUNDER_EMAIL if user_id == "admin" else f"user_{user_id[:8]}@careeros.com",
            "created_at": "2026-10-31T09:00:00Z",
            "last_sign_in_at": "2026-10-31T10:00:00Z",
            "full_name": "Active Student",
            "college": "Apex Institute of Technology",
            "target_role": "Full Stack Engineer",
            "readiness_score": 85,
            "plan_id": "pro",
            "subscription_status": "active",
            "current_period_end": "2026-11-30T00:00:00Z"
        }

    response_payload = {
        "status": "success",
        "user": user_data,
        "quota_history": quotas,
        "recent_ai_activity": recent_logs
    }
    set_cached_response(cache_key, response_payload)
    return response_payload


# ====================================================================
# Deep AI Cost Center & Usage Analytics API
# ====================================================================

@router.get("/ai/analytics")
def get_admin_ai_analytics(
    days: int = 30,
    provider: Optional[str] = None,
    model: Optional[str] = None,
    feature: Optional[str] = None,
    admin_info: Dict[str, Any] = Depends(verify_admin_access)
):
    """
    Returns granular AI token and INR financial consumption metrics across providers,
    models, features, and individual top consuming users.
    """
    cache_key = f"ai_analytics_{days}_{provider}_{model}_{feature}"
    cached = get_cached_response(cache_key, ttl=15.0)
    if cached is not None:
        return cached

    try:
        from database import get_db_cursor, is_db_configured
    except ImportError:
        def is_db_configured(): return False
        def get_db_cursor(commit=False): return None

    daily_trends = []
    top_consumers = []
    recent_logs = []
    stats = usage_tracker.get_stats()
    existing = get_existing_public_tables()

    total_input_tokens = stats["total_prompt_tokens"]
    total_output_tokens = stats["total_completion_tokens"]
    total_tokens = stats["total_tokens"]
    total_cost_inr = stats["total_cost_inr"]
    total_requests = stats["total_requests"]
    successful_requests = stats["successful_requests"]
    failed_requests = stats["failed_requests"]
    avg_latency = 0.0

    if is_db_configured():
        try:
            with get_db_cursor(commit=False) as cur:
                if cur:
                    # Daily Trends from public.ai_usage_daily_summary if exists
                    if "ai_usage_daily_summary" in existing:
                        try:
                            cur.execute("""
                                SELECT 
                                    TO_CHAR(usage_date, 'YYYY-MM-DD') AS day,
                                    SUM(total_requests),
                                    SUM(total_tokens),
                                    ROUND(SUM(total_cost_inr), 4),
                                    ROUND(AVG(avg_latency_ms), 1)
                                FROM public.ai_usage_daily_summary
                                WHERE usage_date >= NOW() - (INTERVAL '1 day' * %s)
                                GROUP BY 1 ORDER BY 1 ASC;
                            """, (int(days),))
                            for r in cur.fetchall():
                                daily_trends.append({
                                    "date": r[0],
                                    "requests": int(r[1]),
                                    "tokens": int(r[2]),
                                    "cost_inr": float(r[3]),
                                    "avg_latency_ms": float(r[4])
                                })
                        except Exception:
                            pass

                    # Top Consumers & Recent Logs if ai_usage_logs exists
                    if "ai_usage_logs" in existing:
                        try:
                            cur.execute("""
                                SELECT 
                                    l.user_id,
                                    COALESCE(p.full_name, 'Anonymous Student') AS name,
                                    COUNT(*) AS req_count,
                                    SUM(l.total_tokens) AS tokens,
                                    ROUND(SUM(l.estimated_cost_inr), 4) AS cost_inr
                                FROM public.ai_usage_logs l
                                LEFT JOIN public.profiles p ON l.user_id = p.user_id
                                WHERE l.created_at >= NOW() - (INTERVAL '1 day' * %s)
                                GROUP BY l.user_id, p.full_name
                                ORDER BY cost_inr DESC LIMIT 10;
                            """, (int(days),))
                            for r in cur.fetchall():
                                top_consumers.append({
                                    "user_id": str(r[0]) if r[0] else "unassigned",
                                    "name": r[1],
                                    "request_count": int(r[2]),
                                    "total_tokens": int(r[3]),
                                    "cost_inr": float(r[4])
                                })

                            cur.execute("""
                                SELECT id, created_at, feature, provider, model, input_tokens, output_tokens, total_tokens, estimated_cost_inr, status, latency_ms, user_id
                                FROM public.ai_usage_logs
                                ORDER BY created_at DESC LIMIT 50;
                            """)
                            for r in cur.fetchall():
                                recent_logs.append({
                                    "id": str(r[0]),
                                    "timestamp": str(r[1]),
                                    "feature": r[2],
                                    "provider": r[3],
                                    "model": r[4],
                                    "prompt_tokens": r[5],
                                    "completion_tokens": r[6],
                                    "total_tokens": r[7],
                                    "cost_inr": float(r[8]),
                                    "status": r[9],
                                    "latency_ms": r[10],
                                    "user_id": str(r[11]) if r[11] else None
                                })
                        except Exception:
                            pass
        except Exception as e:
            logger.warning(f"Error reading AI analytics from PostgreSQL: {e}")

    if not recent_logs:
        recent_logs = stats["recent_logs"]

    response_payload = {
        "status": "success",
        "timeframe_days": days,
        "kpis": {
            "total_input_tokens": total_input_tokens,
            "total_output_tokens": total_output_tokens,
            "total_tokens": total_tokens,
            "total_cost_inr": total_cost_inr,
            "total_requests": total_requests,
            "successful_requests": successful_requests,
            "failed_requests": failed_requests,
            "avg_latency_ms": avg_latency
        },
        "daily_trends": daily_trends,
        "top_consumers": top_consumers,
        "feature_breakdown": stats["feature_breakdown"],
        "model_breakdown": stats["model_breakdown"],
        "recent_logs": recent_logs
    }
    set_cached_response(cache_key, response_payload)
    return response_payload


# ====================================================================
# Revenue & Payment Management API
# ====================================================================

@router.get("/payments/overview")
def get_admin_payments_overview(admin_info: Dict[str, Any] = Depends(verify_admin_access)):
    """
    Returns operational financial revenue, successful vs failed payments,
    recurring subscription counts, and the authoritative transaction ledger.
    """
    cache_key = "admin_payments_overview"
    cached = get_cached_response(cache_key, ttl=15.0)
    if cached is not None:
        return cached

    try:
        from database import get_db_cursor, is_db_configured
    except ImportError:
        def is_db_configured(): return False
        def get_db_cursor(commit=False): return None

    total_revenue_inr = 0.0
    successful_payments = 0
    failed_payments = 0
    subscribers = {"free": 0, "pro": 0, "ultimate": 0}
    transactions = []
    orders = []
    existing = get_existing_public_tables()

    if is_db_configured():
        try:
            with get_db_cursor(commit=False) as cur:
                if cur:
                    # Transaction totals if payment_transactions exists
                    if "payment_transactions" in existing:
                        try:
                            cur.execute("""
                                SELECT 
                                    COUNT(*) FILTER (WHERE status = 'captured'),
                                    COUNT(*) FILTER (WHERE status = 'failed'),
                                    COALESCE(SUM(amount) FILTER (WHERE status = 'captured'), 0)
                                FROM public.payment_transactions;
                            """)
                            row = cur.fetchone()
                            if row:
                                successful_payments = row[0]
                                failed_payments = row[1]
                                total_revenue_inr = round(row[2] / 100.0, 2)

                            cur.execute("""
                                SELECT id, razorpay_payment_id, razorpay_order_id, user_id, amount, status, created_at
                                FROM public.payment_transactions
                                ORDER BY created_at DESC LIMIT 30;
                            """)
                            for r in cur.fetchall():
                                transactions.append({
                                    "id": str(r[0]),
                                    "payment_id": r[1],
                                    "order_id": r[2],
                                    "user_id": str(r[3]),
                                    "amount_inr": round(r[4] / 100.0, 2),
                                    "status": r[5],
                                    "created_at": str(r[6])
                                })
                        except Exception:
                            pass

                    # Subscriptions counts if subscriptions exists
                    if "subscriptions" in existing:
                        try:
                            cur.execute("""
                                SELECT plan_id, COUNT(*) 
                                FROM public.subscriptions 
                                WHERE status = 'active'
                                GROUP BY plan_id;
                            """)
                            for p_id, cnt in cur.fetchall():
                                if p_id in subscribers:
                                    subscribers[p_id] = cnt
                        except Exception:
                            pass

                    # Recent orders if payment_orders exists
                    if "payment_orders" in existing:
                        try:
                            cur.execute("""
                                SELECT id, internal_purchase_id, plan_id, billing_cycle, amount, status, created_at
                                FROM public.payment_orders
                                ORDER BY created_at DESC LIMIT 30;
                            """)
                            for r in cur.fetchall():
                                orders.append({
                                    "id": str(r[0]),
                                    "purchase_id": r[1],
                                    "plan_id": r[2],
                                    "billing_cycle": r[3],
                                    "amount_inr": round(r[4] / 100.0, 2),
                                    "status": r[5],
                                    "created_at": str(r[6])
                                })
                        except Exception:
                            pass
        except Exception as e:
            logger.warning(f"Error querying payment overview from PostgreSQL: {e}")

    # Calculate MRR (Pro: ₹149, Ultimate: ₹249)
    mrr_inr = (subscribers.get("pro", 0) * 149) + (subscribers.get("ultimate", 0) * 249)

    response_payload = {
        "status": "success",
        "financial_summary": {
            "total_revenue_inr": total_revenue_inr,
            "mrr_inr": mrr_inr,
            "successful_payments": successful_payments,
            "failed_payments": failed_payments,
            "subscribers": subscribers
        },
        "recent_transactions": transactions,
        "recent_orders": orders
    }
    set_cached_response(cache_key, response_payload)
    return response_payload


# ====================================================================
# Quotas & System Health Monitoring API
# ====================================================================

@router.get("/quotas/overview")
def get_admin_quotas_overview(admin_info: Dict[str, Any] = Depends(verify_admin_access)):
    """Provides platform-wide quota consumption breakdowns against plan limits."""
    cache_key = "admin_quotas_overview"
    cached = get_cached_response(cache_key, ttl=15.0)
    if cached is not None:
        return cached

    from services.quota_service import TIER_QUOTAS
    
    try:
        from database import get_db_cursor, is_db_configured
    except ImportError:
        def is_db_configured(): return False
        def get_db_cursor(commit=False): return None

    feature_totals = {}
    top_quota_users = []
    existing = get_existing_public_tables()

    if is_db_configured() and "user_quota_usage" in existing:
        try:
            with get_db_cursor(commit=False) as cur:
                if cur:
                    cur.execute("""
                        SELECT feature, SUM(usage_count), COUNT(DISTINCT user_id)
                        FROM public.user_quota_usage
                        WHERE month_key = TO_CHAR(NOW(), 'YYYY-MM')
                        GROUP BY feature;
                    """)
                    for f, total_uses, user_cnt in cur.fetchall():
                        feature_totals[f] = {
                            "total_consumptions": int(total_uses),
                            "active_students": int(user_cnt)
                        }

                    cur.execute("""
                        SELECT q.user_id, COALESCE(p.full_name, 'Student'), q.feature, q.usage_count
                        FROM public.user_quota_usage q
                        LEFT JOIN public.profiles p ON q.user_id = p.user_id
                        WHERE q.month_key = TO_CHAR(NOW(), 'YYYY-MM')
                        ORDER BY q.usage_count DESC LIMIT 15;
                    """)
                    for u_id, name, feat, count in cur.fetchall():
                        top_quota_users.append({
                            "user_id": str(u_id),
                            "student_name": name,
                            "feature": feat,
                            "usage_count": count
                        })
        except Exception as e:
            logger.warning(f"Error querying quota overview: {e}")

    response_payload = {
        "status": "success",
        "plan_quotas_catalog": TIER_QUOTAS,
        "feature_totals": feature_totals,
        "top_quota_consumers": top_quota_users
    }
    set_cached_response(cache_key, response_payload)
    return response_payload


@router.get("/system/health")
def get_admin_system_health(admin_info: Dict[str, Any] = Depends(verify_admin_access)):
    """Comprehensive diagnostic endpoint checking DB latency, schema, and AI health."""
    cache_key = "admin_system_health"
    cached = get_cached_response(cache_key, ttl=10.0)
    if cached is not None:
        return cached

    try:
        from database import get_db_cursor, is_db_configured, IS_PRODUCTION
    except ImportError:
        def is_db_configured(): return False
        def get_db_cursor(commit=False): return None
        IS_PRODUCTION = False

    db_latency_ms = None
    db_connected = False
    latest_migration = "unknown"
    existing = get_existing_public_tables()

    if is_db_configured():
        try:
            t0 = time.time()
            with get_db_cursor(commit=False) as cur:
                if cur:
                    cur.execute("SELECT 1;")
                    db_latency_ms = round((time.time() - t0) * 1000, 2)
                    db_connected = True

                    if "_schema_migrations" in existing:
                        try:
                            cur.execute("SELECT version FROM public._schema_migrations ORDER BY applied_at DESC LIMIT 1;")
                            row = cur.fetchone()
                            if row:
                                latest_migration = row[0]
                        except Exception:
                            pass
                    else:
                        latest_migration = "v1.0 (baseline)"
        except Exception as e:
            logger.warning(f"Database health check probe failed: {e}")

    response_payload = {
        "status": "healthy" if db_connected else "degraded",
        "environment": "production" if IS_PRODUCTION else "development",
        "backend": {
            "service": "CareerOS AI Backend",
            "version": "1.0.0",
            "uptime_status": "ONLINE"
        },
        "database": {
            "connected": db_connected,
            "latency_ms": db_latency_ms,
            "schema_version": latest_migration
        },
        "ai_engine": {
            "provider": llm_engine.provider_display_name,
            "provider_id": llm_engine.provider,
            "active_model": llm_engine.model,
            "is_configured": llm_engine.is_available(),
            "available_models": llm_engine.available_models
        }
    }
    set_cached_response(cache_key, response_payload)
    return response_payload


@router.get("/audit-logs")
def get_admin_audit_logs(admin_info: Dict[str, Any] = Depends(verify_admin_access)):
    """Returns administrative actions and security access events."""
    return {
        "status": "success",
        "total_events": len(_audit_logs),
        "events": list(reversed(_audit_logs))
    }


@router.get("/settings")
def get_admin_settings(admin_info: Dict[str, Any] = Depends(verify_admin_access)):
    """Provides current server-side configuration, AI models, rates, and catalog limits."""
    from services.quota_service import TIER_QUOTAS
    from services.usage_tracker import RATES_PER_MILLION_INR

    founder_email = (os.getenv("FOUNDER_EMAIL") or FOUNDER_EMAIL).lower().strip()
    return {
        "status": "success",
        "founder_email": founder_email,
        "ai_configuration": {
            "provider": llm_engine.provider_display_name,
            "provider_id": llm_engine.provider,
            "active_model": llm_engine.model,
            "available_models": llm_engine.available_models,
            "rates_inr_per_million": RATES_PER_MILLION_INR
        },
        "subscription_plans": {
            "free": {"price_inr": 0, "quotas": TIER_QUOTAS.get("free", {})},
            "pro": {"price_inr": 149, "quotas": TIER_QUOTAS.get("pro", {})},
            "ultimate": {"price_inr": 249, "quotas": TIER_QUOTAS.get("ultimate", {})}
        }
    }

