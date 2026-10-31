import os

import sys

import time

import json

import uuid

import hmac

import hashlib

import unittest

import threading

from fastapi.testclient import TestClient



# Ensure backend directory is in sys.path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))



from main import app

import jwt

from routers.admin import decode_and_verify_jwt

from services.quota_service import (

    check_and_consume_quota,

    get_user_plan_id,

    TIER_QUOTAS,

    _usage_tracker,

    _tracker_lock

)

from services.payment_service import (

    create_payment_order,

    verify_payment_signature,

    process_webhook_event,

    get_user_subscription,

    get_razorpay_credentials,

    PRICING_CATALOG

)

from fastapi import HTTPException





class TestCriticalRemediationsAndPayments(unittest.TestCase):



    @classmethod

    def setUpClass(cls):

        cls.client = TestClient(app)

        cls.jwt_secret = "test-secret-at-least-32-chars-long-security-2026!!"

        os.environ["SUPABASE_JWT_SECRET"] = cls.jwt_secret

        os.environ["VITE_SUPABASE_URL"] = "https://mkegptssjhjchwcpatnp.supabase.co"

        os.environ["RAZORPAY_KEY_ID"] = "rzp_test_careerOS2026"

        os.environ["RAZORPAY_KEY_SECRET"] = "test_secret_careerOS_sec_2026"

        os.environ["RAZORPAY_WEBHOOK_SECRET"] = "test_webhook_sec_2026"



    def _generate_token(self, sub="user-std-101", email="student@apextech.edu.in", role="student", institution_id=None, plan_id="free", extra_claims=None):

        payload = {

            "sub": sub,

            "email": email,

            "aud": "authenticated",

            "iss": f"{os.environ['VITE_SUPABASE_URL']}/auth/v1",

            "exp": time.time() + 3600,

            "app_metadata": {

                "role": role,

                "plan_id": plan_id

            }

        }

        if institution_id:

            payload["app_metadata"]["institution_id"] = institution_id

        if extra_claims:

            payload.update(extra_claims)

        return jwt.encode(payload, self.jwt_secret, algorithm="HS256")



    # ====================================================================

    # 1. RESUME UPLOAD INTEGRATION TESTS (Issue A)

    # ====================================================================

    def test_01_resume_upload_valid_auth_success(self):

        """Test 1: Authenticated multipart PDF upload executes without HTTP 500 Depends error."""

        token = self._generate_token(plan_id="pro")

        pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n185\n%%EOF"

        

        res = self.client.post(

            "/api/ai/analyze-resume-upload",

            headers={"Authorization": f"Bearer {token}"},

            files={"file": ("candidate_resume.pdf", pdf_bytes, "application/pdf")},

            data={"target_role": "Java Backend Developer"}

        )

        self.assertIn(res.status_code, [200, 503])

        self.assertNotEqual(res.status_code, 500)



    def test_02_resume_upload_unauthenticated_rejected(self):

        """Test 2: Unauthenticated upload is strictly rejected with HTTP 401."""

        res = self.client.post(

            "/api/ai/analyze-resume-upload",

            files={"file": ("resume.pdf", b"%PDF-1.4 sample", "application/pdf")}

        )

        self.assertEqual(res.status_code, 401)



    # ====================================================================

    # 2. CAMPUS TENANT ISOLATION & BOLA (Issue C)

    # ====================================================================

    def test_03_college_a_accessing_college_b_roster_forbidden(self):

        """Test 5: College A TPO attempting to view College B roster receives HTTP 403."""

        token_a = self._generate_token(role="tpo", institution_id="inst-college-a-uuid")

        res = self.client.get(

            "/api/campus/students?institution_id=inst-college-b-uuid",

            headers={"Authorization": f"Bearer {token_a}"}

        )

        self.assertEqual(res.status_code, 403)

        self.assertIn("not authorized to view or manage resources for another institution", res.text)



    def test_04_college_a_accessing_college_b_drilldown_not_found(self):

        """Test 5b: College A TPO attempting drilldown on student of College B receives HTTP 404."""

        token_a = self._generate_token(role="tpo", institution_id="inst-college-a-uuid")

        # stu-001 belongs to _SEED_INSTITUTION_ID

        res = self.client.get(

            "/api/campus/students/stu-001/drilldown",

            headers={"Authorization": f"Bearer {token_a}"}

        )

        self.assertEqual(res.status_code, 404)



    def test_05_college_b_accessing_own_drilldown_allowed(self):

        """Test 6: College TPO accessing student within their own institution receives HTTP 200."""

        token_seed = self._generate_token(role="tpo", institution_id="b7a12345-0000-0000-0000-000000000001")

        res = self.client.get(

            "/api/campus/students/stu-001/drilldown",

            headers={"Authorization": f"Bearer {token_seed}"}

        )

        self.assertEqual(res.status_code, 200)

        self.assertEqual(res.json().get("student", {}).get("id"), "stu-001")



    def test_06_campus_auth_rejects_query_param_token(self):

        """Test: Sensitive JWT in query parameter is rejected (must be Authorization header)."""

        token = self._generate_token(role="tpo")

        res = self.client.get(f"/api/campus/overview?auth_token={token}")

        self.assertEqual(res.status_code, 401)



    # ====================================================================

    # 3. COMMERCIAL QUOTA & METADATA SECURITY (Phase 2)

    # ====================================================================

    def test_07_user_metadata_plan_id_tamper_rejected(self):

        """Test 7: Client-controlled user_metadata.plan_id cannot elevate free user to Pro."""

        # Malicious user sets user_metadata = {'plan_id': 'pro'}

        tampered_user = {

            "sub": "attacker-user-01",

            "email": "attacker@careeros.com",

            "user_metadata": {"plan_id": "pro"},

            "app_metadata": {} # app_metadata is empty

        }

        resolved_plan = get_user_plan_id(tampered_user)

        self.assertEqual(resolved_plan, "free")



    def test_08_ultimate_plan_entitlements(self):

        """Test 8: Ultimate plan user receives correct entitlements (75 scans, 30 interviews)."""

        ultimate_user = {

            "sub": "vip-student-01",

            "email": "vip@careeros.com",

            "app_metadata": {"plan_id": "ultimate"}

        }

        self.assertEqual(get_user_plan_id(ultimate_user), "ultimate")

        self.assertEqual(TIER_QUOTAS["ultimate"]["resume_scans"], 75)

        self.assertEqual(TIER_QUOTAS["ultimate"]["voice_interviews"], 30)



    def test_09_free_plan_monthly_quota_exhaustion(self):

        """Test: Free tier user blocked on exceeding 2 resume scans per month."""

        free_user = {

            "sub": f"free-user-{uuid.uuid4().hex[:6]}",

            "email": "free@careeros.com",

            "app_metadata": {"plan_id": "free"}

        }

        # First 2 scans allowed

        check_and_consume_quota(free_user, "resume_scans")

        check_and_consume_quota(free_user, "resume_scans")



        # 3rd scan in same month raises HTTP 403

        with self.assertRaises(HTTPException) as ctx:

            check_and_consume_quota(free_user, "resume_scans")

        self.assertEqual(ctx.exception.status_code, 403)

        self.assertIn("Monthly subscription quota reached", ctx.exception.detail)



    def test_10_concurrent_quota_consumption_thread_safety(self):

        """Test 9: Concurrent requests safely respect quota boundary."""

        test_uid = f"concurrent-user-{uuid.uuid4().hex[:6]}"

        user = {"sub": test_uid, "email": "test@test.com", "app_metadata": {"plan_id": "free"}}

        

        # Free limit is 2

        success_count = [0]

        blocked_count = [0]



        def worker():

            try:

                check_and_consume_quota(user, "resume_scans")

                success_count[0] += 1

            except HTTPException:

                blocked_count[0] += 1



        threads = [threading.Thread(target=worker) for _ in range(10)]

        for t in threads: t.start()

        for t in threads: t.join()



        self.assertEqual(success_count[0], 2)

        self.assertEqual(blocked_count[0], 8)



    def test_11_voice_interview_quota_enforcement(self):

        """Test 11: Voice interview evaluation enforces quota."""

        token = self._generate_token(sub=f"user-voice-{uuid.uuid4().hex[:6]}", plan_id="free")

        # Call interview evaluation 1 time (free quota: 1)

        res1 = self.client.post(

            "/api/ai/evaluate-interview-answer",

            headers={"Authorization": f"Bearer {token}"},

            json={"question": "What is an index in SQL?", "candidate_answer": "An index is a B-tree data structure that accelerates lookups."}

        )

        self.assertIn(res1.status_code, [200, 503])



        # Second evaluation should be blocked with 403 (quota exceeded)

        res2 = self.client.post(

            "/api/ai/evaluate-interview-answer",

            headers={"Authorization": f"Bearer {token}"},

            json={"question": "What is an index in SQL?", "candidate_answer": "An index is a B-tree data structure that accelerates lookups."}

        )

        self.assertEqual(res2.status_code, 403)

        self.assertIn("Monthly subscription quota reached", res2.text)



    # ====================================================================

    # 4. JWT HARDENING (Phase 3)

    # ====================================================================

    def test_12_jwt_future_nbf_rejected(self):

        """Test 13: JWT with future Not-Before (nbf) timestamp is rejected."""

        token_nbf = jwt.encode({

            "sub": "user-future",

            "email": "future@test.com",

            "aud": "authenticated",

            "exp": time.time() + 3600,

            "nbf": time.time() + 1000 # 1000 seconds in future

        }, self.jwt_secret, algorithm="HS256")

        self.assertIsNone(decode_and_verify_jwt(token_nbf))



    def test_13_jwt_missing_sub_rejected(self):

        """Test: JWT missing subject claim ('sub') is rejected."""

        token_no_sub = jwt.encode({

            "email": "nosub@test.com",

            "aud": "authenticated",

            "exp": time.time() + 3600

        }, self.jwt_secret, algorithm="HS256")

        self.assertIsNone(decode_and_verify_jwt(token_no_sub))



    def test_14_jwt_invalid_audience_rejected(self):

        """Test: JWT with invalid audience is rejected."""

        token_bad_aud = jwt.encode({

            "sub": "user-bad-aud",

            "email": "test@test.com",

            "aud": "untrusted-external-audience",

            "exp": time.time() + 3600

        }, self.jwt_secret, algorithm="HS256")

        self.assertIsNone(decode_and_verify_jwt(token_bad_aud))



    # ====================================================================

    # 5. RAZORPAY PAYMENT GATEWAY & FINANCIAL SECURITY (Phase 7)

    # ====================================================================

    def test_15_payment_order_creation_server_side_pricing(self):

        """Phase 7: Order creation calculates price server-side in INR paise."""

        order = create_payment_order(

            user_id="user-order-01",

            user_email="buyer@careeros.com",

            plan_id="pro",

            billing_cycle="monthly"

        )

        self.assertEqual(order["amount_inr"], 149)

        self.assertEqual(order["amount_paise"], 14900)

        self.assertEqual(order["currency"], "INR")

        self.assertEqual(order["plan_id"], "pro")

        self.assertTrue(order["razorpay_order_id"].startswith("order_"))



    def test_16_payment_order_idempotency_prevents_duplicate_orders(self):

        """Phase 7: Double-clicking Pay returns existing pending order rather than creating duplicate."""

        idem_key = f"double_click_test_{uuid.uuid4().hex}"

        

        order1 = create_payment_order(

            user_id="user-order-02",

            user_email="buyer@careeros.com",

            plan_id="pro",

            billing_cycle="monthly",

            idempotency_key=idem_key

        )

        order2 = create_payment_order(

            user_id="user-order-02",

            user_email="buyer@careeros.com",

            plan_id="pro",

            billing_cycle="monthly",

            idempotency_key=idem_key

        )

        # Must return the EXACT same order ID

        self.assertEqual(order1["razorpay_order_id"], order2["razorpay_order_id"])

        self.assertEqual(order1["internal_purchase_id"], order2["internal_purchase_id"])



    def test_17_payment_verification_valid_signature_activates_plan(self):

        """Phase 7: Valid HMAC-SHA256 signature activates Pro subscription."""

        order = create_payment_order(

            user_id="user-verify-01",

            user_email="verify@careeros.com",

            plan_id="pro",

            billing_cycle="monthly"

        )

        order_id = order["razorpay_order_id"]

        payment_id = f"pay_{uuid.uuid4().hex[:14]}"

        

        # Generate valid signature

        key_secret = os.environ["RAZORPAY_KEY_SECRET"]

        sig = hmac.new(key_secret.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()



        result = verify_payment_signature(

            razorpay_order_id=order_id,

            razorpay_payment_id=payment_id,

            razorpay_signature=sig,

            user_id="user-verify-01",

            internal_purchase_id=order["internal_purchase_id"]

        )

        self.assertEqual(result["status"], "success")

        self.assertEqual(result["plan_id"], "pro")



        # Verify subscription is now active

        sub = get_user_subscription("user-verify-01")

        self.assertEqual(sub["plan_id"], "pro")

        self.assertEqual(sub["status"], "active")



    def test_18_payment_verification_forged_signature_rejected(self):

        """Phase 7: Tampered or forged payment signature is strictly rejected."""

        order = create_payment_order(

            user_id="user-verify-02",

            user_email="verify2@careeros.com",

            plan_id="ultimate",

            billing_cycle="monthly"

        )

        with self.assertRaises(ValueError):

            verify_payment_signature(

                razorpay_order_id=order["razorpay_order_id"],

                razorpay_payment_id="pay_forged12345",

                razorpay_signature="invalid_forged_signature_hex",

                user_id="user-verify-02"

            )



    def test_19_payment_belonging_to_another_user_forbidden(self):

        """Phase 7: User B cannot claim or verify an order created by User A."""

        order = create_payment_order(

            user_id="user-legit-owner",

            user_email="owner@careeros.com",

            plan_id="pro"

        )

        key_secret = os.environ["RAZORPAY_KEY_SECRET"]

        payment_id = "pay_intercepted_01"

        sig = hmac.new(key_secret.encode(), f"{order['razorpay_order_id']}|{payment_id}".encode(), hashlib.sha256).hexdigest()



        # Attacker tries to verify legit user's order under attacker user_id

        with self.assertRaises(PermissionError):

            verify_payment_signature(

                razorpay_order_id=order["razorpay_order_id"],

                razorpay_payment_id=payment_id,

                razorpay_signature=sig,

                user_id="user-attacker-hijack",

                internal_purchase_id=order["internal_purchase_id"]

            )



    def test_20_payment_verification_is_idempotent(self):

        """Phase 7: Repeated payment verification requests succeed without duplicating duration."""

        order = create_payment_order(user_id="user-idem-01", user_email="idem@test.com", plan_id="ultimate")

        order_id = order["razorpay_order_id"]

        payment_id = f"pay_{uuid.uuid4().hex[:14]}"

        key_secret = os.environ["RAZORPAY_KEY_SECRET"]

        sig = hmac.new(key_secret.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()



        res1 = verify_payment_signature(order_id, payment_id, sig, "user-idem-01", order["internal_purchase_id"])

        res2 = verify_payment_signature(order_id, payment_id, sig, "user-idem-01", order["internal_purchase_id"])

        self.assertEqual(res1["status"], "success")

        self.assertEqual(res2["status"], "already_verified")



    def test_21_webhook_processing_valid_signature_and_deduplication(self):

        """Phase 7: Webhook verifies signature over raw bytes and deduplicates events."""

        raw_body = json.dumps({

            "id": f"evt_webhook_{uuid.uuid4().hex[:10]}",

            "event": "payment.captured",

            "payload": {

                "payment": {

                    "entity": {

                        "id": "pay_hook_123",

                        "order_id": "order_non_existent",

                        "status": "captured"

                    }

                }

            }

        }).encode("utf-8")



        webhook_secret = os.environ["RAZORPAY_WEBHOOK_SECRET"]

        valid_hook_sig = hmac.new(webhook_secret.encode(), raw_body, hashlib.sha256).hexdigest()



        # 1. First event processed

        res1 = process_webhook_event(raw_body, valid_hook_sig)

        self.assertEqual(res1["status"], "processed")



        # 2. Duplicate event acknowledged idempotently

        res2 = process_webhook_event(raw_body, valid_hook_sig)

        self.assertEqual(res2["status"], "duplicate_acknowledged")



    def test_22_webhook_invalid_signature_rejected(self):

        """Phase 7: Webhook with forged signature is strictly rejected."""

        raw_body = b'{"event": "payment.captured"}'

        with self.assertRaises(ValueError):

            process_webhook_event(raw_body, "forged_webhook_signature")





    def test_23_export_csv_cross_college_forbidden(self):

        """FINDING-018: College A TPO attempting to export College B student CSV receives HTTP 403."""

        token_col_a = self._generate_token(

            email="tpo@college-a.edu",

            role="tpo",

            institution_id="inst-college-a-uuid"

        )

        res = self.client.get(

            "/api/campus/export-csv?institution_id=inst-college-b-uuid",

            headers={"Authorization": f"Bearer {token_col_a}"}

        )

        self.assertEqual(res.status_code, 403)

        self.assertIn("Forbidden", res.json()["detail"])



    def test_24_export_csv_own_college_allowed(self):

        """FINDING-018: College TPO exporting own institution student CSV receives HTTP 200."""

        from routers.campus import _SEED_INSTITUTION_ID

        token_col = self._generate_token(

            email="tpo@apextech.edu.in",

            role="tpo",

            institution_id=_SEED_INSTITUTION_ID

        )

        res = self.client.get(

            f"/api/campus/export-csv?institution_id={_SEED_INSTITUTION_ID}",

            headers={"Authorization": f"Bearer {token_col}"}

        )

        self.assertEqual(res.status_code, 200)

        self.assertEqual(res.headers["content-type"], "text/csv; charset=utf-8")

        self.assertIn("Roll Number,Full Name,Email,Branch", res.text)



    def test_25_expensive_endpoint_parse_and_extract_quota_enforced(self):

        """FINDING-019: POST /api/ai/parse-and-extract-profile enforces monthly resume scan quota."""

        token_free = self._generate_token(

            sub="user-heavy-extract-01",

            email="heavy@student.edu",

            plan_id="free"

        )

        month_key = time.strftime("%Y-%m")

        key = f"user-heavy-extract-01:resume_scans:{month_key}"

        _usage_tracker[key] = 2  # Already at limit (2 scans)



        fake_pdf = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n178\n%%EOF"

        res = self.client.post(

            "/api/ai/parse-and-extract-profile",

            headers={"Authorization": f"Bearer {token_free}"},

            files={"file": ("resume.pdf", fake_pdf, "application/pdf")}

        )

        self.assertEqual(res.status_code, 403)

        self.assertIn("Monthly subscription quota reached", res.json()["detail"])



    def test_26_expensive_endpoint_rag_outreach_quota_enforced(self):

        """FINDING-019: POST /api/ai/rag-company-outreach enforces cover letter quota."""

        token_free = self._generate_token(

            sub="user-rag-outreach-01",

            email="rag@student.edu",

            plan_id="free"

        )

        month_key = time.strftime("%Y-%m")

        key = f"user-rag-outreach-01:cover_letters:{month_key}"

        _usage_tracker[key] = 30  # At limit



        payload = {

            "full_name": "Test Student",

            "target_role": "Backend Engineer",

            "company_name": "Razorpay"

        }

        res = self.client.post(

            "/api/ai/rag-company-outreach",

            headers={"Authorization": f"Bearer {token_free}"},

            json=payload

        )

        self.assertEqual(res.status_code, 403)

        self.assertIn("Monthly subscription quota reached", res.json()["detail"])



    def test_27_quota_persistence_survives_reloads(self):

        """FINDING-020: Quota usage counts survive cache reloads via disk persistence."""

        from services.quota_service import _load_quota_cache, _save_quota_cache, PERSIST_QUOTA_FILE

        month_key = time.strftime("%Y-%m")

        test_key = f"test-persist-user-999:resume_scans:{month_key}"

        _usage_tracker[test_key] = 7

        _save_quota_cache()



        # Wipe memory

        _usage_tracker.pop(test_key, None)

        self.assertNotIn(test_key, _usage_tracker)



        # Reload from disk

        _load_quota_cache()

        self.assertEqual(_usage_tracker.get(test_key), 7)



    def test_28_payment_persistence_survives_reloads(self):

        """FINDING-020: Payment orders and subscriptions survive reloads via disk persistence."""

        from services.payment_service import (

            _load_payment_cache,

            _save_payment_cache,

            _user_subscriptions,

            _orders_db

        )

        test_sub_user = "user-persist-payment-999"

        _user_subscriptions[test_sub_user] = {

            "user_id": test_sub_user,

            "plan_id": "ultimate",

            "status": "active"

        }

        _save_payment_cache()



        # Wipe memory

        _user_subscriptions.pop(test_sub_user, None)

        self.assertNotIn(test_sub_user, _user_subscriptions)



        # Reload from disk

        _load_payment_cache()

        self.assertEqual(_user_subscriptions.get(test_sub_user, {}).get("plan_id"), "ultimate")



    def test_29_active_payment_elevates_quota_plan(self):

        """FINDING-020: Active subscription in payment service immediately elevates quota plan."""

        from services.payment_service import _user_subscriptions

        from services.quota_service import get_user_plan_id

        paid_user_id = "user-active-paid-sync-101"

        _user_subscriptions[paid_user_id] = {

            "user_id": paid_user_id,

            "plan_id": "pro",

            "status": "active"

        }

        user_payload = {"sub": paid_user_id, "app_metadata": {"plan_id": "free"}}

        # Server detects active payment record and resolves to 'pro'

        resolved_plan = get_user_plan_id(user_payload)

        self.assertEqual(resolved_plan, "pro")



    def test_30_csp_headers_contain_razorpay(self):

        """FINDING-022: CSP configuration in vercel.json & netlify.toml whitelists Razorpay domains."""

        # Check vercel.json

        with open("vercel.json", "r", encoding="utf-8") as f:

            v_content = f.read()

        self.assertIn("https://checkout.razorpay.com", v_content)

        self.assertIn("https://api.razorpay.com", v_content)

        self.assertIn("frame-src 'self' https://api.razorpay.com", v_content)



        # Check netlify.toml

        with open("netlify.toml", "r", encoding="utf-8") as f:

            n_content = f.read()

        self.assertIn("https://checkout.razorpay.com", n_content)

        self.assertIn("https://api.razorpay.com", n_content)

        self.assertIn("frame-src 'self' https://api.razorpay.com", n_content)





if __name__ == "__main__":

    unittest.main(verbosity=2)



