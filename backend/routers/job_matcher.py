import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from services.llm_engine import llm_engine
from services.vector_store import job_vector_store

router = APIRouter(prefix="/api/ai", tags=["Job Match Analyzer"])
logger = logging.getLogger("JobMatcherRouter")


class SkillBreakdownItem(BaseModel):
    category: str
    score: int


class JobMatchAnalysisRequest(BaseModel):
    user_skills: List[str] = Field(default_factory=list, max_length=50, example=["Java", "Spring Boot", "PostgreSQL", "Docker"])
    resume_text: Optional[str] = Field(default="", max_length=50000, example="Candidate resume content...")
    job_title: str = Field(..., min_length=1, max_length=150, example="Junior Java Backend Engineer")
    company: str = Field(..., min_length=1, max_length=150, example="Razorpay")
    job_description: str = Field(..., min_length=10, max_length=25000, example="We are looking for enthusiastic freshers or early-career Java developers...")
    target_role: Optional[str] = Field(default="Java Backend Developer", max_length=150)


class JobMatchAnalysisResponse(BaseModel):
    match_score: int
    matching_skills: List[str]
    missing_skills: List[str]
    skill_breakdown: List[SkillBreakdownItem]
    recommendations: List[str]
    current_readiness: int
    estimated_readiness_after_gap: int


class RagJobMatchRequest(BaseModel):
    resume_text: str = Field(..., min_length=10, max_length=50000, example="5+ projects in Java, Spring Boot, Docker, Redis...")
    user_skills: Optional[List[str]] = Field(default_factory=list, max_length=50)
    target_role: Optional[str] = Field(default="All", max_length=150)
    top_k: Optional[int] = Field(default=4, ge=1, le=10)


class RetrievedJobMatch(BaseModel):
    id: str
    title: str
    company: str
    location: str
    role_category: str
    description: str
    match_percentage: float
    key_matching_skills: List[str]
    missing_critical_skills: List[str]
    why_matched: str
    quick_recommendation: str


class RagJobMatchResponse(BaseModel):
    top_matches: List[RetrievedJobMatch]
    overall_market_readiness: int
    primary_strengths: List[str]
    top_high_impact_upskill: str
    rag_metadata: Dict[str, Any]


@router.post("/job-match-analysis", response_model=JobMatchAnalysisResponse)
def analyze_job_match(req: JobMatchAnalysisRequest):
    if not llm_engine.is_available():
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY is not configured on the AI backend. Please configure it in backend/.env."
        )

    skills_context = ", ".join(req.user_skills) if req.user_skills else "No explicit skills provided"
    resume_snippet = req.resume_text[:2000] if req.resume_text else "Not provided"

    prompt = f"""
You are a Principal Engineering Recruiter and Technical Hiring Assessor.
Compare this candidate's background against the provided Job Description (JD) and perform a comprehensive skill-gap and match analysis.

Target Job Title: {req.job_title}
Company: {req.company}
Candidate's Target Role: {req.target_role or req.job_title}
Candidate's Verified Skills: {skills_context}
Candidate's Resume Text (Snippet):
\"\"\"{resume_snippet}\"\"\"

Job Description:
\"\"\"{req.job_description}\"\"\"

Instructions:
1. Extract all key required & nice-to-have technical skills from the Job Description.
2. Accurately identify "matching_skills" (technologies candidate already knows/demonstrates).
3. Accurately identify "missing_skills" (critical tools/languages/concepts required by the JD that candidate lacks).
4. Compute an objective "match_score" (0-100) reflecting genuine qualification alignment.
5. Provide a 4-5 category "skill_breakdown" (e.g. Core Languages, Frameworks, Databases, Cloud & DevOps, System Architecture) with category scores (0-100).
6. Provide concrete, step-by-step preparation "recommendations" tailored to closing the missing skill gaps for this specific job.
7. Provide "current_readiness" (0-100) and "estimated_readiness_after_gap" (0-100) estimate.

Return your response as a valid JSON object matching this exact schema:
{{
  "match_score": 75,
  "matching_skills": ["Java", "Spring Boot", "SQL"],
  "missing_skills": ["Kafka", "AWS EC2", "Redis"],
  "skill_breakdown": [
    {{"category": "Core Backend", "score": 85}},
    {{"category": "Database & Caching", "score": 70}},
    {{"category": "Cloud & DevOps", "score": 45}},
    {{"category": "Message Queues", "score": 30}},
    {{"category": "Architecture & Design", "score": 75}}
  ],
  "recommendations": [
    "Build a message producer/consumer pipeline with Kafka for asynchronous order processing.",
    "Containerize and deploy your Spring Boot microservice to AWS EC2."
  ],
  "current_readiness": 75,
  "estimated_readiness_after_gap": 92
}}
"""

    data = llm_engine.generate_json(
        prompt=prompt,
        system_instruction="You are a FAANG-caliber Technical Hiring Assessor and Career Strategist. Always respond with valid JSON only."
    )

    if not data:
        raise HTTPException(
            status_code=500,
            detail="AI generation failed to produce a job match analysis. Please retry."
        )

    try:
        return JobMatchAnalysisResponse(**data)
    except Exception as e:
        logger.error(f"Failed to parse job match response: {e}")
        raise HTTPException(
            status_code=500,
            detail="AI returned malformed job match analysis data. Please retry."
        )


@router.post("/rag-semantic-job-match", response_model=RagJobMatchResponse)
def rag_semantic_job_match(req: RagJobMatchRequest):
    if not req.resume_text.strip():
        raise HTTPException(status_code=400, detail="Resume text is required for semantic matching.")

    top_k = min(max(req.top_k or 4, 1), 8)
    retrieved_jobs = job_vector_store.search_similar_jobs(
        query_text=f"{req.resume_text} {' '.join(req.user_skills or [])}",
        top_k=top_k,
        role_filter=req.target_role if req.target_role != "All" else None
    )

    if not retrieved_jobs:
        raise HTTPException(status_code=404, detail="No matching jobs found in vector index.")

    formatted_jobs_context = []
    for idx, rj in enumerate(retrieved_jobs, 1):
        formatted_jobs_context.append(
            f"[Job #{idx} ID: {rj['id']}]\n"
            f"Title: {rj['title']} at {rj['company']} ({rj['location']})\n"
            f"Track: {rj['role_category']}\n"
            f"Cosine Similarity Match: {rj['match_percentage']}%\n"
            f"Description: {rj['description']}\n"
        )

    jobs_str = "\n---\n".join(formatted_jobs_context)
    resume_snippet = req.resume_text[:2500]

    prompt = f"""
You are a Principal AI Talent Strategist.
We used a dense vector search engine (Cosine Similarity on 384-dimensional embeddings) to retrieve the top {len(retrieved_jobs)} matching job descriptions from our platform for this candidate.

Candidate Resume Text (Snippet):
\"\"\"{resume_snippet}\"\"\"

Candidate Skills: {', '.join(req.user_skills) if req.user_skills else 'Extracted from resume'}

Top Retrieved Job Matches from Vector Search:
\"\"\"{jobs_str}\"\"\"

Instructions:
1. For EACH of the {len(retrieved_jobs)} retrieved jobs, provide:
   - "key_matching_skills": 2-4 exact technical skills the candidate has that fit this job.
   - "missing_critical_skills": 2-3 specific technical gaps required for this job that candidate should build.
   - "why_matched": A 1-2 sentence punchy explanation of why this candidate's background matches this role.
   - "quick_recommendation": 1 concrete project/action to increase match chance for this specific role.
2. Provide "overall_market_readiness" (0-100).
3. Provide "primary_strengths" (list of 3 key demonstrated technical strengths).
4. Provide "top_high_impact_upskill" (the #1 technology or framework that will unlock the highest number of roles).

Return your response as a valid JSON object matching this schema:
{{
  "overall_market_readiness": 82,
  "primary_strengths": ["Strong Core Backend & REST Architecture", "Relational Database Design", "Unit Testing & Reliability"],
  "top_high_impact_upskill": "Apache Kafka & Asynchronous Message Queues",
  "matches": [
    {{
      "id": "job-1",
      "key_matching_skills": ["Java", "Spring Boot", "SQL"],
      "missing_critical_skills": ["Kafka", "AWS Cloud"],
      "why_matched": "Candidate has strong Java and Spring Boot experience which directly matches Razorpay payments stack.",
      "quick_recommendation": "Build an asynchronous event producer with Kafka to complete the missing queue skill."
    }}
  ]
}}
"""

    llm_output = None
    if llm_engine.is_available():
        llm_output = llm_engine.generate_json(
            prompt=prompt,
            system_instruction="You are an elite AI Career & Hiring Strategist. Always respond with strict, valid JSON only."
        )

    processed_matches: List[RetrievedJobMatch] = []
    llm_matches_map = {}
    if llm_output and isinstance(llm_output.get("matches"), list):
        for m in llm_output["matches"]:
            if isinstance(m, dict) and m.get("id"):
                llm_matches_map[m["id"]] = m

    for rj in retrieved_jobs:
        llm_info = llm_matches_map.get(rj["id"], {})
        processed_matches.append(
            RetrievedJobMatch(
                id=rj["id"],
                title=rj["title"],
                company=rj["company"],
                location=rj["location"],
                role_category=rj["role_category"],
                description=rj["description"],
                match_percentage=rj["match_percentage"],
                key_matching_skills=llm_info.get("key_matching_skills") or ["Demonstrated relevant tech background"],
                missing_critical_skills=llm_info.get("missing_critical_skills") or ["Domain-specific cloud tools"],
                why_matched=llm_info.get("why_matched") or f"Semantic vector alignment of {rj['match_percentage']}% with {rj['company']}'s tech stack requirements.",
                quick_recommendation=llm_info.get("quick_recommendation") or "Review key requirements and tailor project bullet points."
            )
        )

    market_readiness = (
        llm_output.get("overall_market_readiness")
        if llm_output and "overall_market_readiness" in llm_output
        else int(sum(m.match_percentage for m in processed_matches) / max(1, len(processed_matches)))
    )

    return RagJobMatchResponse(
        top_matches=processed_matches,
        overall_market_readiness=market_readiness,
        primary_strengths=llm_output.get("primary_strengths") if llm_output else ["Solid foundational engineering background"],
        top_high_impact_upskill=llm_output.get("top_high_impact_upskill") if llm_output else "Cloud Deployment & Message Queues",
        rag_metadata={
            "retrieval_algorithm": "Dense Cosine Similarity Vector Search",
            "embedding_dimensions": 384,
            "indexed_jobs_count": len(job_vector_store.index),
            "top_k_retrieved": len(processed_matches)
        }
    )

