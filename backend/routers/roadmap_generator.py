import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from services.llm_engine import llm_engine

router = APIRouter(prefix="/api/ai", tags=["Career Roadmap Generator"])
logger = logging.getLogger("RoadmapGeneratorRouter")


class RoadmapSkillItem(BaseModel):
    id: str
    name: str
    category: str
    status: str = Field(default="NOT_STARTED")
    why_learn: str
    what_to_learn: List[str]
    suggested_project: str
    estimated_effort: str


class RoadmapPhaseItem(BaseModel):
    id: int
    phase_number: int
    title: str = Field(default="Phase")
    status: str = Field(default="NOT_STARTED")
    description: str
    skills: List[RoadmapSkillItem]



class RoadmapGenerateRequest(BaseModel):
    target_role: str = Field(..., example="Java Backend Developer")
    current_skills: List[str] = Field(default_factory=list, example=["Java", "SQL", "Git"])
    experience_level: Optional[str] = Field(default="0-2 years (Fresher)", example="0-2 years (Fresher)")


class RoadmapGenerateResponse(BaseModel):
    target_role: str
    phases: List[RoadmapPhaseItem]


@router.post("/generate-roadmap", response_model=RoadmapGenerateResponse)
def generate_career_roadmap(req: RoadmapGenerateRequest):
    if not llm_engine.is_available():
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY is not configured on the AI backend. Please configure it in backend/.env."
        )

    skills_str = ", ".join(req.current_skills) if req.current_skills else "Beginner / Fresh Graduate"

    prompt = f"""
You are a Principal Software Engineering Mentor and Technical Curriculum Architect.
Design a comprehensive, structured, 4-phase career learning roadmap for a student/fresher targeting the role: "{req.target_role}".

Candidate Context:
- Target Role: {req.target_role}
- Current Known Skills: {skills_str}
- Experience Level: {req.experience_level or "0-2 years (Fresher)"}

Instructions:
1. Generate 4 progressive phases:
   - Phase 1: Core Fundamentals & Language Mastery (e.g. internals, OOP, DSA, memory)
   - Phase 2: Production Frameworks & Relational Databases (e.g. APIs, ORM, indexing)
   - Phase 3: Distributed Systems, Caching & Message Queues (e.g. Redis, Kafka, Microservices)
   - Phase 4: Cloud Infrastructure, Containers, DevOps & System Design (e.g. Docker, AWS, CI/CD, scalability)
2. In each phase, include 2-3 essential skills with:
   - "id": unique string (e.g. "sk_1_1", "sk_1_2")
   - "name": skill title (e.g. "Core Java & JVM Internals")
   - "category": category name (e.g. "Languages", "Backend Frameworks", "Databases", "DevOps & Cloud")
   - "status": "NOT_STARTED" (or "COMPLETED" if clearly already mastered in current skills)
   - "why_learn": 1-2 sentences explaining why hiring managers expect this skill for {req.target_role}
   - "what_to_learn": 3-4 specific topics to master (e.g. ["Memory Model & Garbage Collection", "Collections Framework Internals", "Multithreading & ExecutorService"])
   - "suggested_project": a concrete, high-impact hands-on project to build (e.g. "Concurrent In-Memory Cache with TTL & Eviction Policies")
   - "estimated_effort": realistic timeframe (e.g. "2–3 Weeks (15 hrs/wk)")

Return your response as a valid JSON object matching this exact schema:
{{
  "target_role": "{req.target_role}",
  "phases": [
    {{
      "id": 1,
      "phase_number": 1,
      "title": "Core Language & Backend Foundations",
      "status": "NOT_STARTED",
      "description": "Master language internals, data structures, and object-oriented architecture.",
      "skills": [
        {{
          "id": "sk_1_1",
          "name": "Core Language Internals",
          "category": "Languages",
          "status": "NOT_STARTED",
          "why_learn": "Hiring rounds heavily test data structure internals and memory efficiency.",
          "what_to_learn": ["Collections Framework", "Concurrency & Thread Pools", "JVM Mechanics"],
          "suggested_project": "Concurrent Web Server with Custom ThreadPool",
          "estimated_effort": "2 Weeks (12 hrs/wk)"
        }}
      ]
    }}
  ]
}}
"""

    data = llm_engine.generate_json(
        prompt=prompt,
        system_instruction="You are a Principal Tech Lead and Career Architect. Always respond with valid JSON only."
    )

    if not data or "phases" not in data or not isinstance(data["phases"], list):
        raise HTTPException(
            status_code=500,
            detail="AI generation failed to produce a valid career roadmap. Please retry."
        )

    try:
        # Normalize status if needed
        for p in data["phases"]:
            if "status" not in p:
                p["status"] = "NOT_STARTED"
            for s in p.get("skills", []):
                if "status" not in s:
                    s["status"] = "NOT_STARTED"
        return RoadmapGenerateResponse(
            target_role=req.target_role,
            phases=[RoadmapPhaseItem(**p) for p in data["phases"]]
        )
    except Exception as e:
        logger.error(f"Failed to parse generated roadmap: {e}")
        raise HTTPException(
            status_code=500,
            detail="AI returned malformed roadmap data. Please retry."
        )


class SuggestSkillsRequest(BaseModel):
    role: str = Field(..., example="Data Analyst")


class SuggestSkillsResponse(BaseModel):
    role: str
    skills: List[str]


ROLE_SKILLS_CATALOG: Dict[str, List[str]] = {
    "java": ["Java", "Spring Boot", "Hibernate / JPA", "SQL", "PostgreSQL", "MySQL", "REST APIs", "Microservices", "Redis", "Apache Kafka", "Docker", "AWS", "JUnit / Mockito", "Git", "System Design"],
    "frontend": ["JavaScript", "TypeScript", "React", "Next.js", "HTML/CSS", "Tailwind CSS", "Vue.js", "Redux", "REST APIs", "GraphQL", "WebSockets", "Jest / Cypress", "Git", "Vite"],
    "full stack": ["React", "Node.js", "Express.js", "TypeScript", "JavaScript", "Next.js", "PostgreSQL", "MongoDB", "REST APIs", "GraphQL", "Docker", "AWS", "Tailwind CSS", "Git", "CI/CD"],
    "data analyst": ["Python", "SQL", "Pandas", "NumPy", "Power BI", "Tableau", "Excel / Google Sheets", "Data Visualization", "Statistical Analysis", "PostgreSQL", "MySQL", "Git", "Jupyter Notebook"],
    "devops": ["Docker", "Kubernetes", "AWS", "CI/CD (GitHub Actions / Jenkins)", "Terraform", "Linux / Bash", "Python", "Prometheus / Grafana", "Ansible", "Git", "Microservices", "GCP / Azure"],
    "cybersecurity": ["Network Security", "Linux / Bash", "Python", "SIEM Tools", "Wireshark", "Penetration Testing", "Vulnerability Assessment", "Cryptography", "OWASP Top 10", "Firewalls & IDS/IPS", "Incident Response"],
    "ai/ml": ["Python", "PyTorch", "TensorFlow", "Scikit-Learn", "Pandas", "NumPy", "Machine Learning Algorithms", "Deep Learning", "NLP / LLMs", "Computer Vision", "Docker", "FastAPI / Flask", "MLOps", "Git"],
    "python": ["Python", "FastAPI", "Django", "Flask", "PostgreSQL", "SQL", "Redis", "Celery", "Docker", "AWS", "REST APIs", "PyTest", "Git", "Microservices"]
}


@router.post("/suggest-role-skills", response_model=SuggestSkillsResponse)
def suggest_role_skills(req: SuggestSkillsRequest):
    role_name = req.role.strip()
    if not role_name:
        raise HTTPException(status_code=400, detail="Role name is required.")

    role_lower = role_name.lower()
    matched_preset: Optional[List[str]] = None
    for k, v in ROLE_SKILLS_CATALOG.items():
        if k in role_lower:
            matched_preset = v
            break

    if not llm_engine.is_available():
        return SuggestSkillsResponse(
            role=role_name,
            skills=matched_preset or ["Python", "SQL", "Git", "REST APIs", "Docker", "Data Structures", "Linux"]
        )

    prompt = f"""List the top 12-16 most essential, industry-standard technical skills, frameworks, databases, and tools required for a college student or fresher aiming for the role: "{role_name}".
Return your response as a valid JSON object matching this schema:
{{
  "skills": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5", "Skill6", "Skill7", "Skill8", "Skill9", "Skill10", "Skill11", "Skill12"]
}}
"""
    data = llm_engine.generate_json(
        prompt=prompt,
        system_instruction="You are an expert technical recruiter and engineering curriculum architect. Always respond with valid JSON only."
    )

    if data and "skills" in data and isinstance(data["skills"], list) and len(data["skills"]) > 0:
        return SuggestSkillsResponse(role=role_name, skills=data["skills"])

    return SuggestSkillsResponse(
        role=role_name,
        skills=matched_preset or ["Python", "SQL", "Git", "REST APIs", "Docker", "Data Structures", "Linux"]
    )

