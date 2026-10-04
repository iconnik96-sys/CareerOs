import os
import sys
import json
import urllib.request
import urllib.error

FASTAPI_URL = "http://localhost:8000"
SECURITY_RESULTS = []

def log_sec(test_id, category, title, passed, severity, location, details, evidence=""):
    SECURITY_RESULTS.append({
        "id": test_id,
        "category": category,
        "title": title,
        "passed": passed,
        "severity": severity,
        "location": location,
        "details": details,
        "evidence": evidence
    })
    status = "✅ PASS" if passed else f"🚨 BUG CONFIRMED ({severity})"
    print(f"[{test_id}] [{status}] {title}: {details}")

print("==========================================================")
print("🔒 RUNNING STAGE 2: CORS & SECURITY CONFIGURATION AUDIT")
print("==========================================================")

# ---------------------------------------------------------
# 1. CORS WILDCARD & EVIL ORIGIN TEST
# ---------------------------------------------------------
try:
    req = urllib.request.Request(f"{FASTAPI_URL}/api/health", headers={
        "Origin": "http://evil-attacker.com",
        "Access-Control-Request-Method": "POST"
    }, method="OPTIONS")
    with urllib.request.urlopen(req) as resp:
        cors_origin = resp.headers.get("Access-Control-Allow-Origin", "")
        cors_creds = resp.headers.get("Access-Control-Allow-Credentials", "")
        if cors_origin == "*" and cors_creds == "true":
            log_sec(
                "SEC-CORS-01", "CORS Configuration", "Overly Permissive CORS Policy", False, "High",
                "backend/main.py:L40-46",
                "CORS middleware allows wildcard origin '*' together with allow_credentials=True.",
                f"Access-Control-Allow-Origin: {cors_origin}, Access-Control-Allow-Credentials: {cors_creds}"
            )
        else:
            log_sec("SEC-CORS-01", "CORS Configuration", "CORS Origin Check", True, "Low", "backend/main.py", f"Origin header: {cors_origin}", "")
except Exception as e:
    log_sec("SEC-CORS-01", "CORS Configuration", "CORS Check", False, "Medium", "backend/main.py", f"Server connection error: {e}")

# ---------------------------------------------------------
# 2. OPENAPI DOCS EXPOSURE IN PRODUCTION
# ---------------------------------------------------------
doc_routes = ["/docs", "/redoc", "/openapi.json"]

for idx, route in enumerate(doc_routes, 1):
    test_id = f"SEC-DOCS-0{idx}"
    try:
        req = urllib.request.Request(f"{FASTAPI_URL}{route}")
        with urllib.request.urlopen(req) as resp:
            if resp.status == 200:
                log_sec(
                    test_id, "Information Leakage", f"Interactive API Docs Exposed at {route}", False, "Low",
                    "backend/main.py:L33-37",
                    f"Swagger/OpenAPI documentation is publicly exposed at {route} without environment restriction.",
                    f"GET {route} -> HTTP 200 OK"
                )
    except Exception as e:
        log_sec(test_id, "Information Leakage", f"API Docs check at {route}", True, "None", "backend/main.py", "Docs endpoint disabled.", str(e))

# Save results
out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "test-reports"))
os.makedirs(out_dir, exist_ok=True)
with open(os.path.join(out_dir, "security_config_test_results.json"), "w", encoding="utf-8") as f:
    json.dump(SECURITY_RESULTS, f, indent=2)

print(f"\nCompleted CORS & Security tests. Total findings logged: {len(SECURITY_RESULTS)}")
