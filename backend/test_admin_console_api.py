import os
import sys
import unittest
import time
import json
import base64
import hmac
import hashlib

sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from main import app
from routers.admin import FOUNDER_EMAIL, ADMIN_API_KEY, SUPABASE_JWT_SECRET

TEST_JWT_SECRET = "careeros-super-secure-test-jwt-secret-key-32chars"

def make_test_jwt(email=FOUNDER_EMAIL, role="founder", secret=TEST_JWT_SECRET):
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode("utf-8")).decode("utf-8").rstrip("=")
    payload = {
        "sub": "admin-user-uuid-1234",
        "email": email,
        "aud": "authenticated",
        "app_metadata": {"role": role},
        "exp": int(time.time()) + 3600
    }
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8").rstrip("=")
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    sig = base64.urlsafe_b64encode(
        hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    ).decode("utf-8").rstrip("=")
    return f"{header_b64}.{payload_b64}.{sig}"


class TestAdminConsoleAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.environ["SUPABASE_JWT_SECRET"] = TEST_JWT_SECRET
        os.environ["ADMIN_API_KEY"] = "super-secret-admin-key-2026"
        cls.client = TestClient(app)
        cls.founder_token = make_test_jwt()
        cls.student_token = make_test_jwt(email="student@random.com", role="student")

    def test_01_founder_auth_me_positive_and_negative(self):
        # 1. Unauthenticated -> 403
        res = self.client.get("/api/admin/auth/me")
        self.assertEqual(res.status_code, 403)

        # 2. Student token -> 403
        res = self.client.get("/api/admin/auth/me", headers={"Authorization": f"Bearer {self.student_token}"})
        self.assertEqual(res.status_code, 403)

        # 3. Founder token -> 200
        res = self.client.get("/api/admin/auth/me", headers={"Authorization": f"Bearer {self.founder_token}"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["authenticated"])
        self.assertEqual(data["role"], "founder")

        # 4. Admin API key -> 200
        res = self.client.get("/api/admin/auth/me", headers={"X-Admin-Key": "super-secret-admin-key-2026"})
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["authenticated"])

    def test_02_users_api(self):
        res = self.client.get("/api/admin/users", headers={"Authorization": f"Bearer {self.founder_token}"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("users", data)
        self.assertIn("total_users", data)

    def test_03_ai_analytics_api(self):
        res = self.client.get("/api/admin/ai/analytics?days=7", headers={"Authorization": f"Bearer {self.founder_token}"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("kpis", data)
        self.assertIn("daily_trends", data)

    def test_04_payments_overview_api(self):
        res = self.client.get("/api/admin/payments/overview", headers={"Authorization": f"Bearer {self.founder_token}"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("financial_summary", data)

    def test_05_quotas_overview_api(self):
        res = self.client.get("/api/admin/quotas/overview", headers={"Authorization": f"Bearer {self.founder_token}"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("plan_quotas_catalog", data)

    def test_06_system_health_api(self):
        res = self.client.get("/api/admin/system/health", headers={"Authorization": f"Bearer {self.founder_token}"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("backend", data)
        self.assertIn("database", data)
        self.assertIn("ai_engine", data)

    def test_07_audit_logs_api(self):
        res = self.client.get("/api/admin/audit-logs", headers={"Authorization": f"Bearer {self.founder_token}"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertGreaterEqual(data["total_events"], 1)

    def test_08_settings_api(self):
        res = self.client.get("/api/admin/settings", headers={"Authorization": f"Bearer {self.founder_token}"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("ai_configuration", data)
        self.assertIn("subscription_plans", data)


if __name__ == "__main__":
    unittest.main()

