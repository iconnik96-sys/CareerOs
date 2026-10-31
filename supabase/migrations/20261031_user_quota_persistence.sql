-- ====================================================================
-- CareerOS Persistent User Quota Architecture Migration
-- Date: 2026-10-31
-- Finding Addressed: Authoritative Distributed Quota Enforcement in PostgreSQL
-- ====================================================================

-- 1. Create User Quota Usage Ledger Table
CREATE TABLE IF NOT EXISTS public.user_quota_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    feature TEXT NOT NULL,
    month_key TEXT NOT NULL, -- e.g. '2026-10'
    usage_count INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_feature_month UNIQUE (user_id, feature, month_key)
);

CREATE INDEX IF NOT EXISTS idx_user_quota_lookup 
    ON public.user_quota_usage(user_id, feature, month_key);

CREATE INDEX IF NOT EXISTS idx_user_quota_month 
    ON public.user_quota_usage(month_key);

-- 2. Enable Row Level Security
ALTER TABLE public.user_quota_usage ENABLE ROW LEVEL SECURITY;

-- 3. Row Level Security Policies
DROP POLICY IF EXISTS "Users can view own quota usage" ON public.user_quota_usage;
CREATE POLICY "Users can view own quota usage"
    ON public.user_quota_usage FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage user quota usage" ON public.user_quota_usage;
CREATE POLICY "Service role can manage user quota usage"
    ON public.user_quota_usage FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 4. Atomic Quota Consumption Function (Enforces limits inside PostgreSQL with FOR UPDATE)
CREATE OR REPLACE FUNCTION public.consume_user_quota(
    p_user_id UUID,
    p_feature TEXT,
    p_month_key TEXT,
    p_limit INTEGER
)
RETURNS TABLE (
    allowed BOOLEAN,
    current_usage INTEGER,
    max_limit INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_current INTEGER;
BEGIN
    -- Ensure usage counter row exists
    INSERT INTO public.user_quota_usage (user_id, feature, month_key, usage_count)
    VALUES (p_user_id, p_feature, p_month_key, 0)
    ON CONFLICT (user_id, feature, month_key) DO NOTHING;

    -- Lock counter row for update to serialize concurrent requests
    SELECT usage_count INTO v_current
    FROM public.user_quota_usage
    WHERE user_id = p_user_id 
      AND feature = p_feature 
      AND month_key = p_month_key
    FOR UPDATE;

    IF v_current >= p_limit THEN
        RETURN QUERY SELECT false, v_current, p_limit;
    ELSE
        UPDATE public.user_quota_usage
        SET usage_count = usage_count + 1,
            updated_at = NOW()
        WHERE user_id = p_user_id 
          AND feature = p_feature 
          AND month_key = p_month_key;

        RETURN QUERY SELECT true, v_current + 1, p_limit;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_user_quota(UUID, TEXT, TEXT, INTEGER) TO authenticated, service_role;

