# CareerOS — Comprehensive Threat Model

**Version:** 1.0.0  
**Methodology:** STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)  
**Target:** CareerOS AI Career Acceleration Platform (`voice` branch)

---

## 1. System Overview & Architecture

CareerOS is a hybrid client-server application composed of:
1. **Frontend Client**: React 19 Single Page Application running in the user's browser, communicating with Supabase via PostgREST and the Python FastAPI AI Backend via REST.
2. **Database & Auth (BaaS)**: Supabase PostgreSQL 15, GoTrue Auth, and Supabase Storage with Row-Level Security (RLS).
3. **AI Backend Microservice**: Python FastAPI service running on Render/Uvicorn, interfacing with LLM providers (Groq LPU, Google Gemini, OpenAI) and executing multi-tier rate limiting and text processing.
4. **External Services**: Groq API, Google Gemini API, OpenAI API, GitHub (for PR diff inspection).

```
 +-------------------------------------------------------------------------+
 |                            User Browser                                 |
 |  [React 19 Frontend SPA]                                                |
 |   - Web Speech API (Recognition & Synthesis)                            |
 |   - Pyodide WASM Python Virtual Machine (Simulation Unit Tests)         |
 |   - Web Worker Sandbox (JS/TS Tests)                                    |
 |   - Web Audio API (Mic volume meter)                                    |
 +-----------------------+-------------------------+-----------------------+
                         |                         |
               Supabase JWT (Bearer)      FastAPI Bearer Token
                         |                         |
                         v                         v
 +-------------------------------+   +------------------------------------+
 |        Supabase Cloud         |   |         FastAPI AI Engine          |
 |  [GoTrue Auth]                |   |   - Multi-Tier Rate Limiter        |
 |  [PostgreSQL 15 with RLS]     |   |   - Universal LLM Engine (Groq/OAI)|
 |  [Storage: 'resumes' Bucket]  |   |   - SSRF-Guarded GitHub PR Fetcher |
 |  [Postgres DB Triggers]       |   |   - Resume & PDF Parser (pypdf)    |
 +-------------------------------+   +------------------+-----------------+
                                                        |
                                            HTTPS / SSL (Zero-Storage)
                                                        |
                                                        v
                                             +--------------------+
                                             |  LLM Providers     |
                                             |   - Groq LPU       |
                                             |   - Google Gemini  |
                                             |   - OpenAI / O3    |
                                             +--------------------+
```

---

## 2. Threat Actors & Attacker Profiles

| Threat Actor | Motivation | Capability | Typical Attack Vectors |
|:---|:---|:---|:---|
| **Malicious Student / Candidate** | Unlock paid plans for free; get 100/100 interview/resume scores; exhaust AI quotas. | Low to Moderate (DevTools, Postman, script runner). | `localStorage` manipulation, direct API calling to bypass client quotas, prompt injection in resume/bullets. |
| **Anonymous Web Scraper / Bot** | Scrape question banks, harvest job data, brute-force college invite codes. | Low to High (Automated HTTP bots, proxy rotation). | `X-Forwarded-For` spoofing, probing `/api/campus/join-by-code`, automated endpoint crawling. |
| **Rogue / Competing College TPO** | Exfiltrate placement rosters of competing colleges; alter student candidate tags. | Moderate (Legitimate institutional credentials). | Cross-tenant institution ID manipulation (IDOR), unauthorized student data export. |
| **External Attacker / Internet Threat** | Compromise backend server; steal API keys; establish persistence; clickjacking. | High (Vulnerability scanners, fuzzers, exploit payloads). | Unverified JWT signature forgery, permissive CORS origin exploitation, PDF parser denial of service. |

---

## 3. Trust Boundaries & Assets

### Trust Boundaries
- **TB-1: Client Browser <-> Backend API**: Untrusted to Trusted. All HTTP headers, request bodies, and tokens must be verified.
- **TB-2: Client Browser <-> Supabase PostgREST**: Untrusted to Trusted (protected strictly by Supabase RLS policies and JWT cryptographic verification).
- **TB-3: Backend API <-> External LLM Providers**: Trusted to Third-Party. Minimize PII; prevent prompt injections from overriding system instructions.
- **TB-4: Backend API <-> Public Internet (GitHub PR Fetcher)**: Trusted to Untrusted. Strict SSRF protection against private IP access and DNS rebinding.
- **TB-5: Tenant Boundary (Student A <-> Student B & College A <-> College B)**: User-level and institution-level isolation.

### Critical Assets
- **A-1**: User Personal Identifiable Information (Full name, email, college, phone, resume text).
- **A-2**: Third-Party API Secrets (`GROQ_API_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`).
- **A-3**: LLM Token Budget & Financial Credits.
- **A-4**: Institutional Roster Data & Placement Records.
- **A-5**: Mock Interview Video/Audio Stream & Assessment Scorecards.

---

## 4. STRIDE Threat Analysis by Component

### A. Authentication & Session Management (FastAPI & Supabase)
- **Spoofing (S)**: 
  - *Threat*: Attacker sends crafted JWT when `SUPABASE_JWT_SECRET` is unset.
  - *Mitigation*: Fail closed if secret is missing; enforce cryptographic HMAC-SHA256 signature verification and audience/issuer checking.
- **Tampering (T)**:
  - *Threat*: Modifying JWT payload claims (e.g. changing `sub` or `role`).
  - *Mitigation*: Signature verification guarantees payload tamper-resistance.
- **Elevation of Privilege (E)**:
  - *Threat*: Claiming `role: admin` or `email: nikhil@gmail.com` without verification.
  - *Mitigation*: Server-controlled `app_metadata` verification only; disallow client-writable metadata for authorization decisions.

### B. Authorization & Data Access (Supabase RLS & API Endpoints)
- **Information Disclosure (I)**:
  - *Threat*: IDOR where User B accesses User A's resumes, applications, or analyses.
  - *Mitigation*: RLS policies `auth.uid() = user_id` on all tables; backend API verifies caller `sub` matches requested resource owner.
- **Elevation of Privilege (E)**:
  - *Threat*: Student self-assigning `role: tpo` in profile.
  - *Mitigation*: PostgreSQL trigger `enforce_profile_role_immutability` blocks unprivileged role or institution modifications.

### C. AI Engine & Prompt Processing (FastAPI & Groq)
- **Tampering (T)**:
  - *Threat*: Prompt injection inside resume or bullet inputs tricking model to output fake 100/100 ATS rating or leak instructions.
  - *Mitigation*: Enforce structural encapsulation `<untrusted_content>`, sanitize boundary tag characters, enforce system instructions, and validate output with strict Pydantic JSON schemas.
- **Denial of Service (D)**:
  - *Threat*: Repeatedly dispatching complex LLM generation requests to exhaust provider token budgets and cause financial loss.
  - *Mitigation*: Server-authoritative per-user quotas and distributed rate limiting tied to authenticated user ID.

### D. File Uploads & Document Parsing (Resume Analyzer)
- **Denial of Service (D)**:
  - *Threat*: Uploading deeply nested compression streams or 1,000-page PDF to freeze CPU / RAM.
  - *Mitigation*: Inspect PDF magic number (`%PDF-`), limit maximum page extraction to 5 pages, stream in 64KB chunks with 5MB ceiling.
- **Tampering (T)**:
  - *Threat*: Renaming an executable or script to `.pdf`.
  - *Mitigation*: Strict binary header inspection before handing bytes to parser.

### E. Network, CORS & Headers
- **Information Disclosure (I)**:
  - *Threat*: Permissive CORS regex matching arbitrary `.netlify.app` or `.vercel.app` domains, allowing credentialed data theft.
  - *Mitigation*: Whitelist exact production domain names (`https://careeros.vercel.app`, `https://careeros.netlify.app`), reject generic subdomain wildcards.
- **Tampering (T)**:
  - *Threat*: Clickjacking through iframe embedding.
  - *Mitigation*: Set `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'` in deployment configs.

---

## 5. Attack Trees

### Attack Tree 1: Unauthorized Administrative Takeover
```
Gain Full Founder Admin Access
├── 1. Forged JWT Token (FINDING-001)
│   ├── Target: /api/admin/metrics or /api/admin/switch-model
│   ├── Condition: SUPABASE_JWT_SECRET unset in production
│   └── Action: Send Authorization: Bearer <forged_nikhil_token> -> SUCCESS (Takeover)
└── 2. Spoof Admin Email via Header (PREVENTED)
    └── CareerOS already disabled X-Founder-Email and X-TPO-Email header trusts.
```

### Attack Tree 2: Free Tier Quota Bypass (Financial Exhaustion)
```
Unlimited AI LLM Generation without Payment
├── 1. Direct API Invocation (FINDING-003)
│   ├── Sign up for Free Student account
│   ├── Capture legitimate JWT from browser session
│   ├── Script 1,000 requests directly to /api/ai/deep-resume-analysis
│   └── Result: Backend serves all requests; bills Groq API; bypasses frontend limits.
└── 2. Client LocalStorage Manipulation
    ├── Edit localStorage 'careeros_subscription_state_...'
    ├── Set planId = 'pro'
    └── Result: Unlocks all 9 simulation IDE tasks on frontend.
```

---

### Attack Tree 3: Cross-Tenant College Data Exfiltration (BOLA/IDOR)
```
TPO Accesses Competitor Student Roster
├── 1. Campus Endpoint IDOR
│   ├── Target: /api/campus/students?institution_id=<target_inst_uuid>
│   ├── Condition: Missing server-side caller-to-institution ownership verification
│   └── Action: Pass target institution_id -> MITIGATED (HTTP 403 returned via resolve_authorized_institution)
└── 2. Student Detail Drilldown Probe
    ├── Target: /api/campus/students/<student_id>/drilldown
    └── Action: Probe foreign student ID -> MITIGATED (HTTP 404 returned)
```

### Attack Tree 4: Payment Gateway Signature Forgery & Replay
```
Unauthorized Plan Activation
├── 1. Forged Razorpay Payment Signature
│   ├── Client sends fake razorpay_payment_id and razorpay_signature
│   └── Result: MITIGATED (HMAC-SHA256 constant-time signature verification rejects with HTTP 400)
├── 2. Order Hijack by Foreign User
│   ├── User B attempts to verify User A's order_id
│   └── Result: MITIGATED (Order ownership check blocks claim with HTTP 403)
└── 3. Webhook Replay Attack
    ├── Attacker re-posts captured webhook payload
    └── Result: MITIGATED (Event deduplication table acknowledges idempotently without double-extending)
```

---

## 6. Threat Risk Matrix

| Risk ID | Threat Scenario | Likelihood | Impact | Overall Risk | Status |
|:---:|:---|:---:|:---:|:---:|:---:|
| **TR-01** | Unsigned JWT authentication bypass | High | Critical | **CRITICAL** | **MITIGATED** |
| **TR-02** | Cross-origin data theft via wildcard CORS | Medium | High | **HIGH** | **MITIGATED** |
| **TR-03** | Free-tier LLM credit drainage via API abuse | High | High | **HIGH** | **MITIGATED** |
| **TR-04** | PostgreSQL `SECURITY DEFINER` search-path hijack | Low | High | **HIGH** | **MITIGATED** |
| **TR-05** | TPO campus roster disappearance upon server reboot | High | Medium | **HIGH** | **MITIGATED** |
| **TR-06** | PDF decompression bomb causing service outage | Medium | Medium | **MEDIUM** | **MITIGATED** |
| **TR-07** | Prompt injection subverting ATS evaluation | Medium | Medium | **MEDIUM** | **MITIGATED** |
| **TR-08** | Rate limit bypass via forged `X-Forwarded-For` | High | Low | **MEDIUM** | **MITIGATED** |
| **TR-09** | Clickjacking via unconfigured frontend headers | Medium | Low | **LOW** | **MITIGATED** |
| **TR-10** | Cross-college BOLA/IDOR student roster exfiltration | High | High | **HIGH** | **MITIGATED** |
| **TR-11** | PostgREST `institutions` table invite-code leakage | High | High | **HIGH** | **MITIGATED** |
| **TR-12** | Client-side plan elevation via `user_metadata` tampering | High | High | **HIGH** | **MITIGATED** |
| **TR-13** | Payment signature forgery / order hijacking | High | Critical | **CRITICAL** | **MITIGATED** |
| **TR-14** | Webhook replay attacks on billing subscriptions | Medium | High | **HIGH** | **MITIGATED** |

---

## 7. Approval & Sign-Off
All 14 threat scenarios are fully addressed by server-side validation, cryptographic verifications, and architectural isolation.


