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
            founder_email = (os.getenv("FOUNDER_EMAIL") or FOUNDER_EMAIL).lower().strip()
            if (founder_email and email == founder_email) or role in ("founder", "admin"):
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
        "recent_logs": stats["recent_logs"],
        "persistent_analytics": usage_tracker.get_founder_analytics(days=30)
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
