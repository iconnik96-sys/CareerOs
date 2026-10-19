import json
import logging
import random
import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from services.llm_engine import llm_engine

router = APIRouter(prefix="/api/ai", tags=["Mock Interview Evaluator"])
logger = logging.getLogger("InterviewEvaluatorRouter")

def is_skipped_or_insufficient(answer: Optional[str]) -> bool:
    """
    Strictly detects if a candidate skipped, passed, said nothing, or provided
    trivial non-answers that must receive 0 marks.
    """
    if not answer:
        return True
    cleaned = answer.strip().lower()
    cleaned = cleaned.rstrip(".?!,")
    if len(cleaned) < 12:
        return True

    # If the candidate provided a substantial spoken response (>= 50 chars), do not flag as skipped
    # unless it explicitly contains an internal system skip tag like '[skipped'
    if len(cleaned) >= 50:
        return cleaned.startswith("[skipped")

    skip_phrases = [
        "skip", "skipped", "i skip", "pass", "i pass", "next question",
        "i don't know", "dont know", "no idea", "no answer", "not sure",
        "[skipped", "candidate participated in hands-free",
        "can we skip", "skip this question", "next please", "idk"
    ]
    if any(cleaned == p or cleaned.startswith(p + " ") or cleaned.startswith(p + ".") for p in skip_phrases):
        return True
    return False

class DimensionScore(BaseModel):
    name: str
    score: int
    feedback: str

class InterviewEvalRequest(BaseModel):
    question: str = Field(..., min_length=5, max_length=2000, example="How does HashMap work internally in Java?")
    candidate_answer: str = Field(default="", min_length=0, max_length=8000, example="It uses an array of nodes and hashCode to find bucket index.")
    topic: Optional[str] = Field(default="Java", max_length=100, example="Java")
    difficulty: Optional[str] = Field(default="Medium", max_length=50, example="Medium")
    target_role: Optional[str] = Field(default="Java Backend Developer", max_length=150, example="Java Backend Developer")

class InterviewEvalResponse(BaseModel):
    overall_score: int
    grade: str # "Strong Hire", "Hire / Competent", "Needs Practice", "Strong No Hire"
    summary_verdict: str
    dimension_scores: List[DimensionScore]
    strengths: List[str]
    missing_points: List[str]
    model_improved_answer: str
    interviewer_follow_up: str

class SessionQuestionItem(BaseModel):
    id: Optional[str] = None
    question: str
    topic: Optional[str] = "General"
    difficulty: Optional[str] = "Medium"
    candidate_answer: Optional[str] = ""
    status: Optional[str] = "ANSWERED"

class QuestionResult(BaseModel):
    question_idx: int
    question: str
    topic: str
    difficulty: str
    status: str # "ANSWERED" or "SKIPPED"
    score: int
    candidate_answer: str
    feedback: str
    dimension_scores: List[DimensionScore]

class SessionEvalRequest(BaseModel):
    target_role: Optional[str] = "Software Engineer"
    interview_mode: Optional[str] = "TECHNICAL"
    difficulty: Optional[str] = "Medium"
    questions: List[SessionQuestionItem]

class SessionEvalResponse(BaseModel):
    overall_score: int
    grade: str # "Strong Hire", "Hire / Competent", "Needs Practice", "Strong No Hire"
    summary_verdict: str
    total_questions: int
    answered_count: int
    skipped_count: int
    dimension_scores: List[DimensionScore]
    per_question_results: List[QuestionResult]
    strengths: List[str]
    missing_points: List[str]
    model_improved_answer: Optional[str] = None
    interviewer_follow_up: Optional[str] = None


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

    import random

    resolved_role = req.role or req.target_role or "Java Backend Developer"
    question_count = max(1, min(req.count or 5, 8))

    focus_angles = [
        "deep language/framework internals and hidden runtime mechanisms",
        "concurrency, race conditions, thread safety, and memory management",
        "real-world production outages, incident debugging, and post-mortems",
        "performance optimization, latency reduction, and database bottlenecks",
        "architectural trade-offs between competing design patterns and libraries",
        "security vulnerabilities, OWASP pitfalls, and payload sanitization",
        "distributed systems scale, eventual consistency, and caching invalidation strategies",
        "asynchronous processing, event loops, message queues, and backpressure handling"
    ]
    random_angle = random.choice(focus_angles)
    session_entropy = uuid.uuid4().hex[:8]

    topic_str = f"focusing specifically on {req.topic}" if req.topic and req.topic != "All" else "covering diverse topics across core fundamentals, advanced architecture, databases, debugging, and system design"
    diff_str = f"at {req.difficulty} difficulty level" if req.difficulty and req.difficulty != "All" else "distributed across Easy (20%), Medium (50%), and Hard (30%) difficulty levels"

    prompt = f"""
Generate {question_count} FRESH, DISTINCT, and UNPREDICTABLE technical interview questions for a candidate preparing for the role: "{resolved_role}".
Topic Area: {topic_str}
Difficulty Level: {diff_str}
Special Session Angle: Prioritize {random_angle}. (Unique Session Seed: {session_entropy})

CRITICAL DIVERSITY INSTRUCTIONS:
1. Ensure these questions are unique and distinct from standard repetitive textbook trivia.
2. Ask real-world scenario, debugging, and architectural trade-off questions asked by Staff Engineers at top tech companies.
3. Vary the concepts tested across the {question_count} questions.
4. For each question, provide:
   - "id": a unique string (e.g. "iq_{uuid.uuid4().hex[:6]}_1")
   - "role": "{resolved_role}"
   - "difficulty": "Easy", "Medium", or "Hard"
   - "topic": relevant topic tag (e.g. "Core Fundamentals", "Frameworks", "Databases", "System Design", "Cloud & DevOps", "Concurrency", etc.)
   - "question": clearly articulated technical or scenario question
   - "answer_key": concise 1-sentence technical takeaway
   - "tips": 2 concise bullet points on key evaluation factors
   - "sample_answer": concise 2-sentence exemplary response highlighting key mechanics and architectural trade-offs

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
        "Explain write amplification on INSERT/UPDATE"
      ],
      "sample_answer": "B-Tree indexes maintain sorted tree structures ideal for range scans and ordering, whereas Hash indexes provide O(1) equality lookups but cannot support ordering. Over-indexing creates write amplification on insert/update operations and increases cache footprint."
    }}
  ]
}}
"""
    data = llm_engine.generate_json(
        prompt=prompt,
        system_instruction="You are a Staff Technical Interviewer and Engineering Hiring Manager at a top-tier tech company. Always generate fresh, distinct interview questions. Output valid JSON only.",
        temperature=0.7
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
    # Strict Zero-Tolerance Check for Skipped or Insufficient Answers
    if is_skipped_or_insufficient(req.candidate_answer):
        return InterviewEvalResponse(
            overall_score=0,
            grade="Strong No Hire",
            summary_verdict="Candidate skipped this question without articulating a technical answer. 0 marks awarded under strict technical assessment rubrics.",
            dimension_scores=[
                DimensionScore(name="Technical Accuracy", score=0, feedback="No technical explanation provided (Question skipped)."),
                DimensionScore(name="Structural Flow & STAR", score=0, feedback="No structured response provided."),
                DimensionScore(name="Depth & Edge Cases", score=0, feedback="Zero technical depth or edge cases covered."),
                DimensionScore(name="Communication Clarity", score=0, feedback="Candidate skipped this question without articulating a response.")
            ],
            strengths=[],
            missing_points=["Complete technical answer was omitted. Candidate skipped this question without providing an explanation."],
            model_improved_answer="A comprehensive Staff-level answer should articulate core definitions, underlying internal mechanisms, algorithmic time & space complexity, and production trade-offs.",
            interviewer_follow_up="Review foundational technical concepts for this topic and practice verbal delivery without skipping."
        )

    if not llm_engine.is_available():
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY is not configured on the AI backend. Please configure it in backend/.env."
        )

    prompt = f"""
You are an uncompromising Staff Software Engineer and Senior Technical Interviewer conducting a rigorous mock interview for:
Role: {req.target_role or 'Software Engineer'}
Topic: {req.topic or 'General'} | Difficulty: {req.difficulty or 'Medium'}

Question: "{req.question}"
Candidate's Spoken Answer:
\"\"\"{req.candidate_answer}\"\"\"

STRICT EVALUATION RUBRIC:
- Grade with authentic FAANG Staff Engineer rigor. Do NOT inflate grades or award unearned marks.
- Score Scale:
  * 0-29: Unacceptable / Completely incorrect / Irrelevant rambling / Superficial keywords only.
  * 30-49: Weak / Missed fundamental mechanics or core definitions.
  * 50-64: Partial / Understands basic premise but lacks depth or made noticeable technical errors.
  * 65-79: Competent / Good clarity, accurate, but misses edge cases or production trade-offs.
  * 80-100: Staff-level / Deep architectural understanding, accurate mechanics, complexity, and trade-offs.
- The candidate's response must be graded across 4 dimensions (0-100):
  1. Technical Accuracy
  2. Structural Flow & STAR
  3. Depth & Edge Cases
  4. Communication Clarity
- The 'overall_score' MUST equal the exact rounded arithmetic mean of the 4 dimension scores: round((Technical + STAR + Depth + Clarity) / 4).
- Grade mapping:
  * 80-100: "Strong Hire"
  * 65-79: "Hire / Competent"
  * 50-64: "Needs Practice"
  * 0-49: "Strong No Hire"

Return your response as a valid JSON object matching this exact structure:
{{
  "overall_score": 75,
  "grade": "Hire / Competent",
  "summary_verdict": "A concise 2-sentence hiring manager assessment.",
  "dimension_scores": [
    {{"name": "Technical Accuracy", "score": 75, "feedback": "Detailed observation on correctness"}},
    {{"name": "Structural Flow & STAR", "score": 75, "feedback": "Evaluation of how structured the answer was"}},
    {{"name": "Depth & Edge Cases", "score": 70, "feedback": "Coverage of collisions, complexities, edge cases"}},
    {{"name": "Communication Clarity", "score": 80, "feedback": "Conciseness and articulation"}}
  ],
  "strengths": ["Strength 1", "Strength 2"],
  "missing_points": ["Missing point 1", "Missing point 2"],
  "model_improved_answer": "An exemplary, articulate Staff-level answer structured with definitions, mechanics, complexity, and trade-offs.",
  "interviewer_follow_up": "A relevant follow-up question digging deeper into performance or architecture."
}}
"""
    data = llm_engine.generate_json(
        prompt=prompt,
        system_instruction="You are a FAANG-caliber Technical Interview Evaluator. Apply strict grading rubrics. Valid JSON only.",
        temperature=0.1
    )

    if not data:
        raise HTTPException(
            status_code=500,
            detail="AI generation failed to evaluate the interview answer. Please retry."
        )

    try:
        # Enforce exact rounded arithmetic mean of dimensions
        if "dimension_scores" in data and isinstance(data["dimension_scores"], list) and len(data["dimension_scores"]) > 0:
            dim_avg = round(sum(d.get("score", 0) for d in data["dimension_scores"]) / len(data["dimension_scores"]))
            data["overall_score"] = dim_avg
            if dim_avg >= 80:
                data["grade"] = "Strong Hire"
            elif dim_avg >= 65:
                data["grade"] = "Hire / Competent"
            elif dim_avg >= 50:
                data["grade"] = "Needs Practice"
            else:
                data["grade"] = "Strong No Hire"
        return InterviewEvalResponse(**data)
    except Exception as e:
        logger.error(f"Failed to parse interview evaluation response: {e}")
        raise HTTPException(
            status_code=500,
            detail="AI returned malformed interview evaluation data. Please retry."
        )


@router.post("/evaluate-interview-session", response_model=SessionEvalResponse)
def evaluate_interview_session(req: SessionEvalRequest):
    """
    Strict Session-Wide Grading:
    - If a candidate skips any question, that question strictly receives 0 marks.
    - If all questions are skipped, final score is strictly 0 / 100 ('Strong No Hire').
    - The final overall score and dimensions are strictly averaged across ALL questions in the session:
      final_score = round(sum(scores) / total_questions)
    """
    total_q = len(req.questions)
    if total_q == 0:
        return SessionEvalResponse(
            overall_score=0,
            grade="Strong No Hire",
            summary_verdict="No interview questions were presented for evaluation.",
            total_questions=0,
            answered_count=0,
            skipped_count=0,
            dimension_scores=[
                DimensionScore(name="Technical Accuracy", score=0, feedback="No questions evaluated."),
                DimensionScore(name="Structural Flow & STAR", score=0, feedback="No questions evaluated."),
                DimensionScore(name="Depth & Edge Cases", score=0, feedback="No questions evaluated."),
                DimensionScore(name="Communication Clarity", score=0, feedback="No questions evaluated.")
            ],
            per_question_results=[],
            strengths=[],
            missing_points=["No questions were completed."]
        )

    # Classify questions into answered vs skipped
    classified_items = []
    answered_items = []
    for idx, q in enumerate(req.questions):
        raw_ans = (q.candidate_answer or "").strip()
        is_skip = (q.status == "SKIPPED") or is_skipped_or_insufficient(raw_ans)
        item = {
            "idx": idx,
            "id": q.id or f"q_{idx+1}",
            "question": q.question,
            "topic": q.topic or "General",
            "difficulty": q.difficulty or "Medium",
            "answer": raw_ans if not is_skip else "",
            "is_skip": is_skip
        }
        classified_items.append(item)
        if not is_skip:
            answered_items.append(item)

    skipped_count = len(classified_items) - len(answered_items)
    answered_count = len(answered_items)

    # CASE 1: Candidate skipped ALL questions! Strictly 0 / 100!
    if answered_count == 0:
        per_q_results = []
        for item in classified_items:
            per_q_results.append(QuestionResult(
                question_idx=item["idx"],
                question=item["question"],
                topic=item["topic"],
                difficulty=item["difficulty"],
                status="SKIPPED",
                score=0,
                candidate_answer="(Skipped — No verbal answer provided)",
                feedback="Question skipped by candidate without answering. 0 marks awarded under strict grading rubrics.",
                dimension_scores=[
                    DimensionScore(name="Technical Accuracy", score=0, feedback="Skipped (0/100)"),
                    DimensionScore(name="Structural Flow & STAR", score=0, feedback="Skipped (0/100)"),
                    DimensionScore(name="Depth & Edge Cases", score=0, feedback="Skipped (0/100)"),
                    DimensionScore(name="Communication Clarity", score=0, feedback="Skipped (0/100)")
                ]
            ))

        return SessionEvalResponse(
            overall_score=0,
            grade="Strong No Hire",
            summary_verdict=f"Candidate skipped all {total_q} interview questions without providing answers. Zero marks awarded across all competencies (0/100).",
            total_questions=total_q,
            answered_count=0,
            skipped_count=skipped_count,
            dimension_scores=[
                DimensionScore(name="Technical Accuracy", score=0, feedback="All technical questions were skipped (0/100)."),
                DimensionScore(name="Structural Flow & STAR", score=0, feedback="No structured responses provided (0/100)."),
                DimensionScore(name="Depth & Edge Cases", score=0, feedback="No technical depth demonstrated (0/100)."),
                DimensionScore(name="Communication Clarity", score=0, feedback="No verbal answers provided for evaluation (0/100).")
            ],
            per_question_results=per_q_results,
            strengths=[],
            missing_points=[f"Candidate skipped all {total_q} questions. Every technical question in this session was left unanswered."],
            model_improved_answer="To pass technical rounds, candidates must actively attempt every question, explain underlying mechanics, and analyze time/space complexities.",
            interviewer_follow_up="Study core engineering fundamentals for this track and practice articulating answers out loud without skipping."
        )

    # CASE 2: At least one question was answered. Evaluate answered questions via LLM.
    if not llm_engine.is_available():
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY is not configured on the AI backend."
        )

    eval_prompt_questions = []
    for item in answered_items:
        eval_prompt_questions.append({
            "question_idx": item["idx"],
            "question": item["question"],
            "topic": item["topic"],
            "difficulty": item["difficulty"],
            "candidate_answer": item["answer"]
        })

    prompt = f"""
You are an uncompromising Staff Software Engineer and Senior Technical Hiring Manager conducting a strict technical interview for: "{req.target_role or 'Software Engineer'}".
Interview Mode: {req.interview_mode or 'TECHNICAL'}

Evaluate each of the following candidate answers individually:
{json.dumps(eval_prompt_questions, indent=2)}

STRICT EVALUATION RUBRIC:
- Grade with authentic FAANG Staff Engineer rigor. Do NOT inflate grades or award unearned marks.
- Score Scale per Question:
  * 0-29: Unacceptable / Completely incorrect / Irrelevant rambling / Superficial keywords only.
  * 30-49: Weak / Missed fundamental mechanics or core definitions.
  * 50-64: Partial / Understands basic premise but lacks depth or made noticeable technical errors.
  * 65-79: Competent / Good clarity, accurate, but misses edge cases or production trade-offs.
  * 80-100: Staff-level / Deep architectural understanding, accurate mechanics, complexity, and trade-offs.
- For each evaluated question, score 4 dimensions (0-100):
  1. Technical Accuracy
  2. Structural Flow & STAR
  3. Depth & Edge Cases
  4. Communication Clarity
- The question's overall_score MUST be the exact rounded mean of its 4 dimensions.

Return valid JSON matching this schema:
{{
  "evaluated_questions": [
    {{
      "question_idx": 0,
      "overall_score": 75,
      "dimension_scores": [
        {{"name": "Technical Accuracy", "score": 75, "feedback": "Detailed observation on correctness"}},
        {{"name": "Structural Flow & STAR", "score": 75, "feedback": "Evaluation of structure and STAR approach"}},
        {{"name": "Depth & Edge Cases", "score": 70, "feedback": "Evaluation of edge case and system depth"}},
        {{"name": "Communication Clarity", "score": 80, "feedback": "Evaluation of conciseness and clarity"}}
      ],
      "feedback": "Concise summary feedback for this answer",
      "strengths": ["Strength point 1"],
      "missing_points": ["Missing point 1"]
    }}
  ],
  "overall_summary": "Concise 2-sentence executive hiring verdict for the answered technical questions.",
  "strengths": ["Overall strength 1", "Overall strength 2"],
  "missing_points": ["Key technical gap 1", "Key technical gap 2"],
  "model_improved_answer": "An exemplary Staff-level answer demonstrating depth, complexity, and production trade-offs.",
  "interviewer_follow_up": "A targeted architectural follow-up topic for further study."
}}
"""
    data = llm_engine.generate_json(
        prompt=prompt,
        system_instruction="You are a FAANG-caliber Technical Interview Evaluator. Apply strict grading rubrics. Valid JSON only.",
        temperature=0.1
    )

    if not data or "evaluated_questions" not in data:
        raise HTTPException(
            status_code=500,
            detail="AI generation failed to evaluate the interview session questions. Please retry."
        )

    # Map LLM evaluations by question index
    eval_by_idx: Dict[int, Any] = {}
    for ev in data.get("evaluated_questions", []):
        q_idx = ev.get("question_idx")
        if q_idx is not None:
            eval_by_idx[q_idx] = ev

    # Build per-question results and aggregate session dimension totals across ALL total_q questions
    per_q_results: List[QuestionResult] = []
    dim_totals = {
        "Technical Accuracy": 0,
        "Structural Flow & STAR": 0,
        "Depth & Edge Cases": 0,
        "Communication Clarity": 0
    }
    dim_feedback_samples = {
        "Technical Accuracy": [],
        "Structural Flow & STAR": [],
        "Depth & Edge Cases": [],
        "Communication Clarity": []
    }
    total_score_sum = 0
    all_strengths = list(data.get("strengths", []))
    all_missing_points = list(data.get("missing_points", []))

    for item in classified_items:
        q_idx = item["idx"]
        if item["is_skip"]:
            # Skipped question: strictly 0 marks for all dimensions
            q_res = QuestionResult(
                question_idx=q_idx,
                question=item["question"],
                topic=item["topic"],
                difficulty=item["difficulty"],
                status="SKIPPED",
                score=0,
                candidate_answer="(Skipped — No verbal answer provided)",
                feedback="Question skipped by candidate without answering. 0 marks awarded under strict grading rubrics.",
                dimension_scores=[
                    DimensionScore(name="Technical Accuracy", score=0, feedback="Skipped (0/100)"),
                    DimensionScore(name="Structural Flow & STAR", score=0, feedback="Skipped (0/100)"),
                    DimensionScore(name="Depth & Edge Cases", score=0, feedback="Skipped (0/100)"),
                    DimensionScore(name="Communication Clarity", score=0, feedback="Skipped (0/100)")
                ]
            )
            per_q_results.append(q_res)
            all_missing_points.append(f"Question #{q_idx+1} ('{item['question'][:60]}...') was skipped (0/100).")
        else:
            ev = eval_by_idx.get(q_idx, {})
            raw_dim_scores = ev.get("dimension_scores", [])
            parsed_dims: List[DimensionScore] = []
            q_dim_sum = 0
            
            for d in raw_dim_scores:
                d_name = d.get("name", "Technical Accuracy")
                d_score = max(0, min(100, int(d.get("score", 0))))
                d_feedback = d.get("feedback", "")
                parsed_dims.append(DimensionScore(name=d_name, score=d_score, feedback=d_feedback))
                q_dim_sum += d_score
                if d_name in dim_totals:
                    dim_totals[d_name] += d_score
                    if d_feedback:
                        dim_feedback_samples[d_name].append(d_feedback)

            # If dims were missing, synthesize fallback from ev.get("overall_score")
            if not parsed_dims:
                ev_sc = max(0, min(100, int(ev.get("overall_score", 50))))
                for name in ["Technical Accuracy", "Structural Flow & STAR", "Depth & Edge Cases", "Communication Clarity"]:
                    parsed_dims.append(DimensionScore(name=name, score=ev_sc, feedback=ev.get("feedback", "")))
                    dim_totals[name] += ev_sc

            q_score = round(q_dim_sum / len(parsed_dims)) if parsed_dims else 0
            total_score_sum += q_score

            q_res = QuestionResult(
                question_idx=q_idx,
                question=item["question"],
                topic=item["topic"],
                difficulty=item["difficulty"],
                status="ANSWERED",
                score=q_score,
                candidate_answer=item["answer"],
                feedback=ev.get("feedback", f"Candidate scored {q_score}/100."),
                dimension_scores=parsed_dims
            )
            per_q_results.append(q_res)

    # CRITICAL: Average across ALL total_q questions in the session (skipped questions strictly pull the average down)
    session_overall_score = round(total_score_sum / total_q)
    final_dimension_scores = []
    for d_name, d_total in dim_totals.items():
        d_avg = round(d_total / total_q)
        samples = dim_feedback_samples.get(d_name, [])
        feedback_text = "; ".join(samples[:2]) if samples else f"Average dimension rating across all {total_q} questions."
        if skipped_count > 0:
            feedback_text += f" (Reflects {skipped_count} skipped questions penalizing this vector)."
        final_dimension_scores.append(DimensionScore(name=d_name, score=d_avg, feedback=feedback_text))

    # Determine strictly calibrated grade
    if session_overall_score >= 80:
        session_grade = "Strong Hire"
    elif session_overall_score >= 65:
        session_grade = "Hire / Competent"
    elif session_overall_score >= 50:
        session_grade = "Needs Practice"
    else:
        session_grade = "Strong No Hire"

    if skipped_count > 0:
        session_verdict = f"Candidate answered {answered_count} of {total_q} questions and skipped {skipped_count} questions. Skipped questions received 0 marks according to strict grading rubrics. Overall score: {session_overall_score}/100 ({session_grade})."
    else:
        session_verdict = data.get("overall_summary") or f"Candidate completed all {total_q} interview questions. Overall score: {session_overall_score}/100 ({session_grade})."

    return SessionEvalResponse(
        overall_score=session_overall_score,
        grade=session_grade,
        summary_verdict=session_verdict,
        total_questions=total_q,
        answered_count=answered_count,
        skipped_count=skipped_count,
        dimension_scores=final_dimension_scores,
        per_question_results=per_q_results,
        strengths=all_strengths[:5],
        missing_points=all_missing_points[:6],
        model_improved_answer=data.get("model_improved_answer"),
        interviewer_follow_up=data.get("interviewer_follow_up")
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



