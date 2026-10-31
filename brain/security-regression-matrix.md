# CareerOS Security Regression Matrix

**Version:** 3.0.0  
**Target Branch:** `voice`  
**Test Harness:** Python `unittest` & FastAPI `TestClient`

---

## 1. Regression Test Suite Mapping

| Test Suite File | Test Count | Target Capabilities | Status |
|---|:---:|---|:---:|
| `backend/test_critical_remediations_and_payments.py` | 22 | Resume upload, BOLA/IDOR, Quotas, Payment orders, Verification, Webhooks | **22/22 PASS** |
| `backend/test_phase1_security.py` | 23 | ES256 JWKS, HS256 JWT, Claims, CORS whitelist, Protected routes | **23/23 PASS** |
| `backend/test_all_security_phases.py` | 11 | Comprehensive security phases, rate limits, headers, PDF magic bytes | **11/11 PASS** |
| `backend/test_skills_matching.py` | 2 | Job skills matching precision & array/string database compatibility | **PASS** |
| `backend/test_job_filtering.py` | 3 | Career track isolation & role filtering | **PASS** |

---

## 2. Feature Regression Verification

| Feature | Endpoint / Route | Security Rule Applied | Feature Preserved? | Evidence |
|---|---|---|:---:|---|
| **ATS Resume Upload** | `POST /api/ai/analyze-resume-upload` | Auth verified, PDF magic bytes checked | **YES** | Real PDF upload returns HTTP 200 with ATS score |
| **Deep Resume Analysis** | `POST /api/ai/deep-resume-analysis` | Quota enforced (2 free / 25 pro / 75 ultimate) | **YES** | Quota decrements properly; blocked when exhausted |
| **Voice Mock Interview** | `POST /api/ai/evaluate-interview-answer` | Voice interview quota checked | **YES** | Evaluation returns scores, rubrics, STAR analysis |
| **Campus Overview** | `GET /api/campus/overview` | Tenant isolation verified | **YES** | Own institution returns stats; foreign inst blocked |
| **Student Roster** | `GET /api/campus/students` | Multi-tenant filtering | **YES** | Filters work (CGPA, branch, readiness); cross-college blocked |
| **CSV Export** | `GET /api/campus/export-csv` | Tenant boundary enforced | **YES** | Downloads clean CSV; foreign inst blocked |
| **Pricing & Checkout** | `POST /api/payments/create-order` | Server pricing & idempotency | **YES** | Correct price returned, duplicate charge prevented |
| **Payment Verification**| `POST /api/payments/verify-payment` | HMAC-SHA256 signature verification | **YES** | Valid signature activates plan; forged signature rejected |
| **Webhooks** | `POST /api/payments/webhook` | Raw byte signature & deduplication | **YES** | Webhooks acknowledged, duplicate replay ignored |

