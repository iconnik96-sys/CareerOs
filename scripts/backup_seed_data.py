import os
import json
import ssl
import urllib.request

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", "")

BACKUP_DIR = r"c:\Users\nikhi\OneDrive\Desktop\Project\CareerOS - Copy\test-reports\backup"

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.")
    exit(1)

os.makedirs(BACKUP_DIR, exist_ok=True)
tables = ["jobs", "role_roadmaps", "interview_questions", "skills", "job_skills"]

for table in tables:
    url = f"{SUPABASE_URL}/rest/v1/{table}?select=*"
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    })
    try:
        with urllib.request.urlopen(req) as resp:
            data = resp.read().decode('utf-8')
            out_file = os.path.join(BACKUP_DIR, f"{table}.json")
            with open(out_file, "w", encoding="utf-8") as f:
                f.write(data)
            print(f"[BACKUP SUCCESS] {table}: {len(data)} bytes saved to {out_file}.")
    except Exception as e:
        print(f"[BACKUP ERROR] {table}: {e}")
