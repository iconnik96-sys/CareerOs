import logging
import re
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from services.llm_engine import llm_engine

router = APIRouter(prefix="/api/ai", tags=["Resume Bullet Enhancer"])
logger = logging.getLogger("BulletEnhancerRouter")

class BulletEnhanceRequest(BaseModel):
    raw_bullet: str = Field(..., example="I created a backend API in Spring Boot for user authentication and stored data in postgres.")
    target_role: Optional[str] = Field(default="Backend Engineer", example="Java Backend Engineer")
    technologies: List[str] = Field(default_factory=lambda: ["Spring Boot", "PostgreSQL", "JWT", "Docker"])
    focus_area: Optional[str] = Field(default="Impact & Metrics", example="Impact & Metrics / Technical Depth / Architecture")

class BulletVariation(BaseModel):
    version_title: str
    enhanced_bullet: str
    action_verb: str
    quantifiable_metric: str
    ats_keywords_included: List[str]
    score_improvement: str

class BulletEnhanceResponse(BaseModel):
    original: str
    variations: List[BulletVariation]
    key_critique: str
    pro_tip: str


@router.post("/enhance-bullet", response_model=BulletEnhanceResponse)
def enhance_bullet(req: BulletEnhanceRequest):
    if not llm_engine.is_available():
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY is not configured on the AI backend. Please configure it in backend/.env."
        )

    prompt = f"""
You are a senior technical resume writer and ATS specialist at a top tech company.
Convert this draft resume bullet point into 3 high-impact, professional engineering bullet points using the STAR method and Google X-Y-Z formula ("Accomplished [X] as measured by [Y] by doing [Z]").

Raw Bullet: "{req.raw_bullet}"
Target Role: {req.target_role or "Software Engineer"}
Tech Stack: {", ".join(req.technologies)}
Focus Area: {req.focus_area or "Impact & Metrics"}

Provide your response as a valid JSON object matching this exact structure:
{{
  "original": "{req.raw_bullet}",
  "key_critique": "Brief 1-2 sentence critique explaining why the original was weak (e.g. lacked metrics, passive voice).",
  "pro_tip": "Advice on how to discuss this bullet in a technical interview.",
  "variations": [
    {{
      "version_title": "Metric & Impact Focused",
      "enhanced_bullet": "High impact bullet starting with a strong action verb and clear quantified outcome.",
      "action_verb": "Architected / Engineered / Implemented",
      "quantifiable_metric": "e.g. Reduced latency by 45%, Supported 500+ daily active users",
      "ats_keywords_included": ["Keyword 1", "Keyword 2"],
      "score_improvement": "+35% ATS strength"
    }},
    {{
      "version_title": "Technical Depth & Architecture",
      "enhanced_bullet": "Deep technical implementation bullet showing design patterns and concurrency/security.",
      "action_verb": "Refactored / Optimized",
      "quantifiable_metric": "e.g. 99.9% uptime, 40% reduction in query payload",
      "ats_keywords_included": ["Keyword 1", "Keyword 2"],
      "score_improvement": "+40% ATS strength"
    }},
    {{
      "version_title": "Concise & Fast Scan",
      "enhanced_bullet": "One-line punchy bullet ideal for single page recruiter scans.",
      "action_verb": "Developed",
      "quantifiable_metric": "e.g. 10+ REST endpoints, 85%+ test coverage",
      "ats_keywords_included": ["Keyword 1", "Keyword 2"],
      "score_improvement": "+30% ATS strength"
    }}
  ]
}}
"""
    data = llm_engine.generate_json(
        prompt=prompt,
        system_instruction="You are a specialized ATS resume optimizer and engineering career coach. Always respond with valid JSON only."
    )

    if not data:
        raise HTTPException(
            status_code=500,
            detail="AI generation failed to produce bullet variations. Please retry."
        )

    try:
        return BulletEnhanceResponse(**data)
    except Exception as e:
        logger.error(f"Failed to parse enhanced bullets: {e}")
        raise HTTPException(
            status_code=500,
            detail="AI returned malformed bullet enhancement data. Please retry."
        )

