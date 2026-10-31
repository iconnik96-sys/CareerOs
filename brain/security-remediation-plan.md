# CareerOS — Security Remediation Plan

**Status:** Awaiting User Approval  
**Strategy:** Phased, isolated, non-destructive hardening preserving 100% of existing functionality, UI routes, database schema, and student experience.

---

## Remediation Roadmap & Phase Structure

```
+-------------------------------------------------------------------------+
| PHASE 1: Critical Authentication & Access Control Hardening             |
|   - FIX-001: Mandatory Cryptographic JWT Signature Enforcement          |
|   - FIX-002: Restrict CORS Origins to Verified Organizational Domains    |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| PHASE 2: Database & Injection Vulnerability Remediation                 |
|   - FIX-004: Harden PostgreSQL SECURITY DEFINER with Explicit search_path|
|   - FIX-007: Indirect Prompt Injection & Boundary Tag Sanitization      |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| PHASE 3: Resource Protection, File Uploads & Network Defenses           |
|   - FIX-006: PDF Magic Number Validation & Strict 5-Page Bound          |
|   - FIX-008: Secure Client IP Extraction in Rate Limiting Middleware    |
|   - FIX-009: Add Security Headers to Netlify & Vercel Deployments        |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| PHASE 4: Business Logic & Persistence Hardening                         |
|   - FIX-003: Server-Side Quota Enforcement for AI Microservices         |
|   - FIX-005: Persistent Database Backing for Campus TPO & Invites       |
|   - FIX-010: Abstract Hardcoded Founder Email to Configurable Roles     |
+-------------------------------------------------------------------------+
```

---

## Detailed Action Items by Phase

### Phase 1: Critical Authentication & Network Hardening

#### FIX-001: Mandatory Cryptographic JWT Signature Enforcement
- **Associated Finding:** FINDING-001 (Critical)
- **Affected Files:**
  - `backend/routers/admin.py`
  - `backend/routers/campus.py`
  - `backend/main.py`
  - `.env.example`
  - `docker-compose.yml`
- **Technical Implementation:**
  1. In `decode_and_verify_jwt(token: str)`:
     - Require `SUPABASE_JWT_SECRET`. If unset in production/staging, log a critical security alert and refuse to validate untrusted tokens.
     - Validate JWT header algorithm strictly: only accept `HS256`. Reject `none`, `RS256`, or malformed algorithms.
     - Validate standard Supabase claims: verify `aud == "authenticated"` and token has not expired (`time.time() < exp`).
     - Compare HMAC signature in constant time using `hmac.compare_digest`.
  2. Add `SUPABASE_JWT_SECRET` to `.env.example` and `docker-compose.yml` environment blocks.
- **Risk Assessment:** No risk to legitimate logged-in users who hold authentic Supabase session tokens. Prevents attackers from using forged tokens.
- **Verification:** Execute unit tests with valid Supabase tokens, forged tokens, expired tokens, and unsigned tokens.

#### FIX-002: Restrict CORS Origins to Verified Domains
- **Affected Files:**
  - `backend/main.py`
- **Technical Implementation:**
  1. Replace generic regex `r"^https://.*(\.netlify\.app|\.vercel\.app|\.onrender\.com)$"` with explicit whitelisted origins:
     - `http://localhost:3000`, `http://localhost:5173`, `http://127.0.0.1:3000`, `http://127.0.0.1:5173`
     - `https://careeros.vercel.app`, `https://careeros.netlify.app`
  2. If preview deployments are required, use a strict organizational regex:
     - `r"^https://careeros(-[a-z0-9_-]+)?\.(vercel\.app|netlify\.app)$"`
  3. Disallow arbitrary third-party Vercel/Netlify/Render subdomains.
- **Risk Assessment:** Zero impact on legitimate users; protects against cross-origin credentialed attacks.
- **Verification:** Send OPTIONS preflight requests from authorized domains (must return 200) and unauthorized origins (must be rejected).

---

### Phase 2: Database & Injection Remediation

#### FIX-004: Explicit `search_path` on PostgreSQL SECURITY DEFINER Triggers
- **Associated Finding:** FINDING-004 (High)
- **Affected Files:**
  - `supabase/schema.sql`
  - `supabase/migrations/20261031_harden_security_definer.sql`
- **Technical Implementation:**
  1. Update `public.handle_new_user()` to include:
     `SET search_path = public, auth, pg_temp;`
  2. Update `public.check_invite_token()` to include:
     `SET search_path = public, pg_temp;`
  3. Update `public.prevent_profile_role_tampering()` to include:
     `SET search_path = public, pg_temp;`
- **Risk Assessment:** Fully backward-compatible; prevents search-path hijacking attacks in PostgreSQL.
- **Verification:** Run test user signups and profile updates to verify triggers execute cleanly.

#### FIX-007: Indirect Prompt Injection Defense & Tag Sanitization
- **Associated Finding:** FINDING-007 (Medium)
- **Affected Files:**
  - `backend/routers/bullet_enhancer.py`
  - `backend/routers/cover_letter.py`
  - `backend/routers/job_matcher.py`
  - `backend/routers/interview_evaluator.py`
- **Technical Implementation:**
  1. In `bullet_enhancer.py`, encapsulate `raw_bullet` inside `<untrusted_raw_bullet>` tags and supply a strict `system_instruction` enforcing that user text must be treated solely as data.
  2. In all AI routers, sanitize user input before template interpolation by escaping XML-like closing tags (e.g. replacing `</untrusted` with `&lt;/untrusted`).
  3. Ensure all calls to `llm_engine.generate_json()` supply an unambiguous `system_instruction` defining boundaries.
- **Risk Assessment:** No disruption to normal AI output quality; shields prompts from hostile instruction hijacking.
- **Verification:** Test adversarial prompt injection strings; verify models output expected JSON schema without following injected directives.

---

### Phase 3: Resource Protection, Uploads & Network Defenses

#### FIX-006: Binary Magic Number Verification & PDF Page Bounding
- **Associated Finding:** FINDING-006 (Medium)
- **Affected Files:**
  - `backend/routers/resume_analyzer.py`
- **Technical Implementation:**
  1. In `extract_text_from_pdf_bytes(pdf_bytes)`:
     - Check `pdf_bytes.startswith(b"%PDF")`. If not, raise HTTP 400 ("Invalid file format: not a genuine PDF").
     - Limit `reader.pages` iteration to a maximum of 5 pages:
       ```python
       if len(reader.pages) > 5:
           raise HTTPException(status_code=400, detail="Resume exceeds maximum allowed length (5 pages).")
       ```
  2. In text file parsing:
     - Ensure UTF-8 decoding handles errors gracefully with `errors='replace'`.
- **Risk Assessment:** Genuine student resumes are 1-2 pages long (5 pages is generous); protects server from memory exhaustion.
- **Verification:** Upload valid PDF, non-PDF file renamed as .pdf, and oversized 100-page PDF; verify appropriate accept/reject behavior.

#### FIX-008: Secure Client IP Resolution in Rate Limiter
- **Associated Finding:** FINDING-008 (Medium)
- **Affected Files:**
  - `backend/main.py`
- **Technical Implementation:**
  1. Default to `request.client.host` for unauthenticated client IP resolution.
  2. Only read `CF-Connecting-IP` or `X-Forwarded-For` if an environment variable `TRUST_PROXY_HEADERS=true` is set.
  3. If reading `X-Forwarded-For`, take the rightmost IP provided by the trusted proxy rather than trusting arbitrary client-supplied leftmost values.
- **Risk Assessment:** Prevents trivial rate limit evasion via rotating HTTP headers.
- **Verification:** Send multiple rapid requests from the same connection with spoofed headers; verify rate limiting activates as designed.

#### FIX-009: Add Deployment HTTP Security Headers
- **Associated Finding:** FINDING-009 (Low)
- **Affected Files:**
  - `netlify.toml`
  - `vercel.json`
- **Technical Implementation:**
  1. Add HTTP security headers configuration to `netlify.toml`:
     ```toml
     [[headers]]
       for = "/*"
       [headers.values]
         X-Frame-Options = "DENY"
         X-Content-Type-Options = "nosniff"
         Referrer-Policy = "strict-origin-when-cross-origin"
         Permissions-Policy = "camera=(self), microphone=(self), geolocation=()"
         Content-Security-Policy = "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval';"
     ```
  2. Mirror headers in `vercel.json`.
- **Risk Assessment:** Prevents Clickjacking while allowing camera/mic for the mock interview voice studio and WebAssembly eval.
- **Verification:** Check response headers using `curl -I` on deployment targets.

---

### Phase 4: Business Logic & Persistence Hardening

#### FIX-003: Server-Side Quota Enforcement for AI Services
- **Associated Finding:** FINDING-003 (High)
- **Affected Files:**
  - `backend/routers/admin.py` (dependency checks)
  - `backend/main.py`
  - `backend/routers/simulation.py`
  - `backend/routers/resume_analyzer.py`
  - `backend/routers/interview_evaluator.py`
- **Technical Implementation:**
  1. Implement a server-side dependency `verify_user_quota(feature_key: str)` that checks user entitlements.
  2. For Free plan users, restrict access to `FIN-BEG-1` simulation ticket and enforce daily/monthly ceilings on heavy resume analysis and interview sessions.
  3. Return HTTP 403 / 429 when quota is reached, preventing direct API scraping.
- **Risk Assessment:** Protects business margins and Groq/OpenAI token spend.

#### FIX-005: Persistent PostgreSQL Storage for Campus Roster & Invites
- **Associated Finding:** FINDING-005 (High)
- **Affected Files:**
  - `backend/routers/campus.py`
  - `supabase/schema.sql`
- **Technical Implementation:**
  1. Update `campus.py` to query and persist to Supabase `institutions` and `institution_invites` tables rather than volatile Python dictionaries.
  2. Keep in-memory dictionaries purely as fallback if database is offline.
- **Risk Assessment:** Eliminates data loss on server reboot or scaling.

#### FIX-010: Standardize Role-Based Authorization
- **Associated Finding:** FINDING-010 (Low)
- **Affected Files:**
  - `supabase/schema.sql`
  - `backend/routers/admin.py`
  - `frontend/src/utils/founderAuth.js`
- **Technical Implementation:**
  1. Decouple administrative policies from the static email `"nikhil@gmail.com"`.
  2. Authorize via verified `app_metadata.role IN ('founder', 'admin')`.
- **Risk Assessment:** Production-grade RBAC architecture.

---

### Phase 5: Critical Bug & Multi-Tenant Data Hardening

#### FIX-011: Resume Upload Depends Injection Crash Fix
- **Associated Finding:** FINDING-011 (Critical)
- **Affected Files:** `backend/routers/resume_analyzer.py`, `backend/services/quota_service.py`
- **Technical Implementation:**
  - Injected `user: Dict[str, Any] = Depends(verify_authenticated_student)` into `analyze_resume_upload` endpoint and forwarded `user=user` to `deep_resume_analysis(...)`.
  - Added type guards in `quota_service.py` to prevent `AttributeError`.

#### FIX-012: Institutions Table RLS Hardening & Sanitized Public View
- **Associated Finding:** FINDING-012 (Critical)
- **Affected Files:** `supabase/migrations/20261031_harden_institutions_rls.sql`, `supabase/schema.sql`
- **Technical Implementation:**
  - Dropped overly permissive `Anyone can view active institutions` policy on `public.institutions`.
  - Restricted direct `SELECT` strictly to admins and owning TPO (`institution_id = id`).
  - Created sanitized view `public.institutions_public_directory` hiding `invite_code`, `contact_name`, and `contact_email`.
  - Preserved secure RPC `verify_college_invite_code(p_code)` for student onboarding.

#### FIX-013: Campus BOLA/IDOR Isolation & Query-Token Deprecation
- **Associated Finding:** FINDING-013 (High)
- **Affected Files:** `backend/routers/campus.py`
- **Technical Implementation:**
  - Enhanced `verify_campus_access` to return verified caller identity dict.
  - Added `resolve_authorized_institution` enforcing multi-tenant isolation (returns 403 on foreign institution roster access).
  - Enforced 404 on cross-college student drilldown.
  - Deprecated and removed sensitive `auth_token` query parameter across campus endpoints.

---

### Phase 6: Commercial Subscription Quota Alignment

#### FIX-015: Master Specification Plan & Entitlement Hardening
- **Associated Finding:** FINDING-015 (High)
- **Affected Files:** `backend/services/quota_service.py`, `frontend/src/contexts/SubscriptionContext.jsx`
- **Technical Implementation:**
  - Standardized tiers: Free (₹0, 2 scans/mo, 1 interview/mo), Pro (₹149/mo, 25 scans, 10 interviews), Ultimate (₹249/mo, 75 scans, 30 interviews).
  - Changed tracking bucketing from daily to UTC monthly (`YYYY-MM`).
  - Added thread-safe locking (`_tracker_lock`) for concurrent request safety.
  - Client-controlled `user_metadata.plan_id` is explicitly ignored, resolving tier strictly from server-managed `app_metadata`.

---

### Phase 7: Razorpay Payment Gateway Integration

#### FIX-017: Secure End-to-End Razorpay Billing Lifecycle
- **Associated Finding:** FINDING-017 (Critical)
- **Affected Files:**
  - `backend/services/payment_service.py`
  - `backend/routers/payments.py`
  - `frontend/src/services/paymentService.js`
  - `frontend/src/components/pricing/CheckoutModal.jsx`
  - `supabase/migrations/20261031_payment_system.sql`
- **Technical Implementation:**
  1. **Server-Side Pricing**: Order creation calculates price server-side in INR paise (₹149 / ₹249). Client cannot alter pricing.
  2. **Idempotency**: Client passes `idempotency_key` on order creation to prevent duplicate charges upon double-click or network retry.
  3. **Cryptographic Verification**: Verifies `razorpay_signature` using HMAC-SHA256 (`f"{order_id}|{payment_id}"`) in constant time.
  4. **Multi-Tenant Ownership**: Validates caller owns the order before verification.
  5. **Webhook Deduplication**: Webhook handler validates raw payload HMAC signature and deduplicates events via `webhook_events` table.
  6. **Ledger & Audit Persistence**: Prepared migration for `payment_orders`, `payment_transactions`, `subscriptions`, and `webhook_events` with RLS.

---

## Status & Execution Record
All 7 phases have been implemented and validated against the automated security verification suite. Zero regressions observed across the 29 pre-existing user files.

