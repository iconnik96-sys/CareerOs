-- ====================================================================
-- CareerOS Campus System Persistence Migration
-- Date: 2026-10-31
-- Finding Addressed: FIX-005 (Campus data persistence)
-- ====================================================================

-- Ensure institutions table exists with all required columns
CREATE TABLE IF NOT EXISTS public.institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    domain TEXT,
    invite_code TEXT UNIQUE NOT NULL,
    city TEXT DEFAULT 'Bengaluru',
    state TEXT DEFAULT 'Karnataka',
    tier TEXT DEFAULT 'Tier-1',
    logo_url TEXT,
    contact_name TEXT,
    contact_email TEXT,
    batch_year INTEGER DEFAULT 2026,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_institutions_slug ON public.institutions(slug);
CREATE INDEX IF NOT EXISTS idx_institutions_invite_code ON public.institutions(invite_code);

-- Ensure institution_invites table exists
CREATE TABLE IF NOT EXISTS public.institution_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'tpo' CHECK (role IN ('tpo', 'college_admin', 'dept_coordinator')),
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_institution_invites_token ON public.institution_invites(token);
CREATE INDEX IF NOT EXISTS idx_institution_invites_email ON public.institution_invites(email);
CREATE INDEX IF NOT EXISTS idx_institution_invites_institution_id ON public.institution_invites(institution_id);

-- Enable RLS
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_invites ENABLE ROW LEVEL SECURITY;

-- Restrict direct SELECT access on public.institutions to Founders, Admins, and verified TPOs
DROP POLICY IF EXISTS "Anyone can view active institutions" ON public.institutions;
DROP POLICY IF EXISTS "Admins and founders can view all institutions" ON public.institutions;
CREATE POLICY "Admins and founders can view all institutions"
    ON public.institutions FOR SELECT
    TO authenticated
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('founder', 'admin')
    );

DROP POLICY IF EXISTS "TPOs can view own institution" ON public.institutions;
CREATE POLICY "TPOs can view own institution"
    ON public.institutions FOR SELECT
    TO authenticated
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'tpo'
        AND id::text = (auth.jwt() -> 'app_metadata' ->> 'institution_id')
    );

-- Allow service role full management of institutions and invites
DROP POLICY IF EXISTS "Service role can manage institutions" ON public.institutions;
CREATE POLICY "Service role can manage institutions"
    ON public.institutions FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage institution invites" ON public.institution_invites;
CREATE POLICY "Service role can manage institution invites"
    ON public.institution_invites FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

