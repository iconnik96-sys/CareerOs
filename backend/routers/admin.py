import os
import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from services.usage_tracker import usage_tracker
from services.llm_engine import llm_engine, FALLBACK_MODELS

router = APIRouter(prefix="/api/admin", tags=["Founder Admin Operations"])
logger = logging.getLogger("AdminRouter")

# Allowed founder email
FOUNDER_EMAIL = os.getenv("FOUNDER_EMAIL", "nikhil@gmail.com").lower().strip()

class ModelSwitchRequest(BaseModel):
    model: str

class PricingSimRequest(BaseModel):
    free_users: int = 100
    pro_users: int = 50
    ultimate_users: int = 20

@router.get("/metrics")
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
    
    cost_per_pro = round((pro_est_tokens / 1_000_000) * 55 + 3.5, 2)
    cost_per_ult = round((ult_est_tokens / 1_000_000) * 55 + 7.0, 2)
    
    margin_pro = round(((149 - cost_per_pro) / 149) * 100, 1)
    margin_ult = round(((249 - cost_per_ult) / 249) * 100, 1)

    return {
        "status": "success",
        "founder_email": FOUNDER_EMAIL,
        "current_model": llm_engine.model,
        "available_models": FALLBACK_MODELS,
        "groq_configured": llm_engine.is_available(),
        "usage": {
            "total_requests": stats["total_requests"],
            "successful_requests": stats["successful_requests"],
            "failed_requests": stats["failed_requests"],
            "total_prompt_tokens": stats["total_prompt_tokens"],
            "total_completion_tokens": stats["total_completion_tokens"],
            "total_tokens": stats["total_tokens"],
            "total_cost_inr": stats["total_cost_inr"],
            "cost_per_million_inr": 55.0,
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

@router.post("/switch-model")
def switch_active_model(req: ModelSwitchRequest):
    """Allows founder to toggle primary model between 70b and 8b instant for cost control."""
    target = req.model.strip()
    if target not in FALLBACK_MODELS and target != "default":
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model. Choose from: {FALLBACK_MODELS}"
        )
    
    if target == "default":
        usage_tracker.set_active_model(None)
    else:
        usage_tracker.set_active_model(target)
        
    return {
        "status": "success",
        "message": f"Active model successfully switched to: {llm_engine.model}",
        "active_model": llm_engine.model
    }

@router.post("/reset-metrics")
def reset_admin_metrics():
    """Resets the usage tracking logs."""
    usage_tracker.reset_stats()
    return {"status": "success", "message": "Metrics reset successfully."}
