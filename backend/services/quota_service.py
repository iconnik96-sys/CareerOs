import os

import time

import logging

import threading

from datetime import datetime, timezone

from collections import defaultdict

from typing import Dict, Any, Optional

from fastapi import HTTPException, Depends

try:
    from database import get_db_cursor, is_db_configured, IS_PRODUCTION
except ImportError:
    # If imported from parent or test environment
    import sys
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    from database import get_db_cursor, is_db_configured, IS_PRODUCTION




logger = logging.getLogger("QuotaService")



# ====================================================================

# Authoritative CareerOS Plan Limits (Source of Truth)

# Plans: Free, Pro (₹149/mo), Ultimate (₹249/mo)

# ====================================================================

TIER_QUOTAS = {

    "free": {

        "resume_scans": 2,          # 2 ATS scans/month

        "resume_exports": 1,        # 1 watermarked export

        "voice_interviews": 1,      # 1 interview session (5 questions)

        "simulations": 1,           # 1 starter simulation

        "career_copilot": 15,       # 15 copilot chats/month

        "bullet_enhancements": 5,

        "job_matches": 5,

        "monthly_ai_calls": 30

    },

    "pro": {

        "resume_scans": 25,         # 25 ATS scans/month

        "resume_exports": 10,       # 10 clean exports

        "voice_interviews": 10,     # 10 mock interviews/month

        "simulations": 6,           # 6 simulation tasks

        "career_copilot": 150,

        "bullet_enhancements": 50,

        "job_matches": 50,

        "monthly_ai_calls": 300

    },

    "ultimate": {

        "resume_scans": 75,         # 75 ATS scans/month

        "resume_exports": 30,       # 30 exports

        "voice_interviews": 30,     # 30 mock interviews/month

        "simulations": 20,          # All simulations & pro tracks

        "career_copilot": 500,

        "bullet_enhancements": 200,

        "job_matches": 200,

        "monthly_ai_calls": 1000

    }

}



# Plan alias normalization (e.g. legacy 'premium' -> 'pro')

PLAN_ALIASES = {

    "premium": "pro",

    "student_premium": "pro",

    "placement_pro": "ultimate"

}



import json



PERSIST_QUOTA_FILE = os.path.join(os.path.dirname(__file__), ".quota_cache.json")



# Persistent thread-safe usage tracker: key = f"{user_id}:{feature}:{month_str}" -> count

_tracker_lock = threading.Lock()

_usage_tracker: Dict[str, int] = defaultdict(int)





def _load_quota_cache():

    if os.path.exists(PERSIST_QUOTA_FILE):

        try:

            with open(PERSIST_QUOTA_FILE, "r", encoding="utf-8") as f:

                data = json.load(f)

                if isinstance(data, dict):

                    for k, v in data.items():

                        _usage_tracker[k] = int(v)

        except Exception as e:

            logger.warning(f"Could not load quota cache: {e}")





def _save_quota_cache():

    try:

        tmp_file = f"{PERSIST_QUOTA_FILE}.tmp"

        with open(tmp_file, "w", encoding="utf-8") as f:

            json.dump(dict(_usage_tracker), f, indent=2)

        os.replace(tmp_file, PERSIST_QUOTA_FILE)

    except Exception as e:

        logger.warning(f"Could not persist quota cache: {e}")





_load_quota_cache()





def get_user_plan_id(user_payload: Dict[str, Any]) -> str:
    """
    Resolves subscription plan strictly from server-managed app_metadata or trusted records.
    Client-controlled user_metadata is explicitly ignored to prevent privilege elevation.
    """
    if not isinstance(user_payload, dict):
        return "free"

    # 1. Trusted app_metadata (managed server-side via Supabase service role / webhooks)
    app_meta = user_payload.get("app_metadata", {})
    if isinstance(app_meta, dict) and app_meta.get("plan_id"):
        raw_plan = str(app_meta["plan_id"]).lower().strip()
        canonical_plan = PLAN_ALIASES.get(raw_plan, raw_plan)
        if canonical_plan in ("pro", "ultimate"):
            return canonical_plan

    # 2. Check active server-side subscription in payment engine
    user_id = user_payload.get("sub") or user_payload.get("id") or user_payload.get("email")
    if user_id:
        try:
            from services.payment_service import get_user_subscription
            sub = get_user_subscription(str(user_id))
            if sub and sub.get("status") == "active" and sub.get("plan_id"):
                raw_plan = str(sub["plan_id"]).lower().strip()
                canonical_sub = PLAN_ALIASES.get(raw_plan, raw_plan)
                if canonical_sub in ("pro", "ultimate"):
                    return canonical_sub
        except Exception:
            pass

    if isinstance(app_meta, dict) and app_meta.get("plan_id"):
        raw_plan = str(app_meta["plan_id"]).lower().strip()
        return PLAN_ALIASES.get(raw_plan, raw_plan)

    return "free"


def is_privileged_user(user_payload: Dict[str, Any]) -> bool:

    """Checks if caller is founder or platform admin (exempt from quota limits)."""

    if not isinstance(user_payload, dict):

        return False



    founder_email = (os.getenv("FOUNDER_EMAIL") or "nikhil@gmail.com").lower().strip()

    user_email = (user_payload.get("email") or "").lower().strip()

    if user_email and user_email == founder_email:

        return True



    app_meta = user_payload.get("app_metadata", {})

    if isinstance(app_meta, dict):

        role = (app_meta.get("role") or "").lower().strip()

        if role in ("founder", "admin"):

            return True



    return False





def get_current_month_key() -> str:

    """Returns current UTC billing month formatted as YYYY-MM."""

    return datetime.now(timezone.utc).strftime("%Y-%m")





def check_and_consume_quota(user_payload: Dict[str, Any], feature: str) -> None:
    """
    Enforces server-side subscription quotas for authenticated users.
    In production: strictly enforced atomically inside PostgreSQL. Fails closed if DB unavailable.
    In local dev/test: thread-safe disk-backed tracker.
    """
    if not isinstance(user_payload, dict):
        return

    if is_privileged_user(user_payload):
        return  # Founders & admins enjoy unrestricted access

    user_id = user_payload.get("sub") or user_payload.get("id") or user_payload.get("email")
    if not user_id:
        return

    plan_id = get_user_plan_id(user_payload)
    plan_limits = TIER_QUOTAS.get(plan_id, TIER_QUOTAS["free"])
    limit = plan_limits.get(feature, plan_limits.get("monthly_ai_calls", 25))
    month_str = get_current_month_key()

    # 1. Authoritative Production Path: Atomic PostgreSQL Stored Function
    if is_db_configured():
        try:
            import uuid
            try:
                user_uuid = str(uuid.UUID(str(user_id)))
            except ValueError:
                user_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, str(user_id)))

            with get_db_cursor(commit=True) as cur:
                cur.execute(
                    "SELECT allowed, current_usage, max_limit FROM public.consume_user_quota(%s, %s, %s, %s);",
                    (user_uuid, feature, month_str, limit)
                )
                row = cur.fetchone()
                if row:
                    allowed, current_usage, max_limit = row[0], row[1], row[2]
                    if not allowed:
                        logger.warning(
                            f"Monthly quota exceeded for user {user_id} on feature '{feature}' (Plan: {plan_id}, Usage: {current_usage}/{max_limit})"
                        )
                        raise HTTPException(
                            status_code=403,
                            detail=(
                                f"Monthly subscription quota reached: You have used {current_usage}/{max_limit} of your {feature.replace('_', ' ')} "
                                f"allowance on the {plan_id.capitalize()} plan for {month_str}. Please upgrade to continue."
                            )
                        )
                    return  # Successfully consumed via PostgreSQL
        except HTTPException:
            raise
        except Exception as db_err:
            logger.error(f"PostgreSQL quota check failed: {db_err}")
            if IS_PRODUCTION:
                # Mandatory correction 1: Fail closed in production!
                raise HTTPException(
                    status_code=503,
                    detail="Subscription and quota verification service unavailable. Please retry shortly."
                )
    elif IS_PRODUCTION:
        raise HTTPException(
            status_code=503,
            detail="Subscription quota enforcement requires active PostgreSQL in production."
        )

    # 2. Local Isolated Dev / Test Fallback
    bucket_key = f"{user_id}:{feature}:{month_str}"
    with _tracker_lock:
        current_usage = _usage_tracker[bucket_key]
        if current_usage >= limit:
            logger.warning(
                f"Monthly quota exceeded for user {user_id} on feature '{feature}' (Plan: {plan_id}, Usage: {current_usage}/{limit})"
            )
            raise HTTPException(
                status_code=403,
                detail=(
                    f"Monthly subscription quota reached: You have used {current_usage}/{limit} of your {feature.replace('_', ' ')} "
                    f"allowance on the {plan_id.capitalize()} plan for {month_str}. Please upgrade to continue."
                )
            )
        _usage_tracker[bucket_key] = current_usage + 1
        _save_quota_cache()