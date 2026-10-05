import io
import re
import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from services.llm_engine import llm_engine

try:
    import pypdf
except ImportError:
    pypdf = None

router = APIRouter(prefix="/api/ai", tags=["Deep Resume & JD Analyzer"])
logger = logging.getLogger("ResumeAnalyzerRouter")

# Comprehensive technology & skill catalog for heuristic detection & analysis
TECH_CATALOG = {
    # Core Languages
    "Java": ["java", "core java", "j2ee", "multithreading", "collections framework", "jvm"],
    "Python": ["python", "python3", "django", "flask", "fastapi", "pandas", "numpy"],
    "JavaScript": ["javascript", "es6", "vanilla js", "js"],
    "TypeScript": ["typescript", "ts"],
    "C++": ["c++", "cpp"],
    "C#": ["c#", ".net", "dotnet", "asp.net"],
    "Go / Golang": ["golang", "go language"],
    "Rust": ["rust"],
    "PHP": ["php", "laravel"],
    "Ruby": ["ruby", "ruby on rails", "rails"],
    "Kotlin": ["kotlin"],
    "Swift": ["swift", "ios"],

    # Backend Frameworks
    "Spring Boot": ["spring boot", "spring framework", "spring security", "spring data", "spring mvc", "hibernate", "jpa"],
    "Node.js": ["node.js", "nodejs", "express", "express.js", "nestjs"],
    "FastAPI": ["fastapi", "uvicorn", "pydantic"],
    "Django": ["django", "django rest framework", "drf"],
    "Flask": ["flask"],

    # Frontend Frameworks & Libraries
    "React": ["react", "react.js", "reactjs", "redux", "next.js", "nextjs"],
    "Vue.js": ["vue", "vue.js", "vuejs", "nuxt"],
    "Angular": ["angular", "angularjs"],
    "HTML/CSS": ["html", "html5", "css", "css3", "sass", "tailwind", "bootstrap"],

    # Databases & Caching
    "PostgreSQL": ["postgresql", "postgres", "psql"],
    "MySQL": ["mysql"],
    "SQL / RDBMS": ["sql", "rdbms", "relational database", "sqlite", "oracle sql"],
    "MongoDB": ["mongodb", "mongo", "nosql", "mongoose"],
    "Redis": ["redis", "in-memory cache", "caching layer"],
    "Cassandra": ["cassandra"],
    "DynamoDB": ["dynamodb"],
    "Elasticsearch": ["elasticsearch", "elastic search", "kibana"],

    # Cloud & DevOps
    "AWS": ["aws", "amazon web services", "ec2", "s3", "rds", "lambda", "cloudwatch", "iam"],
    "Docker": ["docker", "container", "containerization", "docker-compose", "dockerfile"],
    "Kubernetes": ["kubernetes", "k8s", "helm"],
    "Google Cloud (GCP)": ["gcp", "google cloud"],
    "Microsoft Azure": ["azure"],
    "CI/CD Pipelines": ["ci/cd", "github actions", "jenkins", "gitlab ci", "circleci"],
    "Linux / Bash": ["linux", "bash", "unix", "shell scripting", "ubuntu"],

    # Architecture & Messaging
    "RESTful APIs": ["rest", "restful", "rest api", "rest apis", "api design", "json"],
    "GraphQL": ["graphql"],
    "Microservices": ["microservices", "microservice", "distributed systems", "service oriented"],
    "Apache Kafka": ["kafka", "apache kafka", "event streaming", "message broker"],
    "RabbitMQ": ["rabbitmq", "message queue", "amqp"],
    "WebSockets": ["websocket", "websockets", "socket.io"],
    "System Design": ["system design", "load balancing", "horizontal scaling", "rate limiting", "sharding"],

    # Testing & Code Quality
    "JUnit & Mockito": ["junit", "junit 5", "mockito", "test-driven", "tdd"],
    "PyTest": ["pytest", "unittest"],
    "Jest & Cypress": ["jest", "cypress", "mocha", "selenium"],
    "Git & GitHub": ["git", "github", "gitlab", "version control", "pull requests"]
}

# Role target expectations
ROLE_SKILL_REQUIREMENTS = {
    "java": ["Java", "Spring Boot", "SQL / RDBMS", "PostgreSQL", "RESTful APIs", "Docker", "AWS", "Apache Kafka", "JUnit & Mockito", "System Design"],
    "python": ["Python", "FastAPI", "Django", "SQL / RDBMS", "PostgreSQL", "RESTful APIs", "Docker", "AWS", "PyTest", "Redis"],
    "frontend": ["React", "JavaScript", "TypeScript", "HTML/CSS", "RESTful APIs", "Git & GitHub", "Jest & Cypress"],
    "full stack": ["React", "Node.js", "JavaScript", "TypeScript", "SQL / RDBMS", "RESTful APIs", "Docker", "Git & GitHub", "MongoDB"],
    "devops": ["Docker", "Kubernetes", "AWS", "CI/CD Pipelines", "Linux / Bash", "Git & GitHub", "Python", "System Design"],
    "data": ["Python", "SQL / RDBMS", "PostgreSQL", "AWS", "Git & GitHub", "Docker"]
}


def extract_skills_from_text(text: str) -> List[str]:
    """Scans text against TECH_CATALOG and returns deduplicated matching skill names."""
    lower_text = " " + text.lower() + " "
    detected = []
    for skill_name, aliases in TECH_CATALOG.items():
        for alias in aliases:
            # Word boundary matching for short acronyms like 'go', 'c#', 'aws', 'sql'
            pattern = r'(?:\b|_)' + re.escape(alias) + r'(?:\b|_)'
            if re.search(pattern, lower_text):
                detected.append(skill_name)
                break
    return detected


def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Extracts clean text content from PDF binary using pypdf."""
    if not pypdf:
        # Fallback basic string extraction
        try:
            return pdf_bytes.decode("utf-8", errors="ignore")
        except Exception:
            return ""

    try:
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        extracted_pages = []
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            if page_text.strip():
                extracted_pages.append(page_text.strip())
        full_text = "\n\n".join(extracted_pages)
        return full_text.strip()
    except Exception as e:
        logger.error(f"Error parsing PDF with pypdf: {e}")
        return ""


class SkillBreakdownCategory(BaseModel):
    category: str
    score: int


MAX_RESUME_FILE_SIZE = 5 * 1024 * 1024 # 5 MB

class DeepAnalysisRequest(BaseModel):
    resume_text: str = Field(..., min_length=10, max_length=50000, example="Full text of candidate's resume...")
    target_role: Optional[str] = Field(default="Java Backend Developer", max_length=150, example="Java Backend Developer")
    job_description: Optional[str] = Field(default="", max_length=20000, example="Target job description context...")


class DeepAnalysisResponse(BaseModel):
    match_score: int
    ats_rating: str
    strengths: List[str]
    missing_skills: List[str]
    recommendations: List[str]
    skill_breakdown: List[SkillBreakdownCategory]
    suggested_action_plan: List[str]
    detected_skills: List[str] = Field(default_factory=list)


class ResumeParseResponse(BaseModel):
    file_name: str
    file_size: int
    parsed_text: str
    detected_skills: List[str] = Field(default_factory=list)
    word_count: int


@router.post("/parse-resume-file", response_model=ResumeParseResponse)
async def parse_resume_file(file: UploadFile = File(...)):
    """
    Extracts text and detected skills from an uploaded resume file (PDF or TXT).
    Validates file format and enforces strict 5MB size limit.
    """
    filename = (file.filename or "resume.pdf").strip()
    is_pdf = filename.lower().endswith(".pdf") or (file.content_type and "pdf" in file.content_type.lower())
    is_txt = filename.lower().endswith(".txt") or (file.content_type and "text" in file.content_type.lower())

    if not is_pdf and not is_txt:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload a valid PDF (.pdf) or Text (.txt) resume file."
        )

    content_bytes = await file.read()
    file_size = len(content_bytes)

    if file_size > MAX_RESUME_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File size exceeds the 5 MB limit. Please upload a smaller resume."
        )

    if is_pdf:
        extracted_text = extract_text_from_pdf_bytes(content_bytes)
    else:
        try:
            extracted_text = content_bytes.decode("utf-8", errors="ignore")
        except Exception:
            extracted_text = ""

    if not extracted_text:
        extracted_text = ""

    detected_skills = extract_skills_from_text(extracted_text)
    word_count = len(extracted_text.split()) if extracted_text else 0

    return ResumeParseResponse(
        file_name=filename,
        file_size=file_size,
        parsed_text=extracted_text,
        detected_skills=detected_skills,
        word_count=word_count
    )


@router.post("/deep-resume-analysis", response_model=DeepAnalysisResponse)
def deep_resume_analysis(req: DeepAnalysisRequest):
    resume_text = req.resume_text.strip()
    if not resume_text or len(resume_text) < 10:
        raise HTTPException(status_code=400, detail="Resume text is required and must contain at least 10 characters for analysis.")

    if not llm_engine.is_available():
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY is not configured on the AI backend. Please configure it in backend/.env."
        )

    # Extract detected skills directly from candidate's resume text
    detected_skills = extract_skills_from_text(resume_text)

    prompt = f"""
Perform an in-depth, rigorous ATS and technical evaluation of this candidate's resume for the role: "{req.target_role or 'Java Backend Developer'}".

Job Description Context:
{req.job_description or "Standard competitive requirements for " + (req.target_role or "Java Backend Developer")}

Candidate Resume Content:
\"\"\"{resume_text[:25000]}\"\"\"

Instructions:
1. Extract and evaluate the actual projects, technical skills, databases, frameworks, and metrics present in this specific resume.
2. Identify real strengths quoting specific technologies from the text.
3. Identify genuine missing skills for the target role ({req.target_role or 'Java Backend Developer'}).
4. Provide concrete, actionable recommendations to improve this specific resume's ATS score.
5. Provide a category breakdown with realistic scores (0-100) based on the candidate's actual qualifications.

Return your response as a valid JSON object matching this exact schema:
{{
  "match_score": 85,
  "ats_rating": "Strong Match (85/100)",
  "strengths": [
    "Specific strength mentioning candidate's actual project or skill",
    "Another specific strength"
  ],
  "missing_skills": [
    "Specific missing requirement for target role",
    "Another missing requirement"
  ],
  "recommendations": [
    "Actionable bullet point advice",
    "Specific project or metric suggestion"
  ],
  "skill_breakdown": [
    {{"category": "Core Languages & Stack", "score": 88}},
    {{"category": "Databases & Storage", "score": 82}},
    {{"category": "System Architecture", "score": 75}},
    {{"category": "Cloud & DevOps", "score": 65}},
    {{"category": "Testing & Code Quality", "score": 60}}
  ],
  "suggested_action_plan": [
    "Phase 1: Immediate keyword and bullet fix",
    "Phase 2: Project enhancement",
    "Phase 3: Final application polish"
  ],
  "detected_skills": ["Skill1", "Skill2"]
}}
"""
    data = llm_engine.generate_json(
        prompt=prompt,
        system_instruction="You are a Chief Talent Officer and Senior Technical Hiring Architect at a Tier-1 tech company. You produce precise, personalized, non-generic resume evaluations. Always respond with valid JSON only."
    )

    if not data:
        raise HTTPException(
            status_code=500,
            detail="AI generation failed to produce a deep resume analysis. Please retry."
        )

    try:
        # Guarantee detected_skills is strictly extracted from candidate's resume text only
        data["detected_skills"] = detected_skills
        return DeepAnalysisResponse(**data)
    except Exception as e:
        logger.error(f"Failed to parse resume analysis response: {e}")
        raise HTTPException(
            status_code=500,
            detail="AI returned malformed resume analysis data. Please retry."
        )



@router.post("/analyze-resume-upload", response_model=DeepAnalysisResponse)
async def analyze_resume_upload(
    file: UploadFile = File(...),
    target_role: str = Form("Java Backend Developer"),
    job_description: str = Form("")
):
    """
    Combined single-step endpoint: uploads file, validates size/MIME, parses PDF/TXT text, and runs deep analysis.
    """
    filename = (file.filename or "resume.pdf").strip()
    is_pdf = filename.lower().endswith(".pdf") or (file.content_type and "pdf" in file.content_type.lower())
    is_txt = filename.lower().endswith(".txt") or (file.content_type and "text" in file.content_type.lower())

    if not is_pdf and not is_txt:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload a valid PDF (.pdf) or Text (.txt) resume file."
        )

    content_bytes = await file.read()
    if len(content_bytes) > MAX_RESUME_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File size exceeds the 5 MB limit. Please upload a smaller resume."
        )

    if is_pdf:
        resume_text = extract_text_from_pdf_bytes(content_bytes)
    else:
        try:
            resume_text = content_bytes.decode("utf-8", errors="ignore")
        except Exception:
            resume_text = ""

    if not resume_text or len(resume_text.strip()) < 10:
        resume_text = f"Resume file {filename} uploaded for {target_role} position."

    return deep_resume_analysis(DeepAnalysisRequest(
        resume_text=resume_text,
        target_role=target_role,
        job_description=job_description
    ))
