# CareerOS Founder Console — Implementation Details

## 1. Frontend Structure (`admin-frontend/`)

```
admin-frontend/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── vercel.json
├── .env.example
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types/
    │   └── admin.ts
    ├── services/
    │   ├── apiClient.ts
    │   ├── authService.ts
    │   └── adminService.ts
    ├── components/
    │   ├── layout/
    │   │   ├── AdminSidebar.tsx
    │   │   ├── AdminHeader.tsx
    │   │   └── AdminLayout.tsx
    │   ├── common/
    │   │   ├── MetricCard.tsx
    │   │   ├── StatusBadge.tsx
    │   │   ├── LoadingSkeleton.tsx
    │   │   ├── EmptyState.tsx
    │   │   └── Modal.tsx
    │   └── charts/
    │       ├── DailyTokenChart.tsx
    │       └── BreakdownPieChart.tsx
    └── pages/
        ├── LoginPage.tsx
        ├── OverviewPage.tsx
        ├── UsersPage.tsx
        ├── AiAnalyticsPage.tsx
        ├── RevenuePage.tsx
        ├── QuotasPage.tsx
        ├── SystemHealthPage.tsx
        ├── AuditLogsPage.tsx
        └── SettingsPage.tsx
```

---

## 2. Backend REST API Endpoints (`backend/routers/admin.py`)

All endpoints below require founder authentication via `verify_admin_access` (`Authorization: Bearer <jwt>` or `X-Admin-Key: <key>`):

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/auth/me` | Cryptographically validates founder session & returns admin profile |
| `GET` | `/api/admin/metrics` | Operational overview KPIs, economics, and cached usage |
| `GET` | `/api/admin/users` | Paginated student user directory with subscription and token stats |
| `GET` | `/api/admin/users/{user_id}` | Detailed account inspect: profile, quota history, recent AI logs |
| `GET` | `/api/admin/ai/analytics` | Deep token burn, daily time series, provider breakdowns, top consumers |
| `GET` | `/api/admin/payments/overview` | Captured revenue (INR), MRR, transactions ledger, orders history |
| `GET` | `/api/admin/quotas/overview` | Feature quota consumption vs server-enforced plan limits |
| `GET` | `/api/admin/system/health` | Live DB ping latency (ms), schema version, AI provider readiness |
| `GET` | `/api/admin/audit-logs` | Administrative and security audit events |
| `GET` | `/api/admin/settings` | Platform AI configuration, token rate catalog, plan quotas |
| `POST` | `/api/admin/switch-model` | Dynamically switches primary LLM model & audits action |
| `POST` | `/api/admin/reset-metrics` | Clears local memory counters while preserving PostgreSQL logs |

---

## 3. Operational Pages & Capabilities

### Phase 3: Founder Authentication (`LoginPage.tsx`)
- Dual-mode login: Supabase Auth (Email + Password) or Direct Admin API Key.
- Server-side cryptographic verification against `/api/admin/auth/me`.
- Client role claims and localStorage are ignored.
- Immediate fail-closed redirect on expired or forged tokens.

### Phase 4: Operational Overview (`OverviewPage.tsx`)
- High-level KPIs: Total registered students, registrations today/month, MRR in INR, AI token burn, estimated expense in INR.
- Active subscribers breakdown (Free, Pro @ ₹149, Ultimate @ ₹249).
- Recharts 14-day daily token consumption area chart.
- Database health status pill with real-time ping latency.

### Phase 5: Student Directory (`UsersPage.tsx`)
- Live search by student email, name, or UUID.
- Filter by subscription plan (`Free`, `Pro`, `Ultimate`).
- Table view with quota usage, tokens consumed, and net INR cost.
- Inspect modal drawer showing account profile, monthly quota history, and recent AI completions.

### Phase 6: AI Usage & Cost Center (`AiAnalyticsPage.tsx`)
- Cumulative prompt tokens, completion tokens, and total tokens burned.
- Weighted API cost calculation in INR.
- Time-series chart toggleable between Tokens, Cost in INR, and Request volume.
- Provider and model distribution donut charts.
- Highest AI consuming students leaderboard.
- Real-time searchable request logs table.

### Phase 7: Revenue & Payments (`RevenuePage.tsx`)
- Net captured revenue in INR and calculated Monthly Recurring Revenue (MRR).
- Transaction status tracking (`captured`, `failed`, `refunded`).
- Dual tabs: Captured Transactions ledger vs. Payment Orders / purchase intents.

### Phase 8: Quota & Entitlement Monitoring (`QuotasPage.tsx`)
- Real-time tracking of ATS resume scans, resume exports, mock voice interviews, and simulations.
- Plan quota matrix comparing Free (2/1/1), Pro (25/10/10), and Ultimate (75/30/30) limits.
- Quota consumption leaderboard highlighting students nearing limits.

### Phase 9: Infrastructure Diagnostics (`SystemHealthPage.tsx`)
- Direct database query latency measurement (`SELECT 1;`).
- Current migration version from `public._schema_migrations`.
- AI Inference provider status, active model, and fallback readiness.

### Phase 10: Security & Audit Ledger (`AuditLogsPage.tsx`)
- Records administrative logins, model switches, and diagnostic probes with timestamp, actor, and status.

### Phase 11: Platform Settings (`SettingsPage.tsx`)
- Live LLM model switcher invoking `POST /api/admin/switch-model`.
- Authoritative token rate card (INR per 1M tokens).
- In-memory metrics reset action.

---

## 4. Test Verification Evidence

All automated backend and security suites pass with zero regressions:
- **`backend/test_admin_console_api.py`**: 8/8 tests passed (100%)
- **`backend/test_ai_usage_analytics.py`**: 9/9 tests passed (100%)
- **`backend/test_migrations.py`**: 10/10 tests passed (100%)
- **`backend/test_critical_remediations_and_payments.py`**: 30/30 tests passed (100%)
- **`backend/test_all_security_phases.py`**: 11/11 tests passed (100%)
- **`backend/test_phase1_security.py`**: 23/23 tests passed (100%)
- **`admin-frontend build`**: Built in **1.22s** with 0 warnings and 0 errors.
- **`frontend build (student)`**: Built in **766ms** with 0 errors.

