import os
import json
import base64
import hmac
import hashlib
import time
import secrets
import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from services.usage_tracker import usage_tracker
from services.llm_engine import llm_engine, FALLBACK_MODELS

router = APIRouter(prefix="/api/admin", tags=["Founder Admin Operations"])
logger = logging.getLogger("AdminRouter")

# Allowed founder email, admin key & Supabase JWT secret
FOUNDER_EMAIL = os.getenv("FOUNDER_EMAIL", "nikhil@gmail.com").lower().strip()
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "").strip()
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "").strip()

def decode_and_verify_jwt(token: str) -> Optional[Dict[str, Any]]:
    """
    Cryptographically verifies and decodes a Supabase JWT (HS256).
    Enforces signature validation if SUPABASE_JWT_SECRET is configured,
    and checks expiration timestamps.
    """
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts

        # Verify signature if secret is configured
        if SUPABASE_JWT_SECRET:
            signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
            expected_sig = base64.urlsafe_b64encode(
                hmac.new(SUPABASE_JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
            ).decode("utf-8").rstrip("=")
            actual_sig = sig_b64.rstrip("=")
            if not hmac.compare_digest(expected_sig, actual_sig):
                logger.warning("JWT signature verification failed.")
                return None

        # Decode payload
        rem = len(payload_b64) % 4
        if rem > 0:
            payload_b64 += "=" * (4 - rem)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64.encode("utf-8")).decode("utf-8"))

        # Verify expiration
        exp = payload.get("exp")
        if exp and isinstance(exp, (int, float)) and time.time() > exp:
            logger.warning("JWT token expired.")
            return None

        return payload
    except Exception as e:
        logger.warning(f"Error validating JWT: {e}")
        return None

def verify_admin_access(
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
):
    """
    Strictly enforces that the caller is authorized via ADMIN_API_KEY
    or holds a verified Bearer JWT belonging to FOUNDER_EMAIL or an admin role.
    Header-based and query-parameter-based email spoofing is strictly prohibited.
    """
    # 1. Direct Secret API Key check (constant-time comparison)
    if ADMIN_API_KEY and x_admin_key:
        if secrets.compare_digest(x_admin_key.strip(), ADMIN_API_KEY):
            return True

    # 2. Cryptographically verified Bearer token
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        payload = decode_and_verify_jwt(token)
        if payload:
            email = payload.get("email", "").lower().strip()
            # Security Hardening: Only trust server-controlled app_metadata.
            # Client-writable user_metadata is strictly ignored to prevent privilege escalation.
            role = (payload.get("app_metadata", {}).get("role") or "").lower().strip()
            if (FOUNDER_EMAIL and email == FOUNDER_EMAIL) or role in ("founder", "admin"):
                return True

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

    return payload

class ModelSwitchRequest(BaseModel):
    model: str

class PricingSimRequest(BaseModel):
    free_users: int = 100
    pro_users: int = 50
    ultimate_users: int = 20

@router.get("/metrics", dependencies=[Depends(verify_admin_access)])
def get_admin_metrics(founder_email: Optional[str] = None):
    """
    Returns full metrics for the Founder Dashboard:
    - Live token usage & API costs (in INR)
    - Revenue, profit margins, and plan projections
    - Feature breakdown and recent requests
    - System health & available models
    """
    stats = usage_tracker.get_stats()
    
    # Economics calculation (INR)
    total_tokens = stats["total_tokens"]
    total_cost_inr = stats["total_cost_inr"]
    
    # Calculate mock/seed unit economics if freshly started
    # Assume 1 Pro user (₹149) = 150k tokens, 1 Ultimate user (₹249) = 500k tokens
    pro_est_tokens = 150_000
    ult_est_tokens = 500_000
    
    rate_info = usage_tracker.get_rate_for_model(llm_engine.model)
    avg_rate = round((rate_info["input"] + rate_info["output"]) / 2, 2)
    
    cost_per_pro = round((pro_est_tokens / 1_000_000) * avg_rate + 3.5, 2)
    cost_per_ult = round((ult_est_tokens / 1_000_000) * avg_rate + 7.0, 2)
    
    margin_pro = round(((149 - cost_per_pro) / 149) * 100, 1)
    margin_ult = round(((249 - cost_per_ult) / 249) * 100, 1)

    return {
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
        "recent_logs": stats["recent_logs"]
    }

@router.post("/switch-model", dependencies=[Depends(verify_admin_access)])
def switch_active_model(req: ModelSwitchRequest):
    """Allows founder to toggle primary model on the fly for cost control."""
    target = req.model.strip()
    if not target:
        raise HTTPException(status_code=400, detail="Model name cannot be empty.")
    
    if target == "default":
        usage_tracker.set_active_model(None)
    else:
        usage_tracker.set_active_model(target)
        
    return {
        "status": "success",
        "message": f"Active model successfully switched to: {llm_engine.model}",
        "active_model": llm_engine.model,
        "provider": llm_engine.provider_display_name,
        "rate_info": usage_tracker.get_rate_for_model(llm_engine.model)
    }

@router.post("/reset-metrics", dependencies=[Depends(verify_admin_access)])
def reset_admin_metrics():
    """Resets the usage tracking logs."""
    usage_tracker.reset_stats()
    return {"status": "success", "message": "Metrics reset successfully."}
