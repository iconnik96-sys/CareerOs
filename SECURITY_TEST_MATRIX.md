# CAREEROS — SECURITY TEST & VERIFICATION MATRIX

**Assessment Date:** October 24, 2026  
**Auditor:** Principal Penetration Tester & Application Security Specialist  
**Standard:** OWASP Top 10 (2021), OWASP API Security Top 10 (2023), OWASP LLM Top 10 (2025)  

---

## 1. Test Verification Matrix

| Test ID | Category | Target Component | Preconditions | Verification Method | Expected Safe Result | Observed Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TEST-AUTH-01** | Privilege Escalation | `backend/routers/admin.py` | Authenticated Supabase user with arbitrary `user_metadata: {"role": "admin"}` | Send GET request to `/api/admin/metrics` with user bearer token | HTTP 403 Forbidden | HTTP 200 OK — Admin metrics returned due to `user_metadata` fallback | **FAIL (Vulnerable)** |
| **TEST-AUTH-02** | RLS Bypass / Role Tampering | `supabase/schema.sql:L316-329` | Newly registered Supabase user with valid JWT | Issue `POST /rest/v1/profiles` inserting `{"user_id": uid, "role": "admin"}` | HTTP 403 / Postgres exception | PostgreSQL accepts row; trigger only protects `UPDATE`, not `INSERT` | **FAIL (Vulnerable)** |
| **TEST-LEAK-01** | Information Disclosure | `public.institutions` RLS | Unauthenticated anonymous visitor | Query `GET /rest/v1/institutions?select=*` via Supabase Anon Key | Restricted fields or 403 Forbidden | HTTP 200 OK — Dumps all college `invite_code`, `contact_email`, and `contact_phone` | **FAIL (Vulnerable)** |
| **TEST-BOLA-01** | Multi-Tenant Isolation / BOLA | `backend/routers/campus.py:L744` | User authenticated with valid TPO token for College A | Request `GET /api/campus/students?institution_id=<College_B>` | HTTP 403 Forbidden / Not Authorized for College B | HTTP 200 OK — Returns College B student roster | **FAIL (Vulnerable)** |
| **TEST-BOLA-02** | Cross-Tenant Data Dump | `backend/routers/campus.py:L896` | Authenticated TPO user | Request `GET /api/campus/export-csv?institution_id=non_existent_id` | Empty CSV with headers only | Full CSV dump of all students across all colleges via `STUDENTS_DB` fallback | **FAIL (Vulnerable)** |
| **TEST-LLM-01** | Prompt Injection (Evaluation) | `backend/routers/interview_evaluator.py:L301` | Any caller to `/api/ai/grade-interview` | Submit `candidate_answer` containing override instructions and custom score JSON | Model evaluates text objectively and ignores injected prompt instructions | Model returns injected score (100/100) and forged feedback | **FAIL (Vulnerable)** |
| **TEST-LLM-02** | Prompt Injection (PR Review) | `backend/routers/simulation.py:L776` | Any caller to `/api/ai/simulation/review-pr` | Submit `code_content` containing ` ```` ` breaking out of markdown | Reviewer verifies code logic regardless of comments | Markdown breakout overrides reviewer prompt to force `status: APPROVED` | **FAIL (Vulnerable)** |
| **TEST-DOS-01** | Client CPU Starvation | `frontend/src/utils/pyodideWorker.js` | Web browser running simulation execution | Submit Python script: `while True: pass` | Worker times out and terminates after 5000ms | Browser Web Worker hangs at 100% CPU indefinitely until tab killed | **FAIL (Vulnerable)** |
| **TEST-XSS-01** | DOM XSS via PDF Generation | `frontend/src/utils/interviewPdfExport.js:L594` | Completed interview with HTML payload in feedback | Click "Export Interview Report PDF" | HTML tags safely escaped or sanitized | Unsanitized HTML strings injected into DOM `mountContainer.innerHTML` | **FAIL (Vulnerable)** |
| **TEST-RATE-01** | Rate Limit Multi-Instance Dilution | `backend/main.py:L104-151` | 2 horizontal FastAPI backend replicas | Fire 100 requests split across replica instances | Requests throttled at aggregate 60 req/min limit | Each instance tracks in-memory counters separately; rate limit is doubled/diluted | **FAIL (Architectural)** |
| **TEST-HEAD-01** | HTTP Security Headers | `backend/main.py:L88-97` | Client HTTP GET request | Inspect HTTP response headers on `/api/health` | HSTS, CSP, X-Frame-Options, X-Content-Type-Options present | All headers verified present and strictly formatted | **PASS (Secure)** |
| **TEST-CORS-01** | CORS Origin Validation | `backend/main.py:L56-84` | Origin: `https://evil-attacker.com` | Send OPTIONS / Preflight request to `/api/health` | Request rejected or Access-Control-Allow-Origin not reflected | Disallowed origin rejected; regex only allows official production domains | **PASS (Secure)** |

---

## 2. Test Execution Summary

```
Total Test Cases: 12
- PASS: 2 (16.7%)
- FAIL: 10 (83.3%)
  - Critical Severity: 3
  - High Severity: 4
  - Medium Severity: 3
```
