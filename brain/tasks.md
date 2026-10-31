# CareerOS Security Remediation & Hardening Task Ledger

**Last Updated:** 2026-10-31  
**Target Branch:** `voice`  
**Master Checkpoint:** `checkpoint/critical-security-and-razorpay`

---

## 1. Task Ledger & Execution Status

### Phase 1: Authentication & Critical Data Protection
- [x] **TASK-01 [FINDING-001]**: Implement dual ES256 JWKS and HS256 secret verification in `backend/routers/admin.py`, failing closed if credentials are absent. (Verified: 23/23 tests pass).
- [x] **TASK-02 [FINDING-002]**: Restrict CORS origins in `backend/main.py` to verified production and local domains; remove permissive regexes. (Verified: 7/7 origin tests pass).
- [x] **TASK-03 [FINDING-011]**: Fix FastAPI `Depends` injection issue in `backend/routers/resume_analyzer.py` (`POST /api/ai/analyze-resume-upload`). (Verified: HTTP 200 on multipart upload).
- [x] **TASK-04 [FINDING-012]**: Remove public `SELECT` on `public.institutions` to protect `invite_code` and TPO contact info; create sanitized view `institutions_public_directory`. (Migration: `20261031_harden_institutions_rls.sql`).
- [x] **TASK-05 [FINDING-013]**: Enforce multi-tenant BOLA isolation in `backend/routers/campus.py`; remove `auth_token` query parameter. (Verified: HTTP 403 on cross-college access, HTTP 404 on cross-college student drilldown).
- [x] **TASK-06 [FINDING-014]**: Ensure campus persistence raises HTTP 503 in production instead of silent in-memory fallback. (Verified).

### Phase 2: Database Integrity & Injection Defenses
- [x] **TASK-07 [FINDING-004]**: Harden PostgreSQL `SECURITY DEFINER` triggers (`handle_new_user`) with explicit `SET search_path = public, auth, pg_temp;`. (Migration: `20261031_harden_security_definer_and_roles.sql`).
- [x] **TASK-08 [FINDING-007]**: Sanitize untrusted user input using `prompt_sanitizer.py` across `bullet_enhancer.py`, `job_matcher.py`, and `cover_letter.py`. (Verified: Breakout tags neutralised).
- [x] **TASK-09 [FINDING-010]**: Standardize role-based authorization for administrative access; decouple from static personal email in SQL. (Verified).

### Phase 3: Resource Protection, Network & Transport
- [x] **TASK-10 [FINDING-006]**: Enforce binary magic number check (`%PDF`) and 10-page ceiling on resume uploads in `resume_analyzer.py`. (Verified).
- [x] **TASK-11 [FINDING-008]**: Secure client IP extraction in rate limiting middleware (`TRUST_PROXY_HEADERS=false` default). (Verified).
- [x] **TASK-12 [FINDING-009]**: Add CSP, X-Frame-Options, and security headers to `netlify.toml` and `frontend/vercel.json`. (Verified).
- [x] **TASK-13 [FINDING-016]**: Enforce strict RFC 7519 JWT claims (`iss`, `aud`, `sub`, `nbf`) on both ES256 and HS256 paths. (Verified: Tests 12-14 in critical suite).

### Phase 4: Business Logic & Commercial Quotas
- [x] **TASK-14 [FINDING-003 / 015]**: Authoritative subscription tier definition: Free (₹0, 2 scans/mo, 1 interview/mo), Pro (₹149/mo, 25 scans, 10 interviews), Ultimate (₹249/mo, 75 scans, 30 interviews). (Verified: `quota_service.py`).
- [x] **TASK-15 [FINDING-003 / 015]**: Switch quota resets to UTC monthly boundaries (`YYYY-MM`). (Verified).
- [x] **TASK-16 [FINDING-003 / 015]**: Ignore client-controlled `user_metadata.plan_id`; enforce server-managed `app_metadata`. (Verified: Test 7 in critical suite).
- [x] **TASK-17 [FINDING-003 / 015]**: Inject quotas into voice interviews (`interview_evaluator.py`), simulations (`simulation.py`), and copilot (`career_copilot.py`). (Verified).

### Phase 5: Razorpay Payment Gateway Integration
- [x] **TASK-18 [FINDING-017]**: Prepare database migration for billing ledger (`payment_orders`, `payment_transactions`, `subscriptions`, `webhook_events`) with strict RLS. (Migration: `20261031_payment_system.sql`).
- [x] **TASK-19 [FINDING-017]**: Implement server-authoritative price lookup in `backend/services/payment_service.py` (₹149 / ₹249 in INR paise). (Verified: Test 15).
- [x] **TASK-20 [FINDING-017]**: Implement order creation idempotency via client `idempotency_key`. (Verified: Test 16).
- [x] **TASK-21 [FINDING-017]**: Implement constant-time cryptographic HMAC-SHA256 signature verification. (Verified: Tests 17-18).
- [x] **TASK-22 [FINDING-017]**: Implement webhook processing with raw byte validation and event deduplication. (Verified: Tests 21-22).
- [x] **TASK-23 [FINDING-017]**: Build frontend payment integration with double-click disabling and state synchronization (`paymentService.js`, `CheckoutModal.jsx`, `SubscriptionContext.jsx`). (Verified).

---

## 2. Verification Summary
- `test_critical_remediations_and_payments.py`: 22/22 PASSED
- `test_phase1_security.py`: 23/23 PASSED
- `test_all_security_phases.py`: 11/11 PASSED
- `test_skills_matching.py`: PASSED
- `test_job_filtering.py`: PASSED
- **Total Automated Security Tests:** 56/56 PASSED (100% pass rate).

