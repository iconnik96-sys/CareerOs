import os
import sys
import subprocess

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

print("==========================================================")
print("[+] CAREEROS MASTER AUTOMATED TEST SUITE RUNNER")
print("==========================================================")

python_bin = sys.executable

scripts = [
    "tests/api/test_fastapi_endpoints.py",
    "tests/security/test_cors_and_headers.py",
    "tests/rls/test_supabase_rls.py"
]

for s in scripts:
    p = os.path.abspath(s)
    if os.path.exists(p):
        print(f"\n--- Running: {s} ---")
        try:
            res = subprocess.run([python_bin, p], capture_output=True, text=True, encoding="utf-8", errors="replace")
            print(res.stdout)
            if res.stderr:
                print("STDERR:", res.stderr)
        except Exception as e:
            print(f"Error running {s}: {e}")
    else:
        print(f"Script not found: {p}")

print("\n==========================================================")
print("[+] Test suite execution finished. Check /test-reports/ for JSON output.")
print("==========================================================")
