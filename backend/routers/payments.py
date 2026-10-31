import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Request, Header
from pydantic import BaseModel, Field

from routers.admin import verify_authenticated_student, verify_admin_access
from services.payment_service import (
    create_payment_order,
    verify_payment_signature,
    process_webhook_event,
    get_user_subscription,
    get_public_payment_config,
    list_payment_records
)

router = APIRouter(prefix="/api/payments", tags=["Payment Gateway & Subscriptions"])
logger = logging.getLogger("PaymentRouter")


# ====================================================================
# Request & Response Schemas
# ====================================================================

class CreateOrderRequest(BaseModel):
    plan_id: str = Field(..., example="pro", description="Requested subscription tier: 'pro' or 'ultimate'")
    billing_cycle: Optional[str] = Field(default="monthly", example="monthly", description="'monthly' or 'quarterly'")
    idempotency_key: Optional[str] = Field(default=None, max_length=120, description="Unique client key to prevent double-charging on network retry")


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str = Field(..., min_length=5, max_length=100)
    razorpay_payment_id: str = Field(..., min_length=5, max_length=100)
    razorpay_signature: str = Field(..., min_length=10, max_length=200)
    internal_purchase_id: Optional[str] = Field(default=None, max_length=100)


@router.get("/config")
def get_payment_configuration():
    """
    Returns public Razorpay configuration for initializing the checkout modal.
    Never exposes API secrets or webhook keys.
    """
    return get_public_payment_config()


@router.post("/create-order")
def api_create_order(
    req: CreateOrderRequest,
    user: Dict[str, Any] = Depends(verify_authenticated_student)
):
    """
    Creates or reuses a payable Razorpay order.
    Enforces server-side price lookup and strict idempotency:
    Double clicks or retries with the same idempotency key return the existing pending order.
    """
    user_id = user.get("sub") or user.get("id") or user.get("email")
    user_email = user.get("email") or "student@careeros.com"

    try:
        order = create_payment_order(
            user_id=user_id,
            user_email=user_email,
            plan_id=req.plan_id,
            billing_cycle=req.billing_cycle or "monthly",
            idempotency_key=req.idempotency_key
        )
        return {
            "status": "success",
            "order": {
                "order_id": order["razorpay_order_id"],
                "purchase_id": order["internal_purchase_id"],
                "amount": order["amount_paise"],
                "amount_inr": order["amount_inr"],
                "currency": order["currency"],
                "plan_id": order["plan_id"],
                "billing_cycle": order["billing_cycle"]
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating payment order: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize payment order. Please retry.")


@router.post("/verify-payment")
def api_verify_payment(
    req: VerifyPaymentRequest,
    user: Dict[str, Any] = Depends(verify_authenticated_student)
):
    """
    Verifies the Razorpay payment cryptographic signature using HMAC-SHA256.
    Activates paid entitlements only upon verified signature match and user association.
    """
    user_id = user.get("sub") or user.get("id") or user.get("email")

    try:
        result = verify_payment_signature(
            razorpay_order_id=req.razorpay_order_id,
            razorpay_payment_id=req.razorpay_payment_id,
            razorpay_signature=req.razorpay_signature,
            user_id=user_id,
            internal_purchase_id=req.internal_purchase_id
        )
        return result
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error verifying payment: {e}")
        raise HTTPException(status_code=500, detail="Payment verification service error.")


@router.post("/webhook")
async def api_razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature")
):
    """
    Dedicated webhook receiver for Razorpay events.
    Verifies HMAC-SHA256 signature across raw request body bytes and deduplicates events idempotently.
    """
    if not x_razorpay_signature:
        logger.warning("Rejected webhook: Missing X-Razorpay-Signature header.")
        raise HTTPException(status_code=400, detail="Missing X-Razorpay-Signature header.")

    raw_body = await request.body()
    try:
        res = process_webhook_event(raw_body, x_razorpay_signature)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Webhook processing error: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing error.")


@router.get("/my-subscription")
def api_get_my_subscription(
    user: Dict[str, Any] = Depends(verify_authenticated_student)
):
    """Returns the current user's authoritative subscription record."""
    user_id = user.get("sub") or user.get("id") or user.get("email")
    return get_user_subscription(user_id)


@router.get("/admin/records", dependencies=[Depends(verify_admin_access)])
def api_admin_list_payments():
    """Admin-only ledger of transactions and orders for reconciliation."""
    return list_payment_records()

