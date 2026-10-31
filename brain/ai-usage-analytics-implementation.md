# CareerOS — Persistent Per-User AI Token & Cost Analytics Implementation

## 1. Overview
This document details the production-grade, persistent AI usage analytics system implemented for CareerOS. The system provides the Founder Dashboard with real-time and historical visibility into token consumption, AI model distribution, and estimated API expenses in Indian Rupees (₹ INR) attributed down to individual authenticated user IDs (`auth.users.id`).

---

## 2. Database Schema & Architecture

### Migration: `supabase/migrations/20261031_z_ai_usage_analytics.sql`
The migration introduces `public.ai_usage_logs` and an aggregated reporting view `public.ai_usage_daily_summary`.

```sql
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    provider TEXT NOT NULL DEFAULT 'groq',
    model TEXT NOT NULL,
    feature TEXT NOT NULL,
    input_tokens BIGINT NOT NULL DEFAULT 0 CHECK (input_tokens >= 0),
    output_tokens BIGINT NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
    total_tokens BIGINT NOT NULL DEFAULT 0 CHECK (total_tokens >= 0),
    estimated_cost_inr NUMERIC(12, 5) NOT NULL DEFAULT 0.0 CHECK (estimated_cost_inr >= 0),
    status TEXT NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILED')),
    request_id TEXT,
    latency_ms INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Strategic Indexes
- `idx_ai_usage_user_id`: Fast per-user usage retrieval and quota auditing.
- `idx_ai_usage_created_at`: Time-series range queries and daily aggregation.
- `idx_ai_usage_feature`: Cost breakdown across resume analyzer, cover letters, mock interview evaluation, workplace simulations, etc.
- `idx_ai_usage_provider_model`: Multi-column index for LLM provider/model comparison.
- `idx_ai_usage_request_id`: Request tracing and idempotency deduplication.
- `idx_ai_usage_status`: Rapid filtering of failed vs. successful AI completions.

### Row Level Security (RLS)
The table is fully locked down with Postgres Row Level Security:
1. **Users can view own AI usage logs**:
   `USING (auth.uid() = user_id)` (authenticated users only inspect their own consumption).
2. **Founders and admins can view all AI usage logs**:
   `USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('founder', 'admin') OR (auth.jwt() ->> 'email') = NULLIF(current_setting('app.settings.founder_email', true), ''))`.
3. **Service role can manage AI usage logs**:
   `FOR ALL TO service_role USING (true) WITH CHECK (true)` (backend API worker writes directly).

### Aggregated Founder Analytics View
`public.ai_usage_daily_summary` computes daily rollups across `(usage_date, provider, model, feature)` including request counts, total tokens, sum of costs in INR, and average latency in ms.

---

## 3. Asynchronous Context Propagation & User Attribution

To attribute AI token consumption without altering existing route signatures or breaking public API contracts, asynchronous task context propagation was established:

1. **`backend/services/request_context.py`**:
   Implements thread-safe context variables (`current_user_id` and `current_request_id`) via Python's standard `contextvars`.
2. **`backend/routers/admin.py`**:
   `verify_authenticated_student` extracts the authenticated subject (`sub` / `user_id`) from the verified Supabase JWT and sets it via `set_current_user_id(str(uid))` for the duration of the request.
3. **`backend/services/llm_engine.py`**:
   Captures provider-reported prompt and completion tokens (or fallback character approximations), calculates total tokens and latency, and delegates to `usage_tracker.record_usage()`.
4. **`backend/services/usage_tracker.py`**:
   Resolves the active user ID and request trace ID from either explicit arguments or context variables, calculates exact INR costs, updates in-memory counters for local speed, and non-blockingly writes records to PostgreSQL.

---

## 4. Cost Calculation Model (₹ INR)

Token rates are defined per 1,000,000 tokens based on actual API provider pricing converted to INR (1 USD ≈ 85 INR):

| Model Family / Model | Input Rate (₹/1M) | Output Rate (₹/1M) | Default Provider |
| :--- | :--- | :--- | :--- |
| **Llama 3.1 8B Instant** | ₹4.25 | ₹6.80 | Groq |
| **Llama 3.3 70B Versatile** | ₹50.00 | ₹67.00 | Groq |
| **Gemini 2.0 Flash / Lite** | ₹6.38 | ₹25.50 | Google |
| **Gemini 1.5 Pro** | ₹106.25 | ₹425.00 | Google |
| **GPT-4o Mini** | ₹12.75 | ₹51.00 | OpenAI |
| **GPT-4o** | ₹212.50 | ₹850.00 | OpenAI |
| **DeepSeek V3** | ₹11.90 | ₹23.80 | DeepSeek |
| **DeepSeek R1** | ₹46.75 | ₹186.15 | DeepSeek |

Formula:
$$\text{Cost (₹)} = \left(\frac{\text{Input Tokens}}{1,000,000} \times \text{Input Rate}\right) + \left(\frac{\text{Output Tokens}}{1,000,000} \times \text{Output Rate}\right)$$

---

## 5. Non-Blocking Resilience & Deduplication

1. **Non-Blocking Persistence**:
   The `_persist_to_postgres()` method safely catches any transient database errors (connection timeouts, pool saturation, offline local development) and logs a warning without interrupting user workflows. AI responses are returned immediately to students even if analytics database persistence suffers a hiccup.
2. **Duplicate Request Prevention**:
   An in-memory rolling deduplication set (`_processed_request_ids`) intercepts repeated `request_id` values (e.g. from network retries or client reconnects) preventing double billing and inflated token statistics.
3. **Founder & Per-User API Methods**:
   - `usage_tracker.get_founder_analytics(days=30)`: Queries PostgreSQL view `public.ai_usage_daily_summary` with automated fallback to in-memory stats.
   - `usage_tracker.get_user_analytics(user_id, days=30)`: Returns aggregated total requests, tokens, and estimated cost for a targeted user.

---

## 6. Verification & Test Results

All test suites pass with zero regressions:
1. **`backend/test_ai_usage_analytics.py`** (9 tests, 100% pass):
   - Token cost calculation in INR.
   - User ID attribution via argument.
   - User ID attribution via async context variable.
   - Failed request logging (`status='FAILED'`, completion tokens = 0).
   - Non-blocking error resilience under DB failure.
   - Duplicate request ID suppression.
   - Founder analytics view mapping.
   - Per-user analytics aggregation.
   - LLM Engine provider and context pass-through.
2. **`backend/test_migrations.py`** (10 tests, 100% pass):
   - Discovery of all 9 migrations in order including `20261031_z_ai_usage_analytics.sql`.
   - Security policy validation on `public.ai_usage_logs`.
   - Advisory locking, checksum integrity, and rollback verification.
3. **`frontend build`**: Built cleanly in 427ms with zero errors.
4. **Existing Codebase Preservation**: All 29 original user files and endpoints strictly preserved.

