import sys
import io
import requests
import json
import time

# Ensure UTF-8 output in Windows PowerShell terminals
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

BASE_URL = "http://localhost:8000"

def test_endpoint(name, method, url, **kwargs):
    print(f"\n--- Testing {name}: {method} {url} ---")
    start = time.time()
    if method.upper() == "GET":
        res = requests.get(url, **kwargs)
    elif method.upper() == "POST":
        res = requests.post(url, **kwargs)
    else:
        raise ValueError(f"Unsupported method: {method}")
    elapsed = time.time() - start
    print(f"Status: {res.status_code} (took {elapsed:.2f}s)")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    print(f"Response preview: {json.dumps(data, indent=2)[:350]}...")
    return data

def run_all_backend_tests():
    print("Starting Backend Verification Suite...")

    # 1. Health
    health = test_endpoint("Health Check", "GET", f"{BASE_URL}/api/health")
    assert health["status"] == "healthy"
    assert health["groq_configured"] is True

    # 2. Cover Letter
    cl_payload = {
        "full_name": "Aarav Sharma",
        "target_role": "Java Backend Developer",
        "company_name": "Razorpay",
        "job_description": "We need a Java engineer skilled in Spring Boot, PostgreSQL, Kafka, and Redis to build high-throughput payment microservices.",
        "skills": ["Java", "Spring Boot", "PostgreSQL", "Kafka", "Docker", "AWS"],
        "key_projects": "Built an event-driven payment ledger handling 500+ TPS using Spring Boot and Apache Kafka.",
        "tone": "Confident & Impactful",
        "recipient_name": "Senior Engineering Manager"
    }
    cl_res = test_endpoint("Cover Letter Generation", "POST", f"{BASE_URL}/api/ai/cover-letter", json=cl_payload)
    assert "cover_letter" in cl_res and len(cl_res["cover_letter"]) > 50
    assert "headline" in cl_res

    # 3. Outreach Message
    outreach_payload = {
        "full_name": "Aarav Sharma",
        "target_role": "Software Engineer (Backend)",
        "company_name": "Razorpay",
        "recipient_role": "Technical Recruiter",
        "recipient_name": "Priya Verma",
        "channel": "LinkedIn",
        "purpose": "Referral Request",
        "skills": ["Java", "Spring Boot", "Kafka", "PostgreSQL"],
        "experience": "2 years building high-throughput payment microservices with Spring Boot and Kafka"
    }
    outreach_res = test_endpoint("Outreach Message Generation", "POST", f"{BASE_URL}/api/ai/outreach-message", json=outreach_payload)
    assert "short_message" in outreach_res and len(outreach_res["short_message"]) > 10
    assert "call_to_action" in outreach_res

    # 3b. Unified RAG Company Outreach & Cover Letter Hub
    rag_payload = {
        "full_name": "Aarav Sharma",
        "target_role": "Backend Engineer",
        "company_name": "Razorpay",
        "purpose": "Job Application",
        "skills": ["Java", "Spring Boot", "PostgreSQL", "Redis"],
        "key_projects": "Distributed Payment Microservice with Spring Boot and Redis caching",
        "recipient_role": "Engineering Manager",
        "recipient_name": "Senior EM",
        "tone": "Confident & Technically Grounded"
    }
    rag_res = test_endpoint("Unified RAG Outreach & Cover Letter Hub", "POST", f"{BASE_URL}/api/ai/rag-company-outreach", json=rag_payload)
    assert "cover_letter" in rag_res and len(rag_res["cover_letter"]) > 50
    assert "linkedin_inmail" in rag_res
    assert "short_connection_note" in rag_res
    assert "talking_points" in rag_res and len(rag_res["talking_points"]) == 3

    # 4. Enhance Bullet
    bullet_payload = {
        "raw_bullet": "I made a rest api in spring boot to process orders and put data in postgres.",
        "target_role": "Java Backend Developer",
        "technologies": ["Spring Boot", "PostgreSQL", "Docker", "Redis"],
        "focus_area": "Impact & Metrics"
    }
    bullet_res = test_endpoint("Resume Bullet Enhancer", "POST", f"{BASE_URL}/api/ai/enhance-bullet", json=bullet_payload)
    assert "variations" in bullet_res and len(bullet_res["variations"]) >= 1
    assert "key_critique" in bullet_res

    # 5. Generate Interview Questions
    iq_payload = {
        "role": "Java Backend Developer",
        "difficulty": "Medium",
        "topic": "Java",
        "count": 3
    }
    iq_res = test_endpoint("Generate Interview Questions", "POST", f"{BASE_URL}/api/ai/generate-interview-questions", json=iq_payload)
    assert isinstance(iq_res, list) and len(iq_res) > 0
    assert "question" in iq_res[0] and "sample_answer" in iq_res[0]

    # 6. Evaluate Interview Answer
    eval_payload = {
        "question": "How does HashMap handle collisions in Java 8?",
        "candidate_answer": "In Java 8, HashMap uses an array of node buckets. When collisions happen, elements are added to a linked list. Once the bucket size exceeds TREEIFY_THRESHOLD of 8 and table capacity is at least 64, it converts the linked list to a Red-Black Tree for O(log n) lookup.",
        "topic": "Java",
        "difficulty": "Medium",
        "target_role": "Java Backend Developer"
    }
    eval_res = test_endpoint("Evaluate Interview Answer", "POST", f"{BASE_URL}/api/ai/evaluate-interview-answer", json=eval_payload)
    assert "overall_score" in eval_res and isinstance(eval_res["overall_score"], int)
    assert "dimension_scores" in eval_res and len(eval_res["dimension_scores"]) > 0

    # 7. Copilot Chat
    chat_payload = {
        "message": "What are the 3 most important topics to master for Spring Boot fresher technical interviews?",
        "history": [],
        "user_context": {
            "full_name": "Aarav Sharma",
            "target_role": "Java Backend Developer",
            "skills": ["Java", "Spring Boot", "PostgreSQL"]
        }
    }
    chat_res = test_endpoint("Copilot Chat", "POST", f"{BASE_URL}/api/ai/copilot-chat", json=chat_payload)
    assert "reply" in chat_res and len(chat_res["reply"]) > 20
    assert "suggested_followups" in chat_res

    # 8. Parse Resume File (multipart)
    sample_resume_content = b"""
Aarav Sharma - Java Backend Developer
Email: aarav.sharma@example.com | GitHub: github.com/aaravsharma | Bangalore, India

EXPERIENCE / PROJECTS:
1. Distributed Payment Gateway Service (Spring Boot, Kafka, PostgreSQL, Docker)
   - Architected high-throughput payment transaction pipeline supporting 1,200+ TPS.
   - Integrated Redis distributed caching reducing database read latency by 60%.
   - Containerized application with Docker Compose and deployed to AWS EC2.

TECHNICAL SKILLS:
Languages: Java, SQL, Python, TypeScript
Frameworks & Tools: Spring Boot, Hibernate, REST APIs, Kafka, Redis, Docker, AWS, Git, JUnit, PostgreSQL
"""
    files = {"file": ("aarav_resume.txt", sample_resume_content, "text/plain")}
    parse_res = test_endpoint("Parse Resume File", "POST", f"{BASE_URL}/api/ai/parse-resume-file", files=files)
    assert "parsed_text" in parse_res
    assert "detected_skills" in parse_res and len(parse_res["detected_skills"]) > 0
    print(f"Detected skills from resume: {parse_res['detected_skills']}")

    # 9. Deep Resume Analysis
    deep_payload = {
        "resume_text": sample_resume_content.decode("utf-8"),
        "target_role": "Java Backend Developer",
        "job_description": "We are hiring a Junior Java Developer proficient in Java, Spring Boot, PostgreSQL, Kafka, and Microservices."
    }
    deep_res = test_endpoint("Deep Resume Analysis", "POST", f"{BASE_URL}/api/ai/deep-resume-analysis", json=deep_payload)
    assert "match_score" in deep_res and isinstance(deep_res["match_score"], int)
    assert "ats_rating" in deep_res
    assert "skill_breakdown" in deep_res and len(deep_res["skill_breakdown"]) > 0
    assert "suggested_action_plan" in deep_res

    # 10. Analyze Resume Upload (multipart single-step)
    files_upload = {"file": ("resume_candidate.txt", sample_resume_content, "text/plain")}
    data_upload = {"target_role": "Java Backend Developer", "job_description": "Junior Java developer position"}
    upload_res = test_endpoint("Analyze Resume Upload", "POST", f"{BASE_URL}/api/ai/analyze-resume-upload", files=files_upload, data=data_upload)
    assert "match_score" in upload_res
    assert "strengths" in upload_res

    # 11. Job Match Analysis
    job_match_payload = {
        "user_skills": ["Java", "Spring Boot", "PostgreSQL", "Docker", "Git"],
        "resume_text": sample_resume_content.decode("utf-8"),
        "job_title": "Junior Java Backend Engineer",
        "company": "Razorpay",
        "job_description": "We seek a Java backend engineer with Spring Boot, PostgreSQL, Kafka, and Redis skills to build scalable payment APIs.",
        "target_role": "Java Backend Developer"
    }
    job_res = test_endpoint("Job Match Analysis", "POST", f"{BASE_URL}/api/ai/job-match-analysis", json=job_match_payload)
    assert "match_score" in job_res and isinstance(job_res["match_score"], int)
    assert "matching_skills" in job_res
    assert "missing_skills" in job_res
    assert "skill_breakdown" in job_res

    # 12. Generate Roadmap
    roadmap_payload = {
        "target_role": "Java Backend Developer",
        "current_skills": ["Java", "SQL", "Git"],
        "experience_level": "0-2 years (Fresher)"
    }
    roadmap_res = test_endpoint("Generate Career Roadmap", "POST", f"{BASE_URL}/api/ai/generate-roadmap", json=roadmap_payload)
    assert "target_role" in roadmap_res
    assert "phases" in roadmap_res and len(roadmap_res["phases"]) >= 4

    print("\n=============================================")
    print("ALL 12 BACKEND ENDPOINTS PASSED WITH REAL AI (GROQ LLM) RESPONSES!")
    print("=============================================")

if __name__ == "__main__":
    run_all_backend_tests()
