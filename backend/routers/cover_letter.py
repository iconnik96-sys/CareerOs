import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from services.llm_engine import llm_engine
from services.vector_store import company_knowledge_store

router = APIRouter(prefix="/api/ai", tags=["Cover Letter & Outreach"])
logger = logging.getLogger("CoverLetterRouter")


class CoverLetterRequest(BaseModel):
    full_name: str = Field(..., example="Alex Rivera")
    target_role: str = Field(..., example="Java Backend Developer")
    company_name: str = Field(..., example="Stripe")
    job_description: Optional[str] = Field(default="", example="Building high throughput payment microservices with Spring Boot and Kafka")
    skills: List[str] = Field(default_factory=lambda: ["Java", "Spring Boot", "PostgreSQL", "Docker", "AWS"])
    key_projects: Optional[str] = Field(default="Distributed Payment Ledger with Spring Boot and Kafka, Cloud Order Service with Docker")
    tone: Optional[str] = Field(default="Confident & Impactful", example="Confident & Impactful")
    recipient_name: Optional[str] = Field(default="Hiring Manager")


class CoverLetterResponse(BaseModel):
    cover_letter: str
    headline: str
    key_highlights: List[str]
    suggested_subject_line: str
    company_intelligence: Optional[Dict[str, Any]] = None


class OutreachRequest(BaseModel):
    full_name: str = Field(..., example="Alex Rivera")
    target_role: str = Field(..., example="Software Engineer - Fresher")
    company_name: str = Field(..., example="Amazon")
    recipient_role: str = Field(default="Recruiter", example="Technical Recruiter / Alumni")
    recipient_name: Optional[str] = Field(default="Hiring Team")
    channel: str = Field(default="LinkedIn", example="LinkedIn / Email")
    purpose: str = Field(default="Referral Request", example="Job Application / Referral / Coffee Chat")
    skills: List[str] = Field(default_factory=lambda: ["Java", "Distributed Systems", "SQL"])
    experience: Optional[str] = Field(default="", example="2+ years building backend microservices with Spring Boot and AWS")


class OutreachResponse(BaseModel):
    short_message: str
    extended_message: str
    subject_line: str
    call_to_action: str
    company_intelligence: Optional[Dict[str, Any]] = None


class RagCompanyOutreachRequest(BaseModel):
    full_name: str = Field(..., example="Aarav Sharma")
    target_role: str = Field(..., example="Backend Engineer")
    company_name: str = Field(..., example="Razorpay")
    purpose: Optional[str] = Field(default="Job Application", example="Job Application / Referral Request / Application Follow-up / Coffee Chat")
    skills: List[str] = Field(default_factory=lambda: ["Java", "Spring Boot", "PostgreSQL", "Redis"])
    key_projects: Optional[str] = Field(default="Distributed Payment Microservice with Spring Boot, Redis caching, and Docker.")
    recipient_role: Optional[str] = Field(default="Engineering Manager")
    recipient_name: Optional[str] = Field(default="", example="Hiring Team")
    tone: Optional[str] = Field(default="Confident & Technically Grounded")


class RagCompanyOutreachResponse(BaseModel):
    cover_letter: str
    linkedin_inmail: str
    short_connection_note: str
    subject_line: str
    technical_hook: str
    talking_points: List[str]
    company_context: Dict[str, Any]


@router.get("/companies-knowledge")
def get_companies_knowledge():
    """Returns list of pre-seeded tech companies in the knowledge store."""
    return company_knowledge_store.get_all_companies()


@router.post("/cover-letter", response_model=CoverLetterResponse)
def generate_cover_letter(req: CoverLetterRequest):
    if not llm_engine.is_available():
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY is not configured on the AI backend. Please configure it in backend/.env."
        )

    # Retrieve Company Engineering Intelligence via RAG
    company_ctx = company_knowledge_store.retrieve_company_context(
        company_name=req.company_name,
        query_text=f"{req.target_role} {req.key_projects}"
    )

    prompt = f"""
Write a professional, compelling, and technically grounded cover letter for an engineering candidate.
Candidate Name: {req.full_name}
Target Role: {req.target_role}
Target Company: {req.company_name}
Recipient: {req.recipient_name or "Hiring Manager"}
Key Skills: {", ".join(req.skills)}
Projects / Experience: {req.key_projects or "Hands-on engineering projects"}
Tone: {req.tone or "Confident & Impactful"}

[RETRIEVED COMPANY ENGINEERING INTELLIGENCE (RAG)]:
Company Domain: {company_ctx.get('domain')}
Engineering Stack: {', '.join(company_ctx.get('tech_stack', []))}
Core Engineering Focus: {company_ctx.get('engineering_focus')}
Key Architectural Challenges: {company_ctx.get('key_challenges')}
Company Values: {company_ctx.get('culture_and_values')}

Job Description Context:
{req.job_description or "Building scalable, high-throughput software systems."}

Instructions:
1. Ground the letter directly in the company's real engineering challenges and tech stack.
2. Explicitly link the candidate's projects to the company's architectural priorities (e.g., reliability, idempotency, caching, throughput).
3. Avoid generic filler words ("hardworking team player"). Write like a competent engineer speaking to an engineering leader.

Return your response as a valid JSON object matching this exact structure:
{{
  "headline": "A short, punchy application summary hook",
  "suggested_subject_line": "Subject line for email application",
  "key_highlights": ["Highlight 1 linking project to company stack", "Highlight 2 on system reliability", "Highlight 3 on immediate readiness"],
  "cover_letter": "The full markdown-formatted cover letter with greeting, 3 structured body paragraphs focusing on technical readiness and impact, and confident closing."
}}
"""
    data = llm_engine.generate_json(
        prompt=prompt,
        system_instruction="You are an elite career coach and tech hiring expert specializing in engineering placement. Always respond with valid JSON only."
    )

    if not data:
        raise HTTPException(
            status_code=500,
            detail="AI generation failed to produce a valid cover letter. Please retry."
        )

    try:
        res = CoverLetterResponse(**data)
        res.company_intelligence = company_ctx
        return res
    except Exception as e:
        logger.error(f"Failed to parse cover letter response: {e}")
        raise HTTPException(
            status_code=500,
            detail="AI returned malformed cover letter data. Please retry."
        )


@router.post("/outreach-message", response_model=OutreachResponse)
def generate_outreach(req: OutreachRequest):
    if not llm_engine.is_available():
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY is not configured on the AI backend. Please configure it in backend/.env."
        )

    company_ctx = company_knowledge_store.retrieve_company_context(
        company_name=req.company_name,
        query_text=f"{req.target_role} {' '.join(req.skills)}"
    )

    prompt = f"""
Write a high-converting cold outreach message for an engineering applicant.
Candidate: {req.full_name}
Target Role: {req.target_role}
Target Company: {req.company_name}
Recipient: {req.recipient_role} ({req.recipient_name or 'Hiring Team'})
Channel: {req.channel}
Purpose: {req.purpose}
Top Skills: {", ".join(req.skills)}
Relevant Experience / Background: {req.experience or "Hands-on software development and project experience"}

[RETRIEVED COMPANY ENGINEERING CONTEXT]:
Domain: {company_ctx.get('domain')}
Tech Stack: {', '.join(company_ctx.get('tech_stack', []))}
Core Engineering Focus: {company_ctx.get('engineering_focus')}

Instructions:
1. Hook the reader immediately with an authentic technical observation about what the company builds.
2. Weave in the candidate's actual experience/background naturally into the pitch.
3. Provide a short <300 char connection note and an extended InMail / Cold Email.
4. Keep the closing low-friction and polite.

Return your response as a valid JSON object with this exact structure:
{{
  "subject_line": "Catchy subject for email or InMail",
  "short_message": "Under 300 characters connection note for LinkedIn",
  "extended_message": "Full 3 paragraph message for InMail or cold email with value hook and portfolio/experience mention",
  "call_to_action": "Polite, low-friction closing question"
}}
"""
    data = llm_engine.generate_json(
        prompt=prompt,
        system_instruction="You are a tech recruiter and career outreach strategist. Always respond with valid JSON only."
    )

    if not data:
        raise HTTPException(
            status_code=500,
            detail="AI generation failed to produce an outreach message. Please retry."
        )

    try:
        res = OutreachResponse(**data)
        res.company_intelligence = company_ctx
        return res
    except Exception as e:
        logger.error(f"Failed to parse outreach response: {e}")
        raise HTTPException(
            status_code=500,
            detail="AI returned malformed outreach message data. Please retry."
        )


@router.post("/rag-company-outreach", response_model=RagCompanyOutreachResponse)
def rag_company_outreach(req: RagCompanyOutreachRequest):
    """
    RAG-Grounded Company Outreach Pipeline:
    1. Retrieve (R): Queries CompanyKnowledgeStore vector index to fetch the company's real tech stack & challenges.
    2. Augment (A): Injects company engineering intelligence & candidate projects into the prompt.
    3. Generate (G): Groq synthesizes hyper-tailored Cover Letter, LinkedIn InMail, and Technical Interview Talking Points.
    """
    if not llm_engine.is_available():
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY is not configured on the AI backend. Please configure it in backend/.env."
        )

    # 1. Retrieval (R)
    company_ctx = company_knowledge_store.retrieve_company_context(
        company_name=req.company_name,
        query_text=f"{req.target_role} {req.key_projects}"
    )

    # 2. Augmentation & Generation (A & G)
    recipient_display = f"{req.recipient_role}" + (f" ({req.recipient_name})" if req.recipient_name else "")

    prompt = f"""
You are a Principal Engineering Leader and Executive Career Strategist.
Generate a company-tailored, authentic job application and outreach package for a software engineering candidate applying to or reaching out to {req.company_name}.

Candidate Name: {req.full_name}
Target Role: {req.target_role}
Primary Goal / Purpose: {req.purpose or 'Job Application'}
Candidate Skills: {', '.join(req.skills)}
Candidate Experience & Key Projects: {req.key_projects}
Recipient: {recipient_display}
Tone: {req.tone or 'Confident & Technically Grounded'}

[RETRIEVED COMPANY ENGINEERING INTELLIGENCE VIA RAG]:
Company: {company_ctx.get('company')}
Industry Domain: {company_ctx.get('domain')}
Actual Tech Stack: {', '.join(company_ctx.get('tech_stack', []))}
Core Engineering Focus: {company_ctx.get('engineering_focus')}
Key Architectural Challenges: {company_ctx.get('key_challenges')}
Engineering Culture & Values: {company_ctx.get('culture_and_values')}

Instructions:
1. "cover_letter": Write a full markdown-formatted 3-paragraph formal cover letter. Paragraph 1 hooks why you are applying to {req.company_name} specifically citing their engineering focus. Paragraph 2 explains how your specific projects and experience match their tech stack and challenges. Paragraph 3 closes confidently.
2. "linkedin_inmail": Write a concise 3-paragraph outreach message for LinkedIn InMail or cold email directly to {recipient_display}, tailored to the candidate's primary goal ({req.purpose or 'Job Application'}).
3. "short_connection_note": A punchy note under 280 characters for a LinkedIn connection request directly aligned with the goal ({req.purpose or 'Job Application'}).
4. "technical_hook": A 1-sentence technical bridge showing how candidate's project relates directly to {req.company_name}'s architecture.
5. "talking_points": Exactly 3 bullet points the candidate can use when chatting with the hiring manager or during interview screens.

Return your response as a valid JSON object matching this exact schema:
{{
  "subject_line": "Catchy, professional subject line",
  "technical_hook": "Bridging sentence connecting candidate project to company architecture",
  "short_connection_note": "Under 280 characters connection note",
  "linkedin_inmail": "Full 3-paragraph cold outreach message",
  "cover_letter": "Full markdown-formatted cover letter with greeting and closing",
  "talking_points": [
    "Talking point 1 on system architecture alignment",
    "Talking point 2 on test coverage & reliability",
    "Talking point 3 on immediate onboarding value"
  ]
}}
"""

    data = llm_engine.generate_json(
        prompt=prompt,
        system_instruction="You are an elite Silicon Valley Tech Talent Strategist. Always respond with strict, valid JSON only."
    )

    if not data:
        raise HTTPException(
            status_code=500,
            detail="AI generation failed to produce company outreach data. Please retry."
        )

    try:
        return RagCompanyOutreachResponse(
            cover_letter=data.get("cover_letter", ""),
            linkedin_inmail=data.get("linkedin_inmail", ""),
            short_connection_note=data.get("short_connection_note", ""),
            subject_line=data.get("subject_line", ""),
            technical_hook=data.get("technical_hook", ""),
            talking_points=data.get("talking_points", []),
            company_context=company_ctx
        )
    except Exception as e:
        logger.error(f"Failed to parse RAG company outreach response: {e}")
        raise HTTPException(
            status_code=500,
            detail="AI returned malformed company outreach data. Please retry."
        )


