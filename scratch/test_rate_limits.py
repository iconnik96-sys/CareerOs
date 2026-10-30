import requests
import json
import base64
import time
import uuid

BASE_URL = "http://127.0.0.1:8000"

def create_mock_jwt(user_id, email):
    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).decode().rstrip("=")
    payload = base64.urlsafe_b64encode(json.dumps({
        "sub": user_id,
        "email": email,
        "exp": time.time() + 3600
    }).encode()).decode().rstrip("=")
    sig = "mock_signature"
    return f"{header}.{payload}.{sig}"

print("1. Testing Health Endpoint (Bypassed)...")
r = requests.get(f"{BASE_URL}/api/health")
assert r.status_code == 200, f"Health check failed: {r.status_code}"
print("   -> Health check passed: 200 OK")

print("\n2. Testing OPTIONS preflight request (Bypassed)...")
r = requests.options(
    f"{BASE_URL}/api/campus/join-by-code",
    headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "POST"}
)
assert r.status_code == 200, f"OPTIONS request failed: {r.status_code}"
print("   -> OPTIONS preflight passed: 200 OK")

print("\n3. Testing User-Aware Rate Limiting (Campus NAT isolation)...")
uid_a = f"usr-{uuid.uuid4().hex[:8]}"
uid_b = f"usr-{uuid.uuid4().hex[:8]}"
user_a_token = create_mock_jwt(uid_a, f"{uid_a}@campus.edu")
user_b_token = create_mock_jwt(uid_b, f"{uid_b}@campus.edu")

headers_a = {"Authorization": f"Bearer {user_a_token}", "X-Forwarded-For": "203.0.113.10"}
headers_b = {"Authorization": f"Bearer {user_b_token}", "X-Forwarded-For": "203.0.113.10"}

r_a1 = requests.get(f"{BASE_URL}/api/ai/companies-knowledge", headers=headers_a)
r_b1 = requests.get(f"{BASE_URL}/api/ai/companies-knowledge", headers=headers_b)

rem_a = int(r_a1.headers.get('X-RateLimit-Remaining', -1))
rem_b = int(r_b1.headers.get('X-RateLimit-Remaining', -1))
print(f"   -> User A ({uid_a}) remaining: {rem_a}")
print(f"   -> User B ({uid_b}) remaining: {rem_b}")
assert rem_a == 119, f"Expected User A to have 119 remaining, got {rem_a}"
assert rem_b == 119, f"Expected User B to have 119 remaining, got {rem_b}"
print("   -> Both users received independent buckets (Remaining: 119 each) despite sharing identical public IP!")

print("\n4. Testing Join Code Brute Force Protection (5 attempts / 300s)...")
test_ip = f"198.51.{uuid.uuid4().int % 250}.{uuid.uuid4().int % 250}"
statuses = []
for i in range(6):
    res = requests.post(
        f"{BASE_URL}/api/campus/join-by-code",
        json={"invite_code": "PROBE-CODE"},
        headers={"X-Forwarded-For": test_ip}
    )
    statuses.append(res.status_code)

print(f"   -> Join attempts statuses from IP {test_ip}: {statuses}")
assert statuses[:5] == [404, 404, 404, 404, 404], f"Expected first 5 to be 404: {statuses[:5]}"
assert statuses[5] == 429, f"Expected 6th to be 429: {statuses[5]}"
print("   -> Brute force protection successfully locked 6th attempt with HTTP 429!")

print("\n5. Testing Heavy AI Tier (Limit 10 req/min)...")
uid_heavy = f"usr-{uuid.uuid4().hex[:8]}"
heavy_token = create_mock_jwt(uid_heavy, f"{uid_heavy}@test.edu")
heavy_headers = {"Authorization": f"Bearer {heavy_token}"}
heavy_statuses = []
for i in range(11):
    res = requests.post(
        f"{BASE_URL}/api/ai/cover-letter",
        json={"job_title": "SWE", "company_name": "Google", "skills": ["Python"]},
        headers=heavy_headers
    )
    heavy_statuses.append(res.status_code)

print(f"   -> Heavy AI statuses: {heavy_statuses}")
assert all(s != 429 for s in heavy_statuses[:10]), f"First 10 should not be rate-limited: {heavy_statuses[:10]}"
assert heavy_statuses[10] == 429, f"Expected 11th to be 429: {heavy_statuses[10]}"
print("   -> Heavy AI tier successfully enforced max 10 requests/min!")

print("\n6. Testing File Upload Tier (Limit 6 uploads/min)...")
uid_upload = f"usr-{uuid.uuid4().hex[:8]}"
upload_token = create_mock_jwt(uid_upload, f"{uid_upload}@test.edu")
upload_headers = {"Authorization": f"Bearer {upload_token}"}
upload_statuses = []
for i in range(7):
    files = {'file': ('resume.txt', b'Skills: React, Python, SQL')}
    res = requests.post(
        f"{BASE_URL}/api/ai/parse-resume-file",
        files=files,
        headers=upload_headers
    )
    upload_statuses.append(res.status_code)

print(f"   -> File upload statuses: {upload_statuses}")
assert all(s != 429 for s in upload_statuses[:6]), f"First 6 should not be rate-limited: {upload_statuses[:6]}"
assert upload_statuses[6] == 429, f"Expected 7th upload to be 429: {upload_statuses[6]}"
print("   -> File upload tier successfully enforced max 6 uploads/min!")

print("\n=======================================================")
print("ALL MULTI-TIER RATE LIMITING VERIFICATIONS PASSED 100%!")
print("=======================================================")
