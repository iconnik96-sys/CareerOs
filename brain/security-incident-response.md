# CareerOS — Security Incident Response Plan (IRP)

**Version:** 1.0.0  
**Target:** CareerOS Production & Staging Environments  
**Owner:** Security Incident Response Team (SIRT)

---

## 1. Incident Response Lifecycle Overview

This Incident Response Plan outlines the structured operational protocol for detecting, triaging, investigating, containing, eradicating, and recovering from security incidents affecting CareerOS.

```
 [1. Detection & Reporting]
           │
           ▼
     [2. Triage & Severity Classification]
           │
           ▼
    [3. In-Depth Investigation & Scoping]
           │
           ▼
    [4. Containment (Immediate & Long-Term)]
           │
           ▼
    [5. Remediation & Eradication]
           │
           ▼
     [6. System Recovery & Verification]
           │
           ▼
 [7. Notification & Legal Assessment (DPDP)]
           │
           ▼
 [8. Post-Incident Review & Lessons Learned]
```

---

## 2. Phase-by-Phase Operational Protocol

### Step 1: Detection & Alert Ingestion
- **Automated Detection Vectors**:
  - Multi-tier rate limiting triggers (abnormal 429 surges on `/api/campus/join-by-code` or `/api/ai/*`).
  - LLM token consumption anomalies in `usage_tracker.py` exceeding threshold budgets.
  - Supabase Auth logs (repeated failed login attempts, unusual password resets).
  - Unhandled exception spikes in Sentry or Render server logs (500 internal errors).
- **Manual Detection Vectors**:
  - User reports regarding suspicious interview evaluations or unauthorized profile edits.
  - TPO inquiries regarding batch roster discrepancies.
  - Security researcher responsible disclosure reports.

### Step 2: Triage & Severity Classification
Incidents are triaged into four severity levels:
- **P0 / Critical**: Active remote code execution, database breach, mass token leakage, or unverified JWT signature exploitation allowing admin takeover.
- **P1 / High**: Cross-user data leakage (IDOR on resumes/evaluations), persistent TPO roster corruption, or runaway LLM billing.
- **P2 / Medium**: Bypassed free-tier quotas on a single user account, localized DoS on resume upload, or prompt injection altering single interview score.
- **P3 / Low**: Informational findings, clickjacking risks without demonstrated exploitation, minor rate-limit bypass.

### Step 3: Investigation & Scoping
1. Identify all affected systems (FastAPI backend, Supabase PostgreSQL, Supabase Storage, LLM provider accounts).
2. Determine root cause (e.g. vulnerable endpoint, forged JWT, compromised API key).
3. Extract forensic evidence:
   - Supabase PostgREST audit logs.
   - Render access logs and client IP addresses.
   - LLM usage cache (`backend/services/.usage_cache.json`).
4. Establish timeline of adversary activity (Initial access, lateral movement, data touched).

### Step 4: Containment
- **Short-Term Tactical Containment**:
  - Revoke compromised Supabase session tokens or rotate `SUPABASE_JWT_SECRET`.
  - Invalidate leaked API keys (`GROQ_API_KEY`, `ADMIN_API_KEY`) in cloud dashboards.
  - Block adversary IP addresses via Cloudflare / firewall or rate limiting middleware.
  - Temporarily disable affected endpoints using feature flags if an active zero-day is detected.
- **Long-Term Architectural Containment**:
  - Isolate affected network subnets or tenant database rows.
  - Patch vulnerable endpoint code or RLS policy.

### Step 5: Remediation & Eradication
1. Develop, review, and test security patch on staging.
2. Deploy fix across production backend and frontend.
3. Validate that the attack vector is completely closed using automated security regression tests.
4. Verify database integrity; purge any adversary-created records or backdoors.

### Step 6: Recovery & Monitoring
1. Restore clean state if data corruption occurred.
2. Incrementally restore traffic and re-enable disabled features.
3. Establish heightened telemetry and audit logging for 72 hours post-incident.
4. Verify normal baseline resource consumption and response latencies.

### Step 7: Notification & Regulatory Assessment
- Assess compliance with the **Digital Personal Data Protection (DPDP) Act, 2023** and applicable Indian data protection frameworks.
- Determine if personal data (candidate contact information, resume details, institutional rosters) was breached.
- If required by law, notify affected students, placement officers, and regulatory bodies within mandatory statutory timelines.

### Step 8: Post-Incident Review (PIR)
- Conduct blameless post-mortem within 5 business days of incident closure.
- Document:
  - Root cause analysis (5 Whys).
  - Time to Detect (TTD) and Time to Remediate (TTR).
  - Gaps in telemetry or defenses.
  - Preventative engineering tasks to permanently eliminate the class of vulnerability.
- Publish PIR document to `brain/incident-reports/` and track preventative tasks.

