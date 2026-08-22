import os
import sys
import json
import time
import requests
import uuid

# Ensure UTF-8 output
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# Read env variables
def load_env(env_path):
    env = {}
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip()
    return env

root_env = load_env(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env")))
SUPABASE_URL = root_env.get("VITE_SUPABASE_URL", "https://mkegptssjhjchwcpatnp.supabase.co")
SUPABASE_KEY = root_env.get("VITE_SUPABASE_ANON_KEY", "")
FASTAPI_URL = "http://localhost:8000"

print(f"Testing against Supabase URL: {SUPABASE_URL}")
print(f"FastAPI Backend URL: {FASTAPI_URL}")

def get_headers(token=None):
    h = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {token or SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    return h

def run_e2e_verification():
    passed = 0
    failed = 0

    def check(desc, condition, extra=""):
        nonlocal passed, failed
        if condition:
            passed += 1
            print(f"  [PASS] {desc} {extra}")
        else:
            failed += 1
            print(f"  [FAIL] {desc} {extra}")
            raise AssertionError(f"Check failed: {desc}")

    print("\n==========================================")
    print("STEP 1: USER REGISTRATION & AUTHENTICATION")
    print("==========================================")

    test_email_a = f"careeros_test_a_{int(time.time())}@careeros.test"
    test_email_b = f"careeros_test_b_{int(time.time())}@careeros.test"
    password = "TestPassword@1234!"

    # Signup User A
    signup_url = f"{SUPABASE_URL}/auth/v1/signup"
    signup_a = requests.post(signup_url, headers=get_headers(), json={
        "email": test_email_a,
        "password": password,
        "data": {
            "full_name": "Aarav Sharma",
            "degree": "B.Tech Computer Science",
            "graduation_year": 2026,
            "target_role": "Java Backend Developer"
        }
    })
    check("User A Signup HTTP status is 200 or 201", signup_a.status_code in [200, 201], f"Status: {signup_a.status_code}")
    res_a = signup_a.json()
    user_a_id = res_a.get("user", {}).get("id") or res_a.get("id")
    token_a = res_a.get("access_token")

    # If email confirmation is required or token missing, do sign-in
    if not token_a:
        signin_a = requests.post(f"{SUPABASE_URL}/auth/v1/token?grant_type=password", headers=get_headers(), json={
            "email": test_email_a,
            "password": password
        })
        if signin_a.status_code == 200:
            token_a = signin_a.json().get("access_token")
            user_a_id = signin_a.json().get("user", {}).get("id")

    check("User A has valid user ID and auth token", bool(user_a_id and token_a), f"User A ID: {user_a_id}")

    # Signup User B (for cross-user RLS isolation tests)
    signup_b = requests.post(signup_url, headers=get_headers(), json={
        "email": test_email_b,
        "password": password,
        "data": {
            "full_name": "Diya Patel",
            "degree": "B.Tech Information Technology",
            "graduation_year": 2026,
            "target_role": "Full Stack Developer"
        }
    })
    res_b = signup_b.json()
    user_b_id = res_b.get("user", {}).get("id") or res_b.get("id")
    token_b = res_b.get("access_token")
    if not token_b:
        signin_b = requests.post(f"{SUPABASE_URL}/auth/v1/token?grant_type=password", headers=get_headers(), json={
            "email": test_email_b,
            "password": password
        })
        if signin_b.status_code == 200:
            token_b = signin_b.json().get("access_token")
            user_b_id = signin_b.json().get("user", {}).get("id")

    check("User B has valid user ID and auth token", bool(user_b_id and token_b), f"User B ID: {user_b_id}")

    print("\n==========================================")
    print("STEP 2: PROFILE CREATION & RETRIEVAL")
    print("==========================================")

    # Fetch User A profile
    prof_url = f"{SUPABASE_URL}/rest/v1/profiles?user_id=eq.{user_a_id}"
    prof_res = requests.get(prof_url, headers=get_headers(token_a))
    check("Fetch User A profile status 200", prof_res.status_code == 200)
    profs = prof_res.json()
    
    # If handle_new_user trigger created profile or if upsert needed
    if not profs:
        create_prof = requests.post(f"{SUPABASE_URL}/rest/v1/profiles", headers=get_headers(token_a), json={
            "user_id": user_a_id,
            "full_name": "Aarav Sharma",
            "degree": "B.Tech Computer Science",
            "graduation_year": 2026,
            "target_role": "Java Backend Developer",
            "location": "Bangalore, India",
            "experience_level": "0-2 years (Fresher)",
            "career_readiness": 75,
            "onboarding_completed": True
        })
        check("Create User A profile status 201/200", create_prof.status_code in [200, 201])
        prof_data = create_prof.json()[0]
    else:
        prof_data = profs[0]

    check("Profile full_name matches Aarav Sharma", prof_data["full_name"] == "Aarav Sharma")
    check("Profile target_role is Java Backend Developer", prof_data["target_role"] == "Java Backend Developer")

    # Update profile
    patch_res = requests.patch(
        f"{SUPABASE_URL}/rest/v1/profiles?user_id=eq.{user_a_id}",
        headers=get_headers(token_a),
        json={"bio": "Passionate Java & Spring Boot engineer", "career_readiness": 85}
    )
    check("Profile update status 200", patch_res.status_code == 200)
    check("Updated profile bio saved", patch_res.json()[0]["bio"] == "Passionate Java & Spring Boot engineer")

    print("\n==========================================")
    print("STEP 3: SKILLS DIRECTORY & USER SKILLS")
    print("==========================================")

    # Query skills table
    skills_res = requests.get(f"{SUPABASE_URL}/rest/v1/skills?select=*&limit=10", headers=get_headers(token_a))
    check("Skills directory query status 200", skills_res.status_code == 200)
    skills_list = skills_res.json()
    check("Skills directory has seeded skills", len(skills_list) > 0, f"Found {len(skills_list)} skills")
    
    java_skill = next((s for s in skills_list if s["name"].lower() == "java"), None)
    if not java_skill:
        # Create Java skill
        add_skill = requests.post(f"{SUPABASE_URL}/rest/v1/skills", headers=get_headers(token_a), json={
            "name": "Java", "category": "Languages"
        })
        java_skill = add_skill.json()[0]

    # Add skill to User A
    user_skill_res = requests.post(f"{SUPABASE_URL}/rest/v1/user_skills", headers=get_headers(token_a), json={
        "user_id": user_a_id,
        "skill_id": java_skill["id"],
        "proficiency": 90
    })
    check("User skill insertion status 201/200", user_skill_res.status_code in [200, 201])

    # Fetch user skills
    get_user_skills = requests.get(
        f"{SUPABASE_URL}/rest/v1/user_skills?user_id=eq.{user_a_id}&select=id,proficiency,skills(name,category)",
        headers=get_headers(token_a)
    )
    check("Fetch user skills status 200", get_user_skills.status_code == 200)
    user_skills_data = get_user_skills.json()
    check("User skill returned with joined skill name", len(user_skills_data) > 0 and user_skills_data[0]["skills"]["name"] == "Java")

    print("\n==========================================")
    print("STEP 4: RESUME FLOW (STORAGE + PARSING + GROQ DEEP ANALYSIS)")
    print("==========================================")

    resume_text_content = """Aarav Sharma - Java Backend Developer
Email: aarav.sharma@example.com | GitHub: github.com/aaravsharma | Bangalore, India

PROFESSIONAL SUMMARY:
Backend software developer specializing in high-throughput distributed systems, Spring Boot microservices, and event-driven architecture.

TECHNICAL EXPERTISE:
- Languages: Java 17, SQL, Python, TypeScript
- Frameworks: Spring Boot, Spring Security, Hibernate/JPA, RESTful APIs
- Databases & Messaging: PostgreSQL, Redis, Apache Kafka, MongoDB
- Cloud & DevOps: Docker, Kubernetes, AWS (EC2, S3, RDS), Git, CI/CD, JUnit, Mockito

PROJECTS:
1. Distributed Payment Gateway & Transaction Ledger
   - Architected a high-concurrency payment engine in Spring Boot handling 1,500+ requests/sec with 99.99% reliability.
   - Built an event-driven ledger using Apache Kafka for real-time transaction reconciliation.
   - Reduced database query latency by 65% by implementing Redis read-through caching.
   - Wrote comprehensive unit and integration test suites using JUnit 5 and Mockito achieving 88% code coverage.
"""

    # 1. Parse resume text via FastAPI
    parse_api_res = requests.post(f"{FASTAPI_URL}/api/ai/parse-resume-file", files={
        "file": ("aarav_resume.txt", resume_text_content.encode("utf-8"), "text/plain")
    })
    check("FastAPI resume file parser status 200", parse_api_res.status_code == 200)
    parsed_json = parse_api_res.json()
    check("Parsed resume detected technical skills", "Java" in parsed_json["detected_skills"] and "Spring Boot" in parsed_json["detected_skills"])

    # 2. Upload file to Supabase Storage (resumes bucket: user_a_id/resume.txt)
    storage_path = f"{user_a_id}/aarav_resume_{int(time.time())}.txt"
    storage_upload = requests.post(
        f"{SUPABASE_URL}/storage/v1/object/resumes/{storage_path}",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {token_a}",
            "Content-Type": "text/plain"
        },
        data=resume_text_content.encode("utf-8")
    )
    check("Supabase storage upload status 200", storage_upload.status_code == 200, f"Storage status: {storage_upload.status_code}")

    # 3. Insert record in resumes table
    resume_db_res = requests.post(f"{SUPABASE_URL}/rest/v1/resumes", headers=get_headers(token_a), json={
        "user_id": user_a_id,
        "file_name": "aarav_resume.txt",
        "file_path": storage_path,
        "file_size": len(resume_text_content),
        "parsed_text": resume_text_content
    })
    check("Resumes table insertion status 201/200", resume_db_res.status_code in [200, 201])
    resume_id = resume_db_res.json()[0]["id"]
    check("Resume ID created", bool(resume_id))

    # 4. Run Groq Deep Resume Analysis via FastAPI
    deep_analysis_res = requests.post(f"{FASTAPI_URL}/api/ai/deep-resume-analysis", json={
        "resume_text": resume_text_content,
        "target_role": "Java Backend Developer",
        "job_description": "We are seeking a Java Backend Developer with Spring Boot, PostgreSQL, Kafka, and Docker experience to build high-scale payments services."
    })
    check("Groq Deep Resume Analysis status 200", deep_analysis_res.status_code == 200)
    analysis_data = deep_analysis_res.json()
    check("Deep analysis produced score > 0", analysis_data["match_score"] > 50, f"Score: {analysis_data['match_score']}")
    check("Deep analysis produced strengths", len(analysis_data["strengths"]) > 0)
    check("Deep analysis produced category breakdown", len(analysis_data["skill_breakdown"]) > 0)

    # 5. Persist analysis in Supabase analyses table
    analysis_db_res = requests.post(f"{SUPABASE_URL}/rest/v1/analyses", headers=get_headers(token_a), json={
        "user_id": user_a_id,
        "resume_id": resume_id,
        "target_role": "Java Backend Developer",
        "match_score": analysis_data["match_score"],
        "strengths": analysis_data["strengths"],
        "missing_skills": analysis_data["missing_skills"],
        "recommendations": analysis_data["recommendations"],
        "skill_breakdown": analysis_data["skill_breakdown"]
    })
    check("Analyses table insertion status 201/200", analysis_db_res.status_code in [200, 201])
    analysis_id = analysis_db_res.json()[0]["id"]
    check("Analysis ID persisted in Supabase", bool(analysis_id))

    print("\n==========================================")
    print("STEP 5: JOB MATCHING & APPLICATIONS")
    print("==========================================")

    # Fetch jobs from public directory
    jobs_res = requests.get(f"{SUPABASE_URL}/rest/v1/jobs?select=*&limit=5", headers=get_headers(token_a))
    check("Query jobs table status 200", jobs_res.status_code == 200)
    jobs = jobs_res.json()
    check("Jobs table contains positions", len(jobs) > 0, f"Found {len(jobs)} jobs")
    job = jobs[0]

    # Perform AI Job Match Analysis via FastAPI
    match_res = requests.post(f"{FASTAPI_URL}/api/ai/job-match-analysis", json={
        "user_skills": ["Java", "Spring Boot", "PostgreSQL", "Kafka", "Docker", "AWS", "Redis"],
        "resume_text": resume_text_content,
        "job_title": job["title"],
        "company": job["company"],
        "job_description": job["description"],
        "target_role": "Java Backend Developer"
    })
    check("AI Job Match Analysis status 200", match_res.status_code == 200)
    match_data = match_res.json()
    check("AI Job Match score is calculated dynamically", match_data["match_score"] >= 60, f"Score: {match_data['match_score']}")
    check("AI Job Match identified matching skills", len(match_data["matching_skills"]) > 0)

    # Add Application for User A
    app_res = requests.post(f"{SUPABASE_URL}/rest/v1/applications", headers=get_headers(token_a), json={
        "user_id": user_a_id,
        "job_id": job["id"],
        "company": job["company"],
        "role": job["title"],
        "location": job["location"],
        "status": "APPLIED",
        "salary": job.get("salary_range", "₹14,00,000 / yr"),
        "notes": "Applied with tailored cover letter and STAR resume bullets."
    })
    check("Create Application status 201/200", app_res.status_code in [200, 201])
    app_id = app_res.json()[0]["id"]

    # Update Application Status (e.g. APPLIED -> INTERVIEW)
    app_update = requests.patch(
        f"{SUPABASE_URL}/rest/v1/applications?id=eq.{app_id}&user_id=eq.{user_a_id}",
        headers=get_headers(token_a),
        json={"status": "INTERVIEW", "notes": "Interview scheduled with Engineering Manager"}
    )
    check("Update Application status 200", app_update.status_code == 200)
    check("Application status is now INTERVIEW", app_update.json()[0]["status"] == "INTERVIEW")

    print("\n==========================================")
    print("STEP 6: CAREER ROADMAP GENERATION & PHASE TOGGLING")
    print("==========================================")

    # Generate 4-Phase Roadmap via FastAPI
    roadmap_api_res = requests.post(f"{FASTAPI_URL}/api/ai/generate-roadmap", json={
        "target_role": "Java Backend Developer",
        "current_skills": ["Java", "SQL", "Git"],
        "experience_level": "0-2 years (Fresher)"
    })
    check("AI Roadmap generation status 200", roadmap_api_res.status_code == 200)
    roadmap_data = roadmap_api_res.json()
    check("Roadmap has 4 phases", len(roadmap_data["phases"]) >= 4, f"Phases: {len(roadmap_data['phases'])}")

    # Persist Roadmap in Supabase roadmaps table
    roadmap_db_res = requests.post(f"{SUPABASE_URL}/rest/v1/roadmaps", headers=get_headers(token_a), json={
        "user_id": user_a_id,
        "target_role": "Java Backend Developer",
        "phases": roadmap_data["phases"]
    })
    check("Persist Roadmap status 201/200", roadmap_db_res.status_code in [200, 201])

    # Toggle a skill completion in Phase 1 and update Supabase
    phases = roadmap_data["phases"]
    phases[0]["skills"][0]["status"] = "COMPLETED"
    phases[0]["status"] = "IN_PROGRESS"
    roadmap_update = requests.patch(
        f"{SUPABASE_URL}/rest/v1/roadmaps?user_id=eq.{user_a_id}&target_role=eq.Java Backend Developer",
        headers=get_headers(token_a),
        json={"phases": phases, "updated_at": "now()"}
    )
    check("Update Roadmap skill progress status 200", roadmap_update.status_code == 200)
    check("Updated phase status verified in Supabase", roadmap_update.json()[0]["phases"][0]["skills"][0]["status"] == "COMPLETED")

    print("\n==========================================")
    print("STEP 7: MULTI-TENANT RLS ISOLATION AUDIT")
    print("==========================================")

    # User B tries to read User A's profile
    leak_profile = requests.get(f"{SUPABASE_URL}/rest/v1/profiles?user_id=eq.{user_a_id}", headers=get_headers(token_b))
    check("RLS: User B cannot view User A profile (returns empty array)", leak_profile.status_code == 200 and len(leak_profile.json()) == 0)

    # User B tries to read User A's resumes
    leak_resume = requests.get(f"{SUPABASE_URL}/rest/v1/resumes?user_id=eq.{user_a_id}", headers=get_headers(token_b))
    check("RLS: User B cannot view User A resumes (returns empty array)", leak_resume.status_code == 200 and len(leak_resume.json()) == 0)

    # User B tries to read User A's applications
    leak_apps = requests.get(f"{SUPABASE_URL}/rest/v1/applications?user_id=eq.{user_a_id}", headers=get_headers(token_b))
    check("RLS: User B cannot view User A applications (returns empty array)", leak_apps.status_code == 200 and len(leak_apps.json()) == 0)

    # User B tries to modify User A's application
    leak_patch = requests.patch(
        f"{SUPABASE_URL}/rest/v1/applications?id=eq.{app_id}",
        headers=get_headers(token_b),
        json={"notes": "Hacked by User B"}
    )
    check("RLS: User B cannot update User A application (returns empty modified array)", leak_patch.status_code == 200 and len(leak_patch.json()) == 0)

    # User B tries to read User A's AI analyses
    leak_analyses = requests.get(f"{SUPABASE_URL}/rest/v1/analyses?user_id=eq.{user_a_id}", headers=get_headers(token_b))
    check("RLS: User B cannot view User A analyses (returns empty array)", leak_analyses.status_code == 200 and len(leak_analyses.json()) == 0)

    # User B tries to read User A's roadmap
    leak_roadmap = requests.get(f"{SUPABASE_URL}/rest/v1/roadmaps?user_id=eq.{user_a_id}", headers=get_headers(token_b))
    check("RLS: User B cannot view User A roadmap (returns empty array)", leak_roadmap.status_code == 200 and len(leak_roadmap.json()) == 0)

    # User B tries to read User A's storage object
    leak_storage = requests.get(
        f"{SUPABASE_URL}/storage/v1/object/resumes/{storage_path}",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {token_b}"
        }
    )
    check("RLS: User B cannot download User A storage resume (returns 400/403/404)", leak_storage.status_code in [400, 403, 404])

    print("\n==========================================")
    print("STEP 8: ERROR HANDLING & NEGATIVE TESTS")
    print("==========================================")

    # Empty resume deep analysis
    empty_resume_req = requests.post(f"{FASTAPI_URL}/api/ai/deep-resume-analysis", json={
        "resume_text": "   ",
        "target_role": "Java Backend Developer"
    })
    check("Empty resume request rejected with 400 Bad Request", empty_resume_req.status_code == 400, f"Status: {empty_resume_req.status_code}")

    # Unauthenticated Supabase insert
    unauth_insert = requests.post(f"{SUPABASE_URL}/rest/v1/applications", headers={
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
    }, json={"company": "Test", "role": "Test"})
    check("Unauthenticated insert rejected by RLS (401 or 403)", unauth_insert.status_code in [400, 401, 403], f"Status: {unauth_insert.status_code}")

    print("\n==========================================")
    print(f"VERIFICATION COMPLETE: {passed} PASSED, {failed} FAILED")
    print("==========================================")

if __name__ == "__main__":
    run_e2e_verification()
