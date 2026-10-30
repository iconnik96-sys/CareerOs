import os
import sys

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import uvicorn
import logging
from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("CareerOSBackend")

# Also load from root directory and local overrides if they exist
for env_file in [".env", ".env.local"]:
    p = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", env_file))
    if os.path.exists(p):
        load_dotenv(p, override=True)

from routers import (
    cover_letter,
    bullet_enhancer,
    interview_evaluator,
    career_copilot,
    resume_analyzer,
    job_matcher,
    roadmap_generator,
    simulation,
    admin,
    campus
)
from routers.admin import verify_authenticated_student, decode_and_verify_jwt
from services.llm_engine import llm_engine

app = FastAPI(
    title="CareerOS AI Engine",
    description="Python FastAPI backend powering LLM services for CareerOS (Cover Letters, STAR Bullets, Interview Grader, Career Copilot, Job Matcher, Roadmaps).",
    version="1.0.0",
    debug=False
)

# Global unhandled exception handler to strictly prevent stack trace and internal leakages
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."}
    )

# Configure secure CORS origins from environment or sensible defaults
raw_origins = os.getenv("ALLOWED_ORIGINS", os.getenv("CORS_ORIGINS", ""))
if raw_origins.strip():
    allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
else:
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "https://careeros.vercel.app",
        "https://careeros.netlify.app"
    ]

# Enable CORS for frontend local development & production deployments
cors_origin_regex = os.getenv(
    "CORS_ORIGIN_REGEX",
    r"^https://.*(\.netlify\.app|\.vercel\.app|\.onrender\.com)$"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if "*" not in allowed_origins else ["*"],
    allow_origin_regex=cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach production security headers to all responses
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none';"
    return response

# User-Aware & Multi-Tier Rate Limiting for all API endpoints
import time
from collections import defaultdict
from fastapi.responses import JSONResponse

_rate_limit_records = defaultdict(list)
_last_cleanup_time = time.time()

# Multi-Tier Rate Limiting Configuration
RATE_LIMIT_TIERS = {
    "heavy_ai": {
        "window": 60,
        "limit": 10,
        "name": "Heavy AI Evaluation",
        "message": "AI generation rate limit reached (10 requests/min). Please wait a moment before initiating another comprehensive evaluation."
    },
    "file_upload": {
        "window": 60,
        "limit": 6,
        "name": "Resume File Parser",
        "message": "Resume upload rate limit reached (6 files/min). Please wait a moment before uploading another resume."
    },
    "voice_interactive": {
        "window": 60,
        "limit": 40,
        "name": "Interactive AI Voice Turns",
        "message": "Voice interview rate limit reached (40 turns/min). Please take a brief breath before your next turn."
    },
    "static_ai": {
        "window": 60,
        "limit": 120,
        "name": "AI Catalog & Knowledge",
        "message": "Request limit exceeded for AI knowledge services. Please wait a moment."
    },
    "join_code_probe": {
        "window": 300,
        "limit": 5,
        "name": "College Batch Join",
        "message": "Too many college invite code attempts. To protect campus rosters, please wait 5 minutes before trying another code."
    },
    "invite_verify_probe": {
        "window": 60,
        "limit": 10,
        "name": "TPO Invite Verification",
        "message": "Too many invitation verification attempts. Please wait 60 seconds before trying again."
    },
    "general_api": {
        "window": 60,
        "limit": 120,
        "name": "API Service",
        "message": "Rate limit exceeded. Please wait a moment before sending more requests."
    }
}

def resolve_rate_limit_tier(path: str) -> str:
    """Categorizes incoming endpoint path into its designated rate limiting tier."""
    # 1. College invite code & TPO token brute-force protection
    if path == "/api/campus/join-by-code":
        return "join_code_probe"
    if path.startswith("/api/campus/verify-invite") or path == "/api/campus/accept-invite":
        return "invite_verify_probe"

    # 2. File uploads (high parser/memory overhead)
    if path in (
        "/api/ai/parse-resume-file",
        "/api/ai/parse-and-extract-profile",
        "/api/ai/analyze-resume-upload"
    ):
        return "file_upload"

    # 3. Heavy AI LLM multi-step evaluation & document generation
    if path in (
        "/api/ai/deep-resume-analysis",
        "/api/ai/evaluate-interview-session",
        "/api/ai/cover-letter",
        "/api/ai/rag-company-outreach",
        "/api/ai/outreach-message",
        "/api/ai/job-match-analysis",
        "/api/ai/rag-semantic-job-match",
        "/api/ai/generate-roadmap",
        "/api/ai/simulation/review"
    ):
        return "heavy_ai"

    # 4. Interactive Voice & Real-time speech turns
    if path in (
        "/api/ai/interview-voice-turn",
        "/api/ai/generate-interview-questions",
        "/api/ai/clarify-interview-question",
        "/api/ai/evaluate-interview-answer",
        "/api/ai/standup",
        "/api/ai/mentor-hint",
        "/api/ai/copilot-chat",
        "/api/ai/enhance-bullet"
    ):
        return "voice_interactive"

    # 5. Static catalogs, company knowledge & tracks
    if path in ("/api/ai/companies-knowledge", "/api/ai/suggest-role-skills") or path.startswith("/api/ai/simulation/tracks"):
        return "static_ai"

    # 6. Default general API
    return "general_api"

@app.middleware("http")
async def rate_limit_middleware(request, call_next):
    global _last_cleanup_time
    path = request.url.path

    # Bypass CORS preflights and health check probes
    if request.method == "OPTIONS" or not path.startswith("/api") or path == "/api/health":
        return await call_next(request)

    now = time.time()

    # Periodic cleanup of expired records every 5 minutes to prevent memory leak
    if now - _last_cleanup_time > 300:
        expired_keys = [k for k, ts in _rate_limit_records.items() if not ts or (now - ts[-1] > 360)]
        for k in expired_keys:
            _rate_limit_records.pop(k, None)
        _last_cleanup_time = now

    # Resolve client identity:
    # Authenticated students receive a distinct user bucket (solving the Campus NAT / shared Wi-Fi IP collision problem)
    client_id = None
    auth_header = request.headers.get("authorization") or ""
    if auth_header.lower().startswith("bearer "):
        token = auth_header[7:].strip()
        if token and token.count(".") == 2:
            try:
                payload = decode_and_verify_jwt(token)
                if payload:
                    user_id = payload.get("sub") or payload.get("email")
                    if user_id:
                        client_id = f"usr:{user_id}"
            except Exception:
                client_id = None

    # Fall back to client IP for unauthenticated requests
    if not client_id:
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        elif request.headers.get("cf-connecting-ip"):
            client_ip = request.headers.get("cf-connecting-ip").strip()
        else:
            client_ip = request.client.host if request.client else "127.0.0.1"
        client_id = f"ip:{client_ip}"

    # Determine endpoint tier and parameters
    tier_key = resolve_rate_limit_tier(path)
    tier_cfg = RATE_LIMIT_TIERS[tier_key]
    window = tier_cfg["window"]
    limit = tier_cfg["limit"]

    bucket_key = f"{client_id}:{tier_key}"
    timestamps = [t for t in _rate_limit_records[bucket_key] if now - t < window]
    _rate_limit_records[bucket_key] = timestamps

    if len(timestamps) >= limit:
        oldest_ts = timestamps[0]
        retry_after = max(1, int(window - (now - oldest_ts)) + 1)
        return JSONResponse(
            status_code=429,
            content={
                "detail": tier_cfg["message"],
                "retry_after": retry_after,
                "category": tier_cfg["name"]
            },
            headers={
                "Retry-After": str(retry_after),
                "X-RateLimit-Limit": str(limit),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(int(now + retry_after))
            }
        )

    _rate_limit_records[bucket_key].append(now)
    response = await call_next(request)
    response.headers["X-RateLimit-Limit"] = str(limit)
    remaining = max(0, limit - len(_rate_limit_records[bucket_key]))
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    return response

# Include AI routers with student authentication enforcement
app.include_router(cover_letter.router, dependencies=[Depends(verify_authenticated_student)])
app.include_router(bullet_enhancer.router, dependencies=[Depends(verify_authenticated_student)])
app.include_router(interview_evaluator.router, dependencies=[Depends(verify_authenticated_student)])
app.include_router(career_copilot.router, dependencies=[Depends(verify_authenticated_student)])
app.include_router(resume_analyzer.router, dependencies=[Depends(verify_authenticated_student)])
app.include_router(job_matcher.router, dependencies=[Depends(verify_authenticated_student)])
app.include_router(roadmap_generator.router, dependencies=[Depends(verify_authenticated_student)])
app.include_router(simulation.router, dependencies=[Depends(verify_authenticated_student)])
app.include_router(admin.router)
app.include_router(campus.router)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CareerOS AI LLM Backend",
        "provider": llm_engine.provider_display_name,
        "provider_id": llm_engine.provider,
        "ai_configured": llm_engine.is_available(),
        "groq_configured": llm_engine.is_available(),
        "model": llm_engine.model,
        "version": "1.0.0"
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    # Default to localhost to avoid permission issues on Windows
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("main:app", host=host, port=port, reload=True, app_dir=backend_dir)
