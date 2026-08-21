import json
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from services.llm_engine import llm_engine

router = APIRouter(prefix="/api/ai", tags=["Career Copilot Chat"])
logger = logging.getLogger("CareerCopilotRouter")

class ChatMessage(BaseModel):
    role: str # "user" or "assistant" or "system"
    content: str

class CopilotChatRequest(BaseModel):
    message: str = Field(..., example="How do I prepare for a Spring Boot fresher interview in 2 weeks?")
    history: List[ChatMessage] = Field(default_factory=list)
    user_context: Optional[dict] = Field(default_factory=lambda: {
        "full_name": "Alex Rivera",
        "target_role": "Java Backend Developer",
        "skills": ["Java", "Spring Boot", "PostgreSQL", "Docker", "AWS"],
        "graduation_year": 2026
    })

class CopilotChatResponse(BaseModel):
    reply: str
    suggested_followups: List[str]
    quick_tips: List[str]


@router.post("/copilot-chat", response_model=CopilotChatResponse)
def copilot_chat(req: CopilotChatRequest):
    if not llm_engine.is_available():
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY is not configured on the AI backend. Please configure it in backend/.env."
        )

    ctx_str = json.dumps(req.user_context or {})
    system_prompt = f"""You are CareerOS Copilot, the world's premier AI career advisor and engineering mentor for college students and early-career software engineers.
User Profile / Context: {ctx_str}

Provide an insightful, inspiring, actionable response formatted with clean markdown (bullet points, bold terms, concrete code/architecture tips).
You MUST respond with a valid JSON object matching this exact structure:
{{
  "reply": "Your markdown answer with clear sections, actionable steps, and encouraging tone.",
  "suggested_followups": ["Followup question 1", "Followup question 2", "Followup question 3"],
  "quick_tips": ["1-line practical takeaway", "1-line interview or project tip"]
}}"""

    messages = [{"role": "system", "content": system_prompt}]
    for msg in req.history[-8:]:
        role = "user" if msg.role == "user" else "assistant"
        messages.append({"role": role, "content": msg.content})

    messages.append({
        "role": "user",
        "content": f"{req.message}\n\nPlease respond with a valid JSON object only."
    })

    data = llm_engine.generate_json(
        messages=messages
    )

    if not data:
        raise HTTPException(
            status_code=500,
            detail="AI generation failed to produce a copilot response. Please retry."
        )

    try:
        return CopilotChatResponse(**data)
    except Exception as e:
        logger.error(f"Failed to parse copilot response: {e}")
        raise HTTPException(
            status_code=500,
            detail="AI returned malformed copilot chat data. Please retry."
        )

