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
from routers.admin import verify_authenticated_student
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

# Multi-Tier Rate Limiting for all API endpoints
import time
from collections import defaultdict
from fastapi.responses import JSONResponse

_rate_limit_records = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_AI_MAX = 60  # max AI/LLM requests per window
RATE_LIMIT_GEN_MAX = 120  # max general API requests per window
_last_cleanup_time = time.time()

@app.middleware("http")
async def rate_limit_middleware(request, call_next):
    global _last_cleanup_time
    path = request.url.path

    # Only rate-limit API routes, excluding health check probe
    if path.startswith("/api") and path != "/api/health":
        # Resolve real client IP behind reverse proxy / CDN if present
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        elif request.headers.get("cf-connecting-ip"):
            client_ip = request.headers.get("cf-connecting-ip").strip()
        else:
            client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()

        # Periodic cleanup of expired IPs every 5 minutes to prevent memory leak
        if now - _last_cleanup_time > 300:
            expired_keys = [k for k, ts in _rate_limit_records.items() if not ts or (now - ts[-1] > RATE_LIMIT_WINDOW)]
            for k in expired_keys:
                _rate_limit_records.pop(k, None)
            _last_cleanup_time = now

        # Tiered maximums: AI endpoints are stricter to prevent LLM quota exhaustion
        is_ai_endpoint = path.startswith("/api/ai")
        max_requests = RATE_LIMIT_AI_MAX if is_ai_endpoint else RATE_LIMIT_GEN_MAX
        category = "AI endpoints" if is_ai_endpoint else "API endpoints"

        bucket_key = f"{client_ip}:{'ai' if is_ai_endpoint else 'gen'}"
        timestamps = [t for t in _rate_limit_records[bucket_key] if now - t < RATE_LIMIT_WINDOW]
        _rate_limit_records[bucket_key] = timestamps

        if len(timestamps) >= max_requests:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": f"Rate limit exceeded for {category}. Please wait a minute before sending more requests."
                },
                headers={
                    "Retry-After": str(RATE_LIMIT_WINDOW),
                    "X-RateLimit-Limit": str(max_requests),
                    "X-RateLimit-Remaining": "0"
                }
            )

        _rate_limit_records[bucket_key].append(now)

    return await call_next(request)

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
