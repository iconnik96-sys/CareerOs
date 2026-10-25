# CAREEROS — MANUAL VERIFICATION & PRODUCTION PREREQUISITES

**Assessment Date:** October 24, 2026  
**Auditor:** Principal Cloud Security & Infrastructure Auditor  
**Scope:** Security checks and architectural assurances blocked by missing live credentials, external infrastructure, or uncommitted third-party integrations.

---

## 1. External Services & Infrastructure Blocked from Automated Offline Audit

### 1.1 Supabase Live Project Settings & JWT Hooks
- **Current Observation:** The local `schema.sql` defines tables, triggers, and RLS policies. However, live Supabase project dashboard settings cannot be inspected offline.
- **Manual Verification Required:**
  1. **Disable Client Sign-Up Metadata Role Assignment:** Ensure Supabase Auth settings do not automatically trust client-supplied `user_metadata` for authorization decisions.
  2. **Email Confirmation Enforcement:** Verify in Supabase Dashboard -> Authentication -> Providers -> Email whether "Confirm email" is enabled to prevent unverified account creation.
  3. **Custom Claims Hook:** Check if a Supabase PostgreSQL Hook or Edge Function is configured to inject verified roles from `public.profiles` into `app_metadata` during token generation.

---

### 1.2 Payment Gateway & CareerCoins Ledger Integration
- **Current Observation:** Documents reference CareerCoins monetization and student tier pricing (`CAREEROS_STUDENT_PERSPECTIVE_AUDIT.md`), but no payment processor libraries (Stripe, Razorpay, LemonSqueezy) exist in `package.json` or `backend/requirements.txt`.
- **Manual Verification Required Prior to Launch:**
  1. **Webhook Signature Verification:** Ensure webhooks cryptographically verify provider signatures with a constant-time comparison to prevent forged payment events.
  2. **Idempotency Safeguards:** Verify that payment transaction IDs are uniquely indexed to prevent double-crediting CareerCoins or subscription tokens.
  3. **PCI-DSS Compliance:** Verify that raw credit card details never touch CareerOS backend servers and are processed exclusively via hosted payment elements.

---

### 1.3 Production Reverse Proxy & CDN Header Forwarding
- **Current Observation:** `backend/main.py:L117` relies on `request.client.host` for rate limiting.
- **Manual Verification Required on Deployed Host (Render / Vercel / Netlify):**
  1. Inspect the production HTTP access logs to determine whether `request.client.host` reports the real client IP or the reverse proxy IP.
  2. If running behind Nginx or Cloudflare, ensure that `X-Forwarded-For` and `CF-Connecting-IP` headers are configured with trusted proxy CIDR ranges to prevent header spoofing.

---

### 1.4 Live LLM API Quotas & Provider Fallbacks
- **Current Observation:** `llm_engine.py` supports Gemini and Groq with fallback mechanisms.
- **Manual Verification Required:**
  1. **API Key Permissions:** Verify that the configured `GEMINI_API_KEY` and `GROQ_API_KEY` have minimal necessary scopes and are restricted by IP or HTTP referrer if supported.
  2. **Quota Monitoring:** Set up budget alerts on the Google Cloud / Groq developer consoles to prevent unexpected billing spikes resulting from unauthenticated endpoint abuse.

---

### 1.5 Pyodide WASM CDN Subresource Integrity (SRI)
- **Current Observation:** Pyodide scripts are loaded from external CDNs (`jsdelivr.net`).
- **Manual Verification Required:**
  1. Ensure all dynamically loaded external scripts utilize `integrity="sha384-..."` attributes and `crossorigin="anonymous"` to protect students against upstream CDN supply-chain tampering.
