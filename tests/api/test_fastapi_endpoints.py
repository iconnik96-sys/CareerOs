import os
import sys
import json
import time
import urllib.request
import urllib.error

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
backend_dir = os.path.join(root_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

FASTAPI_URL = "http://localhost:8000"
TEST_RESULTS = []

def log_test(test_id, category, name, passed, details, evidence=""):
    TEST_RESULTS.append({
        "id": test_id,
        "category": category,
        "name": name,
        "passed": passed,
        "details": details,
        "evidence": evidence
    })
    status = "PASS" if passed else "FAIL / BUG CONFIRMED"
    print(f"[{test_id}] [{status}] {name}: {details}")

print("==========================================================")
print("[+] RUNNING STAGE 2: FASTAPI API & SECURITY TEST SUITE")
print("==========================================================")

ai_endpoints = [
    ("/api/ai/resume/analyze", "POST", {"resume_text": "Experienced software engineer", "target_role": "Backend"}),
    ("/api/ai/bullets/enhance", "POST", {"bullet_point": "Built an API", "target_role": "Backend"}),
    ("/api/ai/interview/evaluate", "POST", {"question": "What is REST?", "user_answer": "Representational State Transfer", "role": "Backend", "difficulty": "Easy"}),
    ("/api/ai/cover-letter/generate", "POST", {"job_title": "Developer", "company": "Acme", "job_description": "Java developer", "resume_summary": "Java expert"}),
    ("/api/ai/outreach/generate", "POST", {"recipient_type": "Recruiter", "company": "Acme", "target_role": "Backend", "key_highlight": "Java"}),
    ("/api/ai/copilot/chat", "POST", {"message": "How do I prep for system design?", "history": [], "user_profile": {}}),
    ("/api/ai/jobs/match", "POST", {"job_description": "Python dev needed", "resume_text": "Python developer"}),
    ("/api/ai/roadmap/generate", "POST", {"target_role": "DevOps", "current_skills": ["Linux"], "timeframe_weeks": 12}),
    ("/api/health", "GET", None)
]

for idx, (path, method, payload) in enumerate(ai_endpoints, 1):
    test_id = f"FASTAPI-AUTH-0{idx}"
    url = f"{FASTAPI_URL}{path}"
    headers = {"Content-Type": "application/json"}
    
    data = json.dumps(payload).encode('utf-8') if payload else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode('utf-8')
            if path != "/api/health":
                log_test(
                    test_id,
                    "Authentication Loophole",
                    f"Endpoint {path} missing Auth Token requirement",
                    False,
                    "Endpoint accepts unauthenticated requests with NO Bearer token or API key required.",
                    f"Request: {method} {url} without Auth headers -> HTTP {resp.status} Response: {body[:150]}"
                )
            else:
                log_test(test_id, "API Health", f"Health endpoint {path}", True, "Health check accessible.")
    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            log_test(test_id, "Authentication", f"Endpoint {path} authentication check", True, "Requires authentication token.")
        else:
            log_test(test_id, "Authentication", f"Endpoint {path} response code {e.code}", False, f"Unexpected error status {e.code}")
    except Exception as e:
        log_test(test_id, "Environment Block", f"Endpoint {path} connection issue", False, f"Could not connect to local server: {e}")

out_dir = os.path.join(root_dir, "test-reports")
os.makedirs(out_dir, exist_ok=True)
with open(os.path.join(out_dir, "fastapi_test_results.json"), "w", encoding="utf-8") as f:
    json.dump(TEST_RESULTS, f, indent=2)

print(f"\nCompleted Stage 2 API tests. Total tests run: {len(TEST_RESULTS)}")
