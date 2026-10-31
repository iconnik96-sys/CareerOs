# CareerOS — Final Production Deployment Blocker Report

**Date:** 2026-10-31  
**Audit Standard:** Strict Read-Only Independent Production Blocker Verification  
**Branch:** `voice`  
**Base Commit Checkpoint:** `cd530942cc1f17320e51b371850d6bf32e2685b2`  
**Auditor:** Principal Application Security Engineer & DevSecOps Lead  

---

## EXECUTIVE DECISION

# ❌ CONCLUSION: B. NOT SAFE TO DEPLOY — SPECIFIC BLOCKERS REMAIN

While all application code-level security unit tests pass (64/64 tests passing locally), an unsparing architectural review of the runtime environment, data persistence layer, reverse proxy mechanics, and database migrations reveals **critical distributed production blockers** that prevent immediate production release.

Deploying in the current state to a multi-worker or containerized platform (such as Render or Fly.io) will lead to **ephemeral payment state loss, quota state desynchronization across worker processes, spoofable or colliding IP rate-limiting, and dormant database tables**.

---

## 1. DETAILED ITEM-BY-ITEM VERIFICATION

---

### ITEM 1: Authoritative Quota & Payment Persistence Architecture
- **Files Inspected:**
  - `backend/services/quota_service.py` (lines 115–173, 310–338)
  - `backend/services/payment_service.py` (lines 56–99, 147–212, 236–309, 332–363)
  - `backend/routers/payments.py` (lines 46–146)
  - `backend/services/.quota_cache.json`
  - `backend/services/.payment_cache.json`
  - `supabase/migrations/20261031_payment_system.sql`
- **Classification:** **UNRESOLVED / BLOCKED FOR DISTRIBUTED PRODUCTION**

#### Explicit Answers to Verification Questions:
1. **Which storage system is the actual source of truth?**  
   The actual source of truth at runtime is **in-memory Python dictionaries** backed by **local disk JSON files** (`.quota_cache.json` and `.payment_cache.json`).
2. **Does quota consumption write to Supabase/PostgreSQL or local JSON files?**  
   It writes **strictly to the local JSON file** (`PERSIST_QUOTA_FILE`). There is zero database code, no Supabase client call, and no SQL query executed anywhere in `quota_service.py`.
3. **Does payment verification write to the database or local JSON files?**  
   It writes **strictly to local memory and `.payment_cache.json`**.
4. **Are the database payment tables actually used by the application?**  
   **NO.** The tables defined in `20261031_payment_system.sql` (`public.payment_orders`, `public.payment_transactions`, `public.subscriptions`, `public.webhook_events`) are **completely dormant and unused by the backend Python application code**.
5. **Can multiple workers safely consume quota concurrently?**  
   **NO.** While `threading.Lock()` guards concurrent threads within a *single* Python process, running Uvicorn/Gunicorn with multiple workers (e.g. `uvicorn main:app --workers 4`) creates isolated process memory spaces. Concurrent file writes using `os.replace` overwrite each other's entire snapshot, causing lost usage counts and race conditions.
6. **Can multiple Render instances safely update payment state?**  
   **NO.** Render instances run on independent, non-shared ephemeral filesystems. If scaled to $\ge 2$ instances, an order created on Instance A will not exist on Instance B. If the user's browser sends `verify-payment` to Instance B, it fails with HTTP 400 (`Associated order record not found`). Webhooks arriving at Instance B will not activate entitlements on Instance A.
7. **Can process termination cause lost or inconsistent state?**  
   **YES.** On cloud platforms like Render or Fly.io, container restarts, redeployments, or node rescheduling destroy the ephemeral disk layer. Unless backed by a dedicated persistent volume mount, all subscriptions and quota usage reset to the initial state upon redeployment.
8. **Can a payment be captured without the subscription entitlement being activated?**  
   **YES.** If Razorpay captures a payment and the user closes their browser before `verify-payment` returns, or if the webhook delivers to a restarting/desynchronized container, or if `_save_payment_cache` fails, the customer's credit card is charged, but no durable database record exists.
9. **Can duplicate webhooks or concurrent checkout requests create duplicate entitlements?**  
   Within a single process, `_processed_webhook_events` prevents duplicates. Across multiple workers or instances, however, duplicate webhook deliveries can be processed simultaneously because the deduplication set is not backed by a PostgreSQL unique constraint at runtime.
10. **Is there a safe reconciliation mechanism?**  
    **NO.** `list_payment_records` only dumps the local in-memory slice of that specific container. There is no automated worker polling Razorpay's API (`/v1/payments`) or reconciling against a durable database ledger.

- **Required Action to Unblock:**  
  Refactor `payment_service.py` and `quota_service.py` to perform reads and writes against the Supabase PostgreSQL database tables (`public.subscriptions`, `public.payment_orders`, `public.payment_transactions`) using the Supabase Service Role client with transactional integrity or row-level locking.

---

### ITEM 2: Render Reverse Proxy Trust & Rate Limiting (`TRUST_PROXY_HEADERS`)
- **Files Inspected:**
  - `backend/main.py` (lines 240–265)
  - `backend/.env.example`
- **Classification:** **BLOCKED**

#### Analysis:
1. **Which headers are trusted?**  
   When `TRUST_PROXY_HEADERS=true`:
   - `cf-connecting-ip` is evaluated first.
   - `x-forwarded-for` is evaluated second (taking `split(",")[-1]`).
   When `TRUST_PROXY_HEADERS=false`: Direct socket connection `request.client.host` is used.
2. **How client IP is extracted:**  
   If unauthenticated, extracts `cf-connecting-ip` or rightmost IP in `X-Forwarded-For`.
3. **Rightmost vs. Leftmost Address:**  
   - Taking the **rightmost** address (`split(",")[-1]`) assumes a single reverse proxy that strictly appends the client socket IP to the header.
   - However, if the site is deployed behind Cloudflare $\rightarrow$ Render $\rightarrow$ Container, Render's nearest connecting client is Cloudflare. The rightmost IP will be **Cloudflare's egress proxy IP**, causing all users worldwide routed through that Cloudflare edge node to collide in the exact same rate-limiting bucket.
   - Furthermore, `cf-connecting-ip` is checked **without verifying that the request actually arrived from Cloudflare's IP ranges**. An attacker connecting directly to the Render URL can send `CF-Connecting-IP: <random_ip>` and completely bypass IP rate limiting!
4. **When `TRUST_PROXY_HEADERS=false`:**  
   On Render, direct socket connections to the container arrive from Render's internal load balancer (`10.x.x.x`). All unauthenticated visitors would share this single internal IP, leading to immediate false-positive rate limit blocks (HTTP 429) for legitimate users.
5. **Justification of Proxy Hop Count:**  
   No hop count or proxy subnet allowlist (`ip_network`) is configured. The deployment behavior on Render cannot be proven locally.

- **Required Action to Unblock:**  
  Leave `TRUST_PROXY_HEADERS=false` as default. For production on Render:
  a) If using Cloudflare, configure Cloudflare Authenticated Origin Pulls or validate client requests against Cloudflare's public IP list (`https://www.cloudflare.com/ips/`).
  b) Verify Render's exact edge header format via an isolated staging probe (`X-Render-Proxy-IP` or `X-Forwarded-For`).
  c) Authenticated requests already use `usr:{user_id}`, which is safe; unauthenticated requests should use cookie/session tokens in addition to IP.

---

### ITEM 3: Production SQL Migrations Verification
- **Files Inspected:**
  - `supabase/migrations/20261031_harden_institutions_rls.sql`
  - `supabase/migrations/20261031_harden_security_definer_and_roles.sql`
  - `supabase/migrations/20261031_campus_persistence.sql`
  - `supabase/migrations/20261031_payment_system.sql`
  - `supabase/schema.sql`
- **Classification:** **FIXED BUT NOT PRODUCTION VERIFIED (PENDING APPLICATION)**

#### Verification Matrix Across All Four Migrations:

| Migration File | Idempotent? | Schema Compatible? | RLS Strictness | SECURITY DEFINER Safety | Production Status |
|---|---|---|---|---|---|
| `20261031_harden_security_definer_and_roles.sql` | **YES** (`CREATE OR REPLACE`, `DROP POLICY IF EXISTS`) | **YES** | **High** (Restricts founder view to role check or dynamic config setting; fail-closed) | **VERIFIED SAFE** (`SET search_path = public, auth, pg_temp;` applied) | Ready to run in Supabase SQL Editor |
| `20261031_harden_institutions_rls.sql` | **YES** (`DROP POLICY IF EXISTS`, `CREATE OR REPLACE VIEW`) | **YES** | **High** (Removes public SELECT on institutions; creates sanitized public directory view) | **VERIFIED SAFE** (`verify_college_invite_code` has `search_path = public, pg_temp`) | Ready to run; verified frontend does not query sensitive columns |
| `20261031_campus_persistence.sql` | **YES** (`CREATE TABLE IF NOT EXISTS`) | **YES** | **High** (TPO restricted to own institution; Service role full access) | **N/A** (Tables and policies only) | Ready to run (must run before `harden_institutions_rls.sql`) |
| `20261031_payment_system.sql` | **YES** (`CREATE TABLE IF NOT EXISTS`) | **YES** | **High** (Users can only view own orders/subscriptions; service role manages) | **N/A** (Tables and policies only) | **DORMANT** (Tables will be created, but backend does not write to them yet) |

#### Execution Order Dependency:
1. `20261031_campus_persistence.sql`
2. `20261031_harden_institutions_rls.sql`
3. `20261031_harden_security_definer_and_roles.sql`
4. `20261031_payment_system.sql`

---

### ITEM 4: Real JWT & AI Security Verification
- **Files Inspected:**
  - `backend/routers/admin.py` (lines 50–185, 186–248)
  - `backend/services/prompt_sanitizer.py` (lines 1–24)
- **Classification:**
  - JWT Verification & Role Isolation: **VERIFIED SAFE**
  - Prompt Injection Defense: **FIXED BUT NOT PRODUCTION VERIFIED (PARTIAL MITIGATION ONLY)**

#### Evidence & Analysis:
1. **Supabase Asymmetric ES256 & Symmetric HS256 Validation:**
   - **Signature Verification:** Cryptographically enforced. ES256 validates public keys dynamically via PyJWKClient against Supabase's `.well-known/jwks.json`. HS256 uses constant-time HMAC comparison.
   - **Claims Enforcement:** Explicitly validates:
     - `iss`: Matches `{SUPABASE_URL}/auth/v1`.
     - `aud`: Strictly requires `"authenticated"` or `"anon"`.
     - `exp`: PyJWT expiration validation enforced.
     - `nbf`: Future not-before tokens explicitly rejected.
     - `sub`: Non-empty subject string required.
     - `alg`: Whitelist strictly enforced to `("HS256", "ES256")`. Disallowed algorithms (`none`, `RS256`, etc.) rejected.
     - Fail-Closed: Unset secrets or unreachable JWKS cleanly return `None` (HTTP 401/403).
2. **Role & Privilege Escalation via `user_metadata`:**
   - **VERIFIED SAFE.** All authorization checks in `admin.py`, `campus.py`, and `quota_service.py` inspect `app_metadata` only. Client-writable `user_metadata` is completely ignored.
3. **AI Prompt Injection Defense:**
   - `prompt_sanitizer.py` strips `<system>`, `<boundary>`, and markdown code fences, and wraps untrusted user data inside `<untrusted_candidate_text>` XML boundaries with explicit system instructions.
   - **Important Security Finding:** Regex tag stripping is **NOT a mathematically complete defense** against semantic prompt injection or jailbreaks. However, CareerOS LLMs operate strictly as text transformers/evaluators and **possess no execution tools, no database modification capabilities, and no autonomous agentic privileges**. Data access and quotas are checked by FastAPI dependencies *before* calling the LLM.

---

### ITEM 5: Working-Tree & Pre-Existing Codebase Preservation
- **Files Inspected:** `git status`, `git diff --name-status cd530942cc1f17320e51b371850d6bf32e2685b2`
- **Classification:** **VERIFIED SAFE**

#### Audit Results:
1. **Pre-Existing Uncommitted User Modifications (29 Files):**
   - All 29 original pre-existing files modified or deleted by the user before this security session remain **100% preserved**.
   - No user feature code, styling, UI layouts, or custom routes were reset, reverted, stashed, or overwritten.
2. **Antigravity Security Changes:**
   - Confined strictly to security enforcement files: authentication middleware, CORS origin whitelisting, quota checking dependencies, payment verification service, prompt sanitizer, and migration SQL scripts.
   - Frontend build (`npm run build`) succeeded with 0 errors (2,562 modules transformed).
   - Domain logic tests (`test_skills_matching.py` and `test_job_filtering.py`) passed at 100%.

---

## 2. PRODUCTION READINESS SCORECARD

| Verification Domain | Classification | Blocker Severity | Primary Remaining Action |
|---|---|---|---|
| **Authoritative Quota Persistence** | **UNRESOLVED** | **CRITICAL** | Connect `quota_service.py` to PostgreSQL / Redis instead of `.quota_cache.json` |
| **Authoritative Payment Persistence** | **UNRESOLVED** | **CRITICAL** | Connect `payment_service.py` to `public.subscriptions` table instead of `.payment_cache.json` |
| **Render Reverse Proxy Trust** | **BLOCKED** | **HIGH** | Verify Render edge hop count and Cloudflare origin validation before enabling `TRUST_PROXY_HEADERS` |
| **Supabase Database Migrations** | **FIXED (PENDING RUN)** | **MEDIUM** | Execute the 4 SQL scripts in Supabase Dashboard SQL Editor |
| **Supabase JWT Verification** | **VERIFIED SAFE** | **NONE** | No action required (Dual JWKS ES256 / HS256 fully verified) |
| **Privilege Escalation via Metadata** | **VERIFIED SAFE** | **NONE** | No action required (`user_metadata` ignored; `app_metadata` enforced) |
| **AI Tool Permissions & Boundaries** | **VERIFIED SAFE** | **NONE** | No action required (No autonomous tool access given to LLMs) |
| **Working Tree & Feature Integrity** | **VERIFIED SAFE** | **NONE** | All 29 pre-existing files preserved intact |

---

## 3. REMEDIATION ROADMAP TO UNBLOCK PRODUCTION

To transition CareerOS from **B (NOT SAFE TO DEPLOY)** to **A (SAFE TO PROCEED TO STAGING DEPLOYMENT)**, execute the following 3 steps:

### Step 1: Wire Up PostgreSQL Persistence for Quotas & Subscriptions
Replace the local disk cache helpers in `quota_service.py` and `payment_service.py` with direct Supabase Service Role queries:
- `subscriptions`: Read and write active plans to `public.subscriptions`.
- `payment_orders`: Persist orders to `public.payment_orders`.
- `payment_transactions`: Record captured payments to `public.payment_transactions`.
- `quota_usage`: Record monthly usage in a dedicated PostgreSQL table or managed Redis cache.

### Step 2: Run the 4 Database Migrations in Supabase
Run the scripts in order:
1. `supabase/migrations/20261031_campus_persistence.sql`
2. `supabase/migrations/20261031_harden_institutions_rls.sql`
3. `supabase/migrations/20261031_harden_security_definer_and_roles.sql`
4. `supabase/migrations/20261031_payment_system.sql`

### Step 3: Configure Cloudflare & Proxy Headers
- Do NOT enable `TRUST_PROXY_HEADERS=true` on Render without Cloudflare IP range filtering.
- Keep `TRUST_PROXY_HEADERS=false` initially, or deploy behind Cloudflare with authenticated origin pulls.

