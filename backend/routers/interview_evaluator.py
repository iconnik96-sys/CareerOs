import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from services.llm_engine import llm_engine

router = APIRouter(prefix="/api/ai", tags=["Mock Interview Evaluator"])
logger = logging.getLogger("InterviewEvaluatorRouter")

class InterviewEvalRequest(BaseModel):
    question: str = Field(..., min_length=5, max_length=2000, example="How does HashMap work internally in Java?")
    candidate_answer: str = Field(..., min_length=2, max_length=8000, example="It uses an array of nodes and hashCode to find bucket index. In Java 8, when a bucket has more than 8 elements, it converts to a red-black tree.")
    topic: Optional[str] = Field(default="Java", max_length=100, example="Java")
    difficulty: Optional[str] = Field(default="Medium", max_length=50, example="Medium")
    target_role: Optional[str] = Field(default="Java Backend Developer", max_length=150, example="Java Backend Developer")

class DimensionScore(BaseModel):
    name: str
    score: int
    feedback: str

class InterviewEvalResponse(BaseModel):
    overall_score: int
    grade: str # e.g. "Strong Hire", "Hire", "Lean Hire", "Needs Work"
    summary_verdict: str
    dimension_scores: List[DimensionScore]
    strengths: List[str]
    missing_points: List[str]
    model_improved_answer: str
    interviewer_follow_up: str


import uuid

class QuestionGenRequest(BaseModel):
    role: Optional[str] = Field(default=None, max_length=150, example="Java Backend Developer")
    target_role: Optional[str] = Field(default=None, max_length=150, example="Java Backend Developer")
    difficulty: Optional[str] = Field(default="All", max_length=50, example="Medium")
    topic: Optional[str] = Field(default="All", max_length=100, example="Java")
    count: Optional[int] = Field(default=10, ge=1, le=25, example=10)

class InterviewQuestionItem(BaseModel):
    id: str
    role: str
    difficulty: str
    topic: str
    question: str
    answer_key: str
    tips: List[str]
    sample_answer: str

class QuestionGenResponse(BaseModel):
    questions: List[InterviewQuestionItem]


@router.post("/generate-interview-questions", response_model=List[InterviewQuestionItem])
def generate_interview_questions(req: QuestionGenRequest):
    if not llm_engine.is_available():
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY is not configured on the AI backend. Please configure it in backend/.env."
        )

    resolved_role = req.role or req.target_role or "Java Backend Developer"
    question_count = max(1, min(req.count or 10, 25))

    topic_str = f"focusing specifically on {req.topic}" if req.topic and req.topic != "All" else "covering core fundamentals, advanced concepts, architecture, databases, debugging, and real-world system design"
    diff_str = f"at {req.difficulty} difficulty level" if req.difficulty and req.difficulty != "All" else "distributed across Easy (20%), Medium (50%), and Hard (30%) difficulty levels"

    prompt = f"""
Generate {question_count} high-caliber, authentic, and diverse technical and scenario-based interview questions for a candidate preparing for the role: "{resolved_role}", {topic_str}, {diff_str}.

Instructions:
1. Ensure questions cover realistic technical depth asked at top tech companies (internals, trade-offs, concurrency, performance optimization, error handling, edge cases).
2. Avoid generic trivia; prioritize practical application and conceptual mastery.
3. For each question, provide:
   - "id": a unique string (e.g. "iq_{uuid.uuid4().hex[:6]}_1")
   - "role": "{resolved_role}"
   - "difficulty": "Easy", "Medium", or "Hard"
   - "topic": relevant topic tag (e.g. "Core Fundamentals", "Frameworks", "Databases", "System Design", "Cloud & DevOps", "Concurrency", etc.)
   - "question": clearly articulated technical or scenario question
   - "answer_key": 1-2 sentence core concept takeaway
   - "tips": 2-3 specific bullet points on what interviewers look for
   - "sample_answer": a thorough, structured, exemplary model answer (demonstrating technical depth, complexity, and best practices)

Return your response as a valid JSON object with a single "questions" key matching this schema:
{{
  "questions": [
    {{
      "id": "iq_1",
      "role": "{resolved_role}",
      "difficulty": "Medium",
      "topic": "Architecture & Internals",
      "question": "Explain how database indexing works with B-Trees vs Hash indexes, and when indexing hurts performance.",
      "answer_key": "B-Trees support range queries in O(log n); Hash indexes only support equality lookups. Excessive indexing slows down writes.",
      "tips": [
        "Mention clustered vs non-clustered index differences",
        "Explain write amplification on INSERT/UPDATE",
        "Discuss composite index leftmost prefix rule"
      ],
      "sample_answer": "Database indexing creates auxiliary lookup data structures to accelerate search queries... [detailed answer]"
    }}
  ]
}}
"""
    data = llm_engine.generate_json(
        prompt=prompt,
        system_instruction="You are a Staff Technical Interviewer and Engineering Hiring Manager at a top-tier tech company. Always respond with valid JSON only."
    )

    if not data or "questions" not in data or not isinstance(data["questions"], list):
        raise HTTPException(
            status_code=500,
            detail="AI generation failed to produce interview questions. Please retry."
        )

    try:
        validated = []
        for idx, q in enumerate(data["questions"]):
            if not q.get("id") or q.get("id") in [item.id for item in validated]:
                q["id"] = f"iq_{uuid.uuid4().hex[:8]}_{idx+1}"
            validated.append(InterviewQuestionItem(**q))
        return validated
    except Exception as e:
        logger.error(f"Failed to parse generated interview questions: {e}")
        raise HTTPException(
            status_code=500,
            detail="AI returned malformed interview questions data. Please retry."
        )


@router.post("/evaluate-interview-answer", response_model=InterviewEvalResponse)
def evaluate_interview_answer(req: InterviewEvalRequest):
    if not llm_engine.is_available():
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY is not configured on the AI backend. Please configure it in backend/.env."
        )

    prompt = f"""
You are a Staff Software Engineer and Senior Technical Interviewer conducting a mock interview for an entry-level / early-career candidate.
Evaluate the candidate's answer below:

Question: "{req.question}"
Topic: {req.topic or 'General'} | Difficulty: {req.difficulty or 'Medium'} | Role: {req.target_role or 'Software Engineer'}
Candidate's Answer:
\"\"\"{req.candidate_answer}\"\"\"

Grade the candidate's response rigorously across 4 dimensions:
1. Technical Accuracy (0-100)
2. Structural Flow & STAR (0-100)
3. Depth & Edge Cases (0-100)
4. Communication Clarity (0-100)

Return your response as a valid JSON object matching this exact structure:
{{
  "overall_score": 82,
  "grade": "Hire / Strong Hire / Lean Hire / Needs Improvement",
  "summary_verdict": "A concise 2-sentence hiring manager assessment.",
  "dimension_scores": [
    {{"name": "Technical Accuracy", "score": 85, "feedback": "Detailed observation on correctness"}},
    {{"name": "Structural Flow & STAR", "score": 80, "feedback": "Evaluation of how structured the answer was"}},
    {{"name": "Depth & Edge Cases", "score": 75, "feedback": "Coverage of collisions, complexities, edge cases"}},
    {{"name": "Communication Clarity", "score": 88, "feedback": "Conciseness and articulation"}}
  ],
  "strengths": ["Strength 1", "Strength 2"],
  "missing_points": ["Missing point 1", "Missing point 2"],
  "model_improved_answer": "An exemplary, articulate answer structured with definitions, mechanics, complexity, collision resolution, and optimizations.",
  "interviewer_follow_up": "A relevant follow-up question digging deeper into performance or architecture."
}}
"""
    data = llm_engine.generate_json(
        prompt=prompt,
        system_instruction="You are a FAANG-caliber Technical Interview Evaluator. Always respond with valid JSON only."
    )

    if not data:
        raise HTTPException(
            status_code=500,
            detail="AI generation failed to evaluate the interview answer. Please retry."
        )

    try:
        return InterviewEvalResponse(**data)
    except Exception as e:
        logger.error(f"Failed to parse interview evaluation response: {e}")
        raise HTTPException(
            status_code=500,
            detail="AI returned malformed interview evaluation data. Please retry."
        )


class QuestionClarifyRequest(BaseModel):
    question: str = Field(..., min_length=5, max_length=2000)
    topic: Optional[str] = Field(default="General", max_length=100)
    target_role: Optional[str] = Field(default="Software Engineer", max_length=150)

class QuestionClarifyResponse(BaseModel):
    clarification: str
    key_focus: str

@router.post("/clarify-interview-question", response_model=QuestionClarifyResponse)
def clarify_interview_question(req: QuestionClarifyRequest):
    """
    Provides a concise, non-spoiling clarification of the question's wording
    without revealing the technical answer or compromising the rubric.
    """
    if not llm_engine.is_available():
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY is not configured on the AI backend."
        )

    prompt = f"""
You are a helpful and fair Technical Interviewer. A candidate asked for clarification on the following question:
"{req.question}"
Role: {req.target_role} | Topic: {req.topic}

Provide a brief, 1-2 sentence clarification that rephrases what the interviewer is asking for in simpler terms.
CRITICAL INSTRUCTION: DO NOT reveal the correct technical solution, code, or answer key. Only explain the scope and intent of the question.

Return JSON:
{{
  "clarification": "We want to understand your approach to handling data collisions and time complexity implications.",
  "key_focus": "Core mechanism and architectural trade-offs"
}}
"""
    data = llm_engine.generate_json(
        prompt=prompt,
        system_instruction="You are a professional technical interviewer clarifying question wording without spoiling answers. Valid JSON only."
    )
    if not data or "clarification" not in data:
        return QuestionClarifyResponse(
            clarification=f"Please focus on explaining the core concepts, mechanisms, and trade-offs of {req.topic or 'this topic'}.",
            key_focus="Conceptual explanation and trade-offs"
        )
    return QuestionClarifyResponse(**data)


class VoiceTurnMessage(BaseModel):
    role: str # "interviewer" or "candidate"
    content: str

class VoiceTurnRequest(BaseModel):
    target_role: str = Field(default="Software Engineer", max_length=150)
    interview_mode: Optional[str] = Field(default="TECHNICAL", max_length=50)
    current_question: str = Field(..., max_length=2000)
    candidate_speech: str = Field(..., max_length=4000)
    history: List[VoiceTurnMessage] = Field(default_factory=list)
    question_idx: int = Field(default=0)
    total_questions: int = Field(default=5)

class VoiceTurnResponse(BaseModel):
    ai_speech_reply: str
    is_question_complete: bool
    next_question: Optional[str] = None
    interviewer_reaction: Optional[str] = None

@router.post("/interview-voice-turn", response_model=VoiceTurnResponse)
def interview_voice_turn(req: VoiceTurnRequest):
    """
    Sub-200ms conversational turn engine for live voice-to-voice interviews.
    Generates natural, human-like spoken interview dialogue and smart follow-up probes.
    """
    if not llm_engine.is_available():
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY is not configured on the AI backend."
        )

    formatted_history = "\n".join([f"{msg.role.upper()}: {msg.content}" for msg in req.history[-6:]])

    prompt = f"""
You are a live, conversational Senior Technical Interviewer conducting an authentic mock interview for a candidate applying for: "{req.target_role}".
Interview Mode: {req.interview_mode}
The candidate just completed answering Question #{req.question_idx + 1} of {req.total_questions}:
"{req.current_question}"

Candidate's Answer:
"{req.candidate_speech}"

Instructions:
1. Provide a single, very concise (1 short sentence) natural interviewer reaction acknowledging what they said (e.g., "Good explanation of event bubbling and delegation.", "Got it, nice breakdown of the complexity trade-offs.", "Understood, solid points on state management.").
2. DO NOT re-explain, clarify, or lecture on the previous question.
3. DO NOT ask follow-ups on the old question.
4. Keep it concise, friendly, and human-like for real-time speech.

Return JSON:
{{
  "ai_speech_reply": "Good breakdown of the DOM event propagation mechanism.",
  "is_question_complete": true,
  "interviewer_reaction": "Candidate demonstrated clear understanding"
}}
"""
    data = llm_engine.generate_json(
        prompt=prompt,
        system_instruction="You are a Staff Technical Interviewer on a live voice call. Respond in 1 brief, natural spoken sentence acknowledging the candidate's answer. Valid JSON only."
    )

    if not data or "ai_speech_reply" not in data:
        return VoiceTurnResponse(
            ai_speech_reply="Got it, thank you for that explanation.",
            is_question_complete=True,
            interviewer_reaction="Answer acknowledged"
        )

    return VoiceTurnResponse(**data)



