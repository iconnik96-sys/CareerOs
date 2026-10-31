"""
CareerOS — Phase 1 Security Test Suite: JWT Verification & CORS Hardening
Validates:
- FIX-001: Cryptographic JWT signature enforcement, algorithm check, expiry check, fail-closed behavior
- FIX-002: Exact CORS origin allowlisting and rejection of unauthorized wildcards/domains
"""

import os
import sys
import json
import time
import base64
import hmac
import hashlib

# Ensure backend root is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app
from routers.admin import decode_and_verify_jwt

TEST_JWT_SECRET = "careeros-super-secure-test-jwt-secret-key-32chars"

def create_test_jwt(
    payload_overrides=None,
    alg="HS256",
    secret=TEST_JWT_SECRET,
    sign=True,
    custom_sig=None
):
    """Utility to generate synthetic JWTs for positive & negative security tests."""
    header = {"alg": alg, "typ": "JWT"}
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode("utf-8")).decode("utf-8").rstrip("=")

    default_payload = {
        "sub": "user-test-uuid-1234",
        "email": "student@careeros.ai",
        "role": "authenticated",
        "aud": "authenticated",
        "exp": int(time.time()) + 3600
    }
    if payload_overrides:
        default_payload.update(payload_overrides)

    payload_b64 = base64.urlsafe_b64encode(json.dumps(default_payload).encode("utf-8")).decode("utf-8").rstrip("=")

    if custom_sig is not None:
        sig = custom_sig
    elif sign and secret and alg != "none":
        signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
        sig = base64.urlsafe_b64encode(
            hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
        ).decode("utf-8").rstrip("=")
    else:
        sig = "unsigned-or-dummy-sig"

    return f"{header_b64}.{payload_b64}.{sig}"

def run_phase1_security_tests():
    print("=" * 70)
    print("RUNNING CAREEROS PHASE 1 SECURITY VERIFICATION SUITE")
    print("=" * 70)

    passed = 0
    failed = 0

    def assert_test(name, condition, extra=""):
        nonlocal passed, failed
        if condition:
            passed += 1
            print(f"  [PASS] {name} {extra}")
        else:
            failed += 1
            print(f"  [FAIL] {name} {extra}")
            raise AssertionError(f"Security assertion failed: {name}")

    # Set secret in environment for test suite
    os.environ["SUPABASE_JWT_SECRET"] = TEST_JWT_SECRET

    # -------------------------------------------------------------
    # 1. JWT CRYPTOGRAPHIC SIGNATURE & VALIDATION TESTS (FIX-001)
    # -------------------------------------------------------------
    print("\n--- 1. Testing JWT Cryptographic Verification (FIX-001) ---")

    # Test 1.1: Genuine valid JWT signed with correct secret
    valid_token = create_test_jwt()
    decoded = decode_and_verify_jwt(valid_token)
    assert_test("Valid JWT signed with correct secret is accepted", decoded is not None and decoded.get("email") == "student@careeros.ai")

    # Test 1.2: Unsigned / mock signature JWT (The exact attack from FINDING-001)
    forged_token = create_test_jwt(custom_sig="mock_signature")
    decoded_forged = decode_and_verify_jwt(forged_token)
    assert_test("Forged token with dummy signature is REJECTED", decoded_forged is None)

    # Test 1.3: Token signed with wrong secret
    wrong_secret_token = create_test_jwt(secret="wrong-secret-key-99999999999999999")
    decoded_wrong = decode_and_verify_jwt(wrong_secret_token)
    assert_test("Token signed with incorrect secret is REJECTED", decoded_wrong is None)

    # Test 1.4: Tampered payload with valid original signature
    parts = valid_token.split(".")
    tampered_payload = {"sub": "hacked-user-id", "email": "nikhil@gmail.com", "role": "admin", "exp": int(time.time()) + 3600}
    tampered_payload_b64 = base64.urlsafe_b64encode(json.dumps(tampered_payload).encode("utf-8")).decode("utf-8").rstrip("=")
    tampered_token = f"{parts[0]}.{tampered_payload_b64}.{parts[2]}"
    decoded_tampered = decode_and_verify_jwt(tampered_token)
    assert_test("Tampered payload with mismatched signature is REJECTED", decoded_tampered is None)

    # Test 1.5: Expired token
    expired_token = create_test_jwt(payload_overrides={"exp": int(time.time()) - 600})
    decoded_expired = decode_and_verify_jwt(expired_token)
    assert_test("Expired token is REJECTED", decoded_expired is None)

    # Test 1.6: Token missing 'exp' claim
    no_exp_token = create_test_jwt(payload_overrides={"exp": None})
    decoded_no_exp = decode_and_verify_jwt(no_exp_token)
    assert_test("Token missing 'exp' expiration claim is REJECTED", decoded_no_exp is None)

    # Test 1.7: Algorithm confusion attack ('alg': 'none')
    none_alg_token = create_test_jwt(alg="none", sign=False, custom_sig="")
    decoded_none = decode_and_verify_jwt(none_alg_token)
    assert_test("Algorithm 'none' token is REJECTED", decoded_none is None)

    # Test 1.8: Disallowed asymmetric algorithm ('alg': 'RS256')
    rs_token = create_test_jwt(alg="RS256", custom_sig="dummy-rsa-signature")
    decoded_rs = decode_and_verify_jwt(rs_token)
    assert_test("Disallowed asymmetric algorithm ('RS256') is REJECTED", decoded_rs is None)

    # Test 1.9: Fail-closed verification when SUPABASE_JWT_SECRET is unset
    os.environ.pop("SUPABASE_JWT_SECRET", None)
    decoded_fail_closed = decode_and_verify_jwt(valid_token)
    assert_test("Unset SUPABASE_JWT_SECRET causes decode_and_verify_jwt to FAIL CLOSED", decoded_fail_closed is None)

    # Restore test secret
    os.environ["SUPABASE_JWT_SECRET"] = TEST_JWT_SECRET

    # Test 1.10: Real live Supabase ES256 token verified cryptographically via JWKS
    supabase_url = os.getenv("VITE_SUPABASE_URL", "https://mkegptssjhjchwcpatnp.supabase.co")
    supabase_anon = os.getenv("VITE_SUPABASE_ANON_KEY", "")
    if supabase_url and supabase_anon:
        try:
            import requests
            headers = {"apikey": supabase_anon, "Authorization": f"Bearer {supabase_anon}", "Content-Type": "application/json"}
            res = requests.post(
                f"{supabase_url}/auth/v1/signup",
                headers=headers,
                json={"email": f"phase1_verify_{os.getpid()}@careeros.test", "password": "SecurePassword@123!"},
                timeout=8
            )
            live_token = res.json().get("access_token")
            if live_token:
                decoded_live = decode_and_verify_jwt(live_token)
                assert_test("Live Supabase ES256 asymmetric token verified via JWKS", decoded_live is not None and decoded_live.get("aud") == "authenticated")

                # Test 1.11: Forged ES256 token with altered signature is strictly rejected
                forged_es256 = live_token[:-10] + "tampered99"
                decoded_forged_es = decode_and_verify_jwt(forged_es256)
                assert_test("Tampered ES256 token is REJECTED by JWKS verification", decoded_forged_es is None)
        except Exception as e:
            print(f"  [SKIP] Live Supabase ES256 test skipped (network/offline): {e}")

    # -------------------------------------------------------------
    # 2. FASTAPI ENDPOINT INTEGRATION TESTS (FIX-001)
    # -------------------------------------------------------------
    print("\n--- 2. Testing Protected API Endpoints via TestClient ---")
    client = TestClient(app)

    # Test 2.1: Protected AI endpoint rejects request without Authorization header
    res_no_auth = client.post("/api/ai/enhance-bullet", json={"raw_bullet": "I wrote code"})
    assert_test("Protected AI endpoint rejects unauthenticated request (401)", res_no_auth.status_code == 401)

    # Test 2.2: Protected AI endpoint rejects forged mock JWT
    res_forged = client.post(
        "/api/ai/enhance-bullet",
        headers={"Authorization": f"Bearer {forged_token}"},
        json={"raw_bullet": "I wrote code"}
    )
    assert_test("Protected AI endpoint rejects forged mock token (401)", res_forged.status_code == 401)

    # Test 2.3: Admin endpoint rejects unauthenticated request
    res_admin_unauth = client.get("/api/admin/metrics")
    assert_test("Admin endpoint rejects unauthenticated request (403)", res_admin_unauth.status_code == 403)

    # Test 2.4: Admin endpoint rejects forged student token claiming founder email
    forged_admin_token = create_test_jwt(
        payload_overrides={"email": "nikhil@gmail.com", "app_metadata": {"role": "admin"}},
        custom_sig="invalid_forged_sig"
    )
    res_admin_forged = client.get("/api/admin/metrics", headers={"Authorization": f"Bearer {forged_admin_token}"})
    assert_test("Admin endpoint rejects forged admin token with invalid signature (403)", res_admin_forged.status_code == 403)

    # Test 2.5: Admin endpoint accepts authentic token signed with correct secret and founder email
    os.environ["FOUNDER_EMAIL"] = "founder@careeros.ai"
    valid_founder_token = create_test_jwt(payload_overrides={"email": "founder@careeros.ai"})
    res_admin_valid = client.get("/api/admin/metrics", headers={"Authorization": f"Bearer {valid_founder_token}"})
    assert_test("Admin endpoint accepts authentic cryptographically verified founder token (200)", res_admin_valid.status_code == 200)

    # -------------------------------------------------------------
    # 3. CORS RESTRICTION & ORIGIN VALIDATION TESTS (FIX-002)
    # -------------------------------------------------------------
    print("\n--- 3. Testing CORS Origins & Wildcard Restriction (FIX-002) ---")

    # Test 3.1: Allowed Localhost Development Origin (http://localhost:5173)
    res_cors_local = client.options(
        "/api/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET"
        }
    )
    allow_origin = res_cors_local.headers.get("access-control-allow-origin")
    assert_test("Authorized localhost:5173 origin is ALLOWED by CORS", allow_origin == "http://localhost:5173")

    # Test 3.2: Allowed Production Vercel Origin (https://careeros.vercel.app)
    res_cors_prod = client.options(
        "/api/health",
        headers={
            "Origin": "https://careeros.vercel.app",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert_test("Authorized production origin https://careeros.vercel.app is ALLOWED by CORS", res_cors_prod.headers.get("access-control-allow-origin") == "https://careeros.vercel.app")

    # Test 3.3: Allowed Production Netlify Origin (https://careeros.netlify.app)
    res_cors_net = client.options(
        "/api/health",
        headers={
            "Origin": "https://careeros.netlify.app",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert_test("Authorized production origin https://careeros.netlify.app is ALLOWED by CORS", res_cors_net.headers.get("access-control-allow-origin") == "https://careeros.netlify.app")

    # Test 3.4: Disallowed Attacker Vercel Subdomain (https://attacker-app.vercel.app)
    # Under old vulnerable config: MATCHED regex and was ALLOWED!
    # Under hardened config: MUST BE REJECTED (no access-control-allow-origin header)
    res_cors_evil_vercel = client.options(
        "/api/health",
        headers={
            "Origin": "https://attacker-app.vercel.app",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert_test(
        "Third-party Vercel subdomain https://attacker-app.vercel.app is BLOCKED",
        res_cors_evil_vercel.headers.get("access-control-allow-origin") is None
    )

    # Test 3.5: Disallowed Attacker Netlify Subdomain (https://evil-phish.netlify.app)
    res_cors_evil_netlify = client.options(
        "/api/health",
        headers={
            "Origin": "https://evil-phish.netlify.app",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert_test(
        "Third-party Netlify subdomain https://evil-phish.netlify.app is BLOCKED",
        res_cors_evil_netlify.headers.get("access-control-allow-origin") is None
    )

    # Test 3.6: Disallowed Arbitrary OnRender Domain (https://malicious.onrender.com)
    res_cors_evil_render = client.options(
        "/api/health",
        headers={
            "Origin": "https://malicious.onrender.com",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert_test(
        "Third-party Render subdomain https://malicious.onrender.com is BLOCKED",
        res_cors_evil_render.headers.get("access-control-allow-origin") is None
    )

    # Test 3.7: Disallowed Arbitrary Third-Party Origin (https://evil-hacker.com)
    res_cors_evil_hacker = client.options(
        "/api/health",
        headers={
            "Origin": "https://evil-hacker.com",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert_test(
        "Arbitrary third-party origin https://evil-hacker.com is BLOCKED",
        res_cors_evil_hacker.headers.get("access-control-allow-origin") is None
    )

    print("\n" + "=" * 70)
    print(f"PHASE 1 SECURITY TEST SUITE RESULTS: {passed} PASSED, {failed} FAILED")
    print("=" * 70)
    return passed, failed

if __name__ == "__main__":
    passed, failed = run_phase1_security_tests()
    if failed > 0:
        sys.exit(1)
    sys.exit(0)

