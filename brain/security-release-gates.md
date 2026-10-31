# CareerOS Security Release Gates

**Version:** 3.0.0  
**Target Branch:** `voice`

---

## 1. Quality & Security Release Gates

To achieve production readiness without introducing regressions or deploy blockers, the application must pass all 6 release gates:

### Gate 1: Cryptographic Authentication & Claims Integrity
- [x] Dual ES256 (JWKS) and HS256 verification active.
- [x] Fails closed on missing or invalid secrets.
- [x] Standard claims (`iss`, `aud`, `sub`, `nbf`, `exp`) strictly enforced.
- [x] Zero header or query-parameter token trust.

### Gate 2: Multi-Tenant Data Isolation (Zero BOLA/IDOR)
- [x] Student rosters and analytics restricted strictly to authorized college TPO (`resolve_authorized_institution`).
- [x] Cross-college roster access returns HTTP 403 Forbidden.
- [x] Cross-college student drilldown returns HTTP 404 Not Found.
- [x] CSV export enforces tenant boundary (`export_students_csv`).

### Gate 3: Commercial Quota Enforcement & Financial Integrity
- [x] Quotas authoritative server-side: Free (2 scans, 1 interview), Pro (₹149, 25 scans, 10 interviews), Ultimate (₹249, 75 scans, 30 interviews).
- [x] All 10 expensive AI endpoints enforce quotas.
- [x] Client `user_metadata` elevation strictly ignored.
- [x] Quotas reset at UTC month boundaries (`YYYY-MM`).
- [x] Quota tracking persisted across process restarts.

### Gate 4: Payment Gateway Verification & Webhook Deduplication
- [x] Server-side price calculation in paise (₹14900 / ₹24900).
- [x] Order creation idempotency prevents duplicate charges.
- [x] Constant-time HMAC-SHA256 signature verification.
- [x] Webhook verified over raw body bytes with event deduplication.
- [x] Order ownership checks prevent cross-user activation.

### Gate 5: Injection Defenses & Resource Bounds
- [x] Prompt injection sanitized across all AI prompt interpolation points.
- [x] PDF uploads validate `%PDF` magic bytes and cap at 10 pages.
- [x] Rate limiting middleware active with verified client IP.
- [x] Security headers and CSP configured for production assets and Razorpay.

### Gate 6: Functionality Preservation & Zero Breaking Changes
- [x] All 29 pre-existing user files preserved intact.
- [x] All existing frontend pages and navigation flows work without changes.
- [x] All API response schemas remain backward-compatible.

