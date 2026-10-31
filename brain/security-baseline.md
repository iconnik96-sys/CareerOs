# CareerOS Security Baseline

**Version:** 3.0.0  
**Target Branch:** `voice`  
**Base Commit:** `cd530942cc1f17320e51b371850d6bf32e2685b2`  
**Master Checkpoint Branch:** `checkpoint/critical-security-and-razorpay`

---

## 1. Technical Baseline Architecture

CareerOS operates on a 3-tier architecture:
1. **Frontend Client**: React 19 SPA running on Vercel/Netlify with WebAssembly Pyodide and Web Worker client-side sandboxes.
2. **Backend Engine**: Python FastAPI microservice running on Render/Uvicorn, handling AI LLM evaluation, quotas, payments, and campus management.
3. **Database & Storage**: Supabase PostgreSQL 15, GoTrue Auth, and Supabase Storage with Row-Level Security (RLS).

---

## 2. Core Security Controls Baseline

| Layer | Control | Implementation Mechanism | Status |
|---|---|---|---|
| **Auth** | Asymmetric JWT (ES256) | Supabase JWKS endpoint with 1-hr caching (`admin.py`) | Baseline |
| **Auth** | Symmetric JWT (HS256) | `hmac.compare_digest` with `SUPABASE_JWT_SECRET` | Baseline |
| **Auth** | Fail-Closed Policy | Missing credentials reject token with HTTP 401 | Baseline |
| **Auth** | Claims Validation | `iss`, `aud`, `sub`, `nbf`, `exp` strictly checked | Baseline |
| **Network** | CORS Whitelist | Exact domain array, no third-party wildcards (`main.py`) | Baseline |
| **Network** | Proxy Trust | `TRUST_PROXY_HEADERS=false` default socket host | Baseline |
| **Network** | Rate Limiting | User/IP bucket rate limiting with 7 feature tiers | Baseline |
| **Data** | Multi-Tenant BOLA | `resolve_authorized_institution` enforces college boundary | Baseline |
| **Data** | PostgreSQL RLS | Table RLS + sanitized views for public directories | Baseline |
| **Data** | Search Path | `SET search_path = public, auth, pg_temp;` on functions | Baseline |
| **AI** | Boundary Sanitization | XML tag stripping & length clamping (`prompt_sanitizer.py`) | Baseline |
| **File** | Magic Numbers | `%PDF` header validation + 10-page ceiling | Baseline |
| **Payment** | Authoritative Pricing | Server-calculated paise (₹149 / ₹249), idempotency | Baseline |
| **Payment** | Signature Verification| HMAC-SHA256 signature verification over order and payment | Baseline |
| **Payment** | Webhook Deduplication | Raw body verification + event ID ledger | Baseline |

---

## 3. Working Tree Integrity

All 29 original pre-existing user changes in the working tree are preserved without regression:
- 0 destructive git operations (`reset --hard`, `clean -fd`).
- 0 features removed, disabled, or redesigned.
- 0 UI layouts or routes altered.
- 0 breaking database drops.

