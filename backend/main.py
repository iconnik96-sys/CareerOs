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

# Enable CORS for frontend local development & production deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
