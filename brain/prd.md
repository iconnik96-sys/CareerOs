# CareerOS — Product Requirements Document (PRD)

**Version:** 2.0.0 (Production Hardened & Commercialized)  
**Last Updated:** 2026-10-31  
**Status:** In Production Hardening & Staging Verification

---

## 1. Product Vision & Objectives

CareerOS is an all-in-one AI career acceleration platform engineered specifically for engineering students and job-seekers in India. It bridges the gap between campus academics and high-paying software engineering placements by combining:
1. **Targeted ATS Resume Auditing**: Deep ATS parsing, keyword gap extraction, and 6-second recruiter glance simulations.
2. **Real-Time Voice Mock Interviews**: Low-latency, AI-driven behavioral and technical voice interviews with structured rubric evaluations.
3. **In-Browser SWE Simulation Workspace**: Production outage and feature tickets executed in a sandboxed WebAssembly (Pyodide Python) and Web Worker (JS/TS) runtime.
4. **Multi-Tenant Campus Placement Portal**: Institutional dashboards for Training & Placement Officers (TPOs) to track batch readiness, manage cohort rosters, and monitor placement metrics.
5. **Fair & Transparent Commercial Tiers**: Affordable self-serve subscriptions (Free, Pro at ₹149/mo, Ultimate at ₹249/mo) backed by Razorpay.

---

## 2. Target User Personas

| Persona | Description | Core Jobs-to-be-Done | Key Security Needs |
|---|---|---|---|
| **Engineering Student (Job Seeker)** | Tier-2/3 college fresher or junior developer applying for tech roles. | Build ATS-optimized resume; practice voice interviews; solve production engineering tickets. | Privacy of personal resume data; secure payment checkout; reliable quota allocations. |
| **Training & Placement Officer (TPO)** | College placement director managing 200–2,000 engineering students. | Distribute batch join codes; monitor student ATS scores; filter students ready for placement drives. | Strict multi-tenant isolation; competitor college cannot view student roster; invite-code privacy. |
| **Platform Founder / Super Admin** | CareerOS platform operator and technical owner. | Monitor live LLM token costs and margins; switch AI models dynamically; manage institutional partnerships. | Cryptographically enforced admin endpoints; immunity from email spoofing; accurate unit economics. |

---

## 3. Product Features & Requirements

### 3.1. AI Resume Analyzer & Bullet Enhancer
- **Multi-Format Ingestion**: Supports `.pdf` and `.txt` files up to 5MB.
- **Binary Validation**: Strict magic number validation (`%PDF-`) and 10-page ceiling to protect backend parsers.
- **Deep ATS Scoring**: Computes overall score (0-100), impact quantification, skill breakdown, and recruiter checklist.
- **Bullet Point Refinement**: Rewrites passive resume bullets into Google XYZ-formula achievements with prompt injection sanitization.

### 3.2. Voice Mock Interview Engine
- **Voice Interactivity**: In-browser speech recognition and synthesis paired with audio waveform visualization.
- **Question Generation**: Dynamic questions tailored to target job role, tech stack, and experience level.
- **Evaluation Rubric**: Scores clarity, technical accuracy, confidence, and STAR method adherence.
- **Quota Enforced**: 1 free mock interview per month; Pro tier unlocks 10 interviews; Ultimate unlocks 30 interviews.

### 3.3. SWE Simulation Workspace
- **Browser Sandbox Execution**: Runs student code using client-side Pyodide WASM (Python) and Web Workers (JavaScript/TypeScript).
- **Zero Server Execution Risk**: Eliminates remote code execution vulnerabilities by keeping test harness execution strictly within client browser sandboxes.
- **Tiered Access**: Free tier includes starter task; Pro tier unlocks 6 realistic tickets; Ultimate unlocks 20+ production tracks.

### 3.4. Campus TPO Portal
- **Batch Invite System**: Colleges receive unique invite codes verified via atomic database RPCs.
- **Multi-Tenant Isolation**: TPOs strictly see students enrolled in their institution. Cross-college rosters return HTTP 403.
- **Data Persistence**: Student enrollments and institutional profiles persist reliably in Supabase PostgreSQL tables.

### 3.5. Commercial Subscriptions & Razorpay Billing
- **Authoritative Plans**:
  - **Free (₹0/mo)**: 2 ATS scans, 1 watermarked export, 1 mock interview, 15 copilot chats.
  - **Pro (₹149/mo)**: 25 ATS scans, 10 clean exports, 10 mock interviews, 6 simulations, 150 copilot chats.
  - **Ultimate (₹249/mo)**: 75 ATS scans, 30 exports, 30 mock interviews, all simulations, 500 copilot chats.
- **Tamper-Proof Billing**:
  - Server-calculated pricing in INR paise (14900 / 24900).
  - Idempotent order creation preventing double billing.
  - Constant-time HMAC-SHA256 signature verification on `/api/payments/verify-payment`.
  - Webhook processing with raw byte signature check and event deduplication.

---

## 4. Non-Functional & Security Requirements

1. **Authentication Integrity**: Dual ES256 JWKS and HS256 secret verification with fail-closed security posture.
2. **Strict Origin Isolation**: CORS restricted strictly to authorized production and localhost origins.
3. **Denial-of-Service Defense**: In-memory rate limiting with verified client IP extraction (`TRUST_PROXY_HEADERS=false` default).
4. **Data Isolation (RLS)**: Row-Level Security on all Supabase tables ensuring students only read/write their own records.
5. **Prompt Injection Hardening**: All untrusted candidate inputs sanitized with XML entity replacement and structured LLM JSON output format.
6. **Zero Destructive Migration**: All database updates provided as backward-compatible SQL migrations.

