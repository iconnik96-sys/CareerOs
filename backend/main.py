import os
import sys

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

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
    roadmap_generator
)
from services.llm_engine import llm_engine

app = FastAPI(
    title="CareerOS AI Engine",
    description="Python FastAPI backend powering LLM services for CareerOS (Cover Letters, STAR Bullets, Interview Grader, Career Copilot, Job Matcher, Roadmaps).",
    version="1.0.0"
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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
    return response

# Rate Limiting for expensive AI / LLM endpoints (60 req / min per IP)
import time
from collections import defaultdict
from fastapi.responses import JSONResponse

_rate_limit_records = defaultdict(list)
RATE_LIMIT_WINDOW = 60 # seconds
RATE_LIMIT_MAX_REQUESTS = 60 # max requests per window

@app.middleware("http")
async def rate_limit_ai_endpoints(request, call_next):
    if request.url.path.startswith("/api/ai"):
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        
        # Clean expired timestamps
        timestamps = [t for t in _rate_limit_records[client_ip] if now - t < RATE_LIMIT_WINDOW]
        _rate_limit_records[client_ip] = timestamps
        
        if len(timestamps) >= RATE_LIMIT_MAX_REQUESTS:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded for AI endpoints. Please wait a minute before sending more requests."
                },
                headers={"Retry-After": str(RATE_LIMIT_WINDOW)}
            )
        
        _rate_limit_records[client_ip].append(now)
    
    return await call_next(request)

# Include AI routers
app.include_router(cover_letter.router)
app.include_router(bullet_enhancer.router)
app.include_router(interview_evaluator.router)
app.include_router(career_copilot.router)
app.include_router(resume_analyzer.router)
app.include_router(job_matcher.router)
app.include_router(roadmap_generator.router)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CareerOS AI LLM Backend",
        "groq_configured": llm_engine.is_available(),
        "model": llm_engine.model,
        "version": "1.0.0"
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True, app_dir=backend_dir)
