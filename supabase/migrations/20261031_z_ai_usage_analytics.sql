-- ====================================================================
-- CareerOS Persistent Per-User AI Token & Cost Analytics Migration
-- Date: 2026-10-31
-- Finding Addressed: Persistent Per-User AI Token & Cost Attribution in PostgreSQL
-- ====================================================================

-- 1. Create AI Usage Logs Table
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

-- 2. Indexes for Analytics, User Attribution & Time-Series Aggregations
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON public.ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON public.ai_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature ON public.ai_usage_logs(feature);
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider_model ON public.ai_usage_logs(provider, model);
CREATE INDEX IF NOT EXISTS idx_ai_usage_request_id ON public.ai_usage_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_status ON public.ai_usage_logs(status);

-- 3. Enable Row Level Security
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- 4. Row Level Security Policies
-- Ordinary users can only view their own usage history
DROP POLICY IF EXISTS "Users can view own AI usage logs" ON public.ai_usage_logs;
CREATE POLICY "Users can view own AI usage logs"
    ON public.ai_usage_logs FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Founders and Admins can view all usage logs for cost & token monitoring
DROP POLICY IF EXISTS "Founders and admins can view all AI usage logs" ON public.ai_usage_logs;
CREATE POLICY "Founders and admins can view all AI usage logs"
    ON public.ai_usage_logs FOR SELECT
    TO authenticated
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('founder', 'admin')
        OR (auth.jwt() ->> 'email') = NULLIF(current_setting('app.settings.founder_email', true), '')
    );

-- Service role retains full management access
DROP POLICY IF EXISTS "Service role can manage AI usage logs" ON public.ai_usage_logs;
CREATE POLICY "Service role can manage AI usage logs"
    ON public.ai_usage_logs FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 5. Founder Analytics Views
CREATE OR REPLACE VIEW public.ai_usage_daily_summary AS
SELECT 
    DATE_TRUNC('day', created_at) AS usage_date,
    provider,
    model,
    feature,
    COUNT(*) AS total_requests,
    COUNT(*) FILTER (WHERE status = 'SUCCESS') AS successful_requests,
    COUNT(*) FILTER (WHERE status = 'FAILED') AS failed_requests,
    COALESCE(SUM(input_tokens), 0) AS total_input_tokens,
    COALESCE(SUM(output_tokens), 0) AS total_output_tokens,
    COALESCE(SUM(total_tokens), 0) AS total_tokens,
    ROUND(COALESCE(SUM(estimated_cost_inr), 0), 4) AS total_cost_inr,
    ROUND(COALESCE(AVG(latency_ms), 0), 1) AS avg_latency_ms
FROM public.ai_usage_logs
GROUP BY 1, 2, 3, 4;

GRANT SELECT ON public.ai_usage_daily_summary TO authenticated, service_role;

