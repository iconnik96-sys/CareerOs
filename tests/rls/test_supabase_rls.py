import os
import sys
import json
import urllib.request
import urllib.error

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", "")

RLS_RESULTS = []

def log_rls_finding(test_id, table, scenario, passed, severity, location, details, evidence):
    RLS_RESULTS.append({
        "id": test_id,
        "table": table,
        "scenario": scenario,
        "passed": passed,
        "severity": severity,
        "location": location,
        "details": details,
        "evidence": evidence
    })
    status = "PASS" if passed else f"BUG CONFIRMED ({severity})"
    print(f"[{test_id}] [{status}] Table '{table}' -> {scenario}: {details}")

print("==========================================================")
print("[+] RUNNING STAGE 3: SUPABASE RLS & DATA ACCESS AUDIT")
print("==========================================================")

def http_req(url, method="GET", payload=None, token=None):
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {token or SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    data = json.dumps(payload).encode('utf-8') if payload else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode('utf-8')
            return resp.status, body
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8') if e.fp else str(e)
        return e.code, body
    except Exception as e:
        return 0, str(e)

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ENVIRONMENT BLOCKER] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set.")
    exit(1)

# 1. ANONYMOUS ACCESS TO USER TABLES
user_tables = ["profiles", "user_skills", "resumes", "applications", "analyses", "projects", "roadmaps"]

for idx, tbl in enumerate(user_tables, 1):
    test_id = f"RLS-ANON-0{idx}"
    status, body = http_req(f"{SUPABASE_URL}/rest/v1/{tbl}?select=*")
    if status == 200:
        data = json.loads(body)
        if len(data) > 0:
            log_rls_finding(
                test_id, tbl, "Anonymous Read User Data", False, "Critical",
                f"schema.sql: policy on public.{tbl}",
                f"Anonymous key returned {len(data)} user records!",
                f"GET /rest/v1/{tbl} -> HTTP {status} {body[:150]}"
            )
        else:
            log_rls_finding(test_id, tbl, "Anonymous Read User Data", True, "None", f"schema.sql", "RLS blocked anonymous data leak.", "")
    elif status in (401, 403):
        log_rls_finding(test_id, tbl, "Anonymous Read User Data", True, "None", f"schema.sql", "RLS blocked unauthenticated access.", f"HTTP {status}")
    else:
        log_rls_finding(test_id, tbl, "Anonymous Read User Data", False, "High", f"schema.sql", f"Returned status {status}: {body[:100]}", body)

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
out_dir = os.path.join(root_dir, "test-reports")
os.makedirs(out_dir, exist_ok=True)
with open(os.path.join(out_dir, "supabase_rls_test_results.json"), "w", encoding="utf-8") as f:
    json.dump(RLS_RESULTS, f, indent=2)

print(f"\nCompleted Stage 3 RLS tests. Total findings logged: {len(RLS_RESULTS)}")
