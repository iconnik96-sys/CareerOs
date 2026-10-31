-- ====================================================================
-- CareerOS Security Hardening Migration: Fix Institution Invite-Code Exposure
-- Date: 2026-10-31
-- Finding Addressed: PHASE 1 - ISSUE B (Prevent Public Enumeration of College Invite Codes & TPO PII)
-- ====================================================================

-- 1. Drop the overly permissive public SELECT policy that exposed invite_code & PII
DROP POLICY IF EXISTS "Anyone can view active institutions" ON public.institutions;
DROP POLICY IF EXISTS "Anyone can view institutions" ON public.institutions;

-- 2. Restrict direct SELECT access on public.institutions to Founders, Admins, and verified TPOs
CREATE POLICY "Admins and founders can view all institutions"
    ON public.institutions FOR SELECT
    TO authenticated
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('founder', 'admin')
    );

CREATE POLICY "TPOs can view own institution"
    ON public.institutions FOR SELECT
    TO authenticated
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'tpo'
        AND id::text = (auth.jwt() -> 'app_metadata' ->> 'institution_id')
    );

-- 3. Ensure service_role retains management access
DROP POLICY IF EXISTS "Service role can manage institutions" ON public.institutions;
CREATE POLICY "Service role can manage institutions"
    ON public.institutions FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 4. Create a sanitized public directory view that excludes invite_code, contact_name, and contact_email
CREATE OR REPLACE VIEW public.institutions_public_directory AS
SELECT 
    id, 
    name, 
    slug, 
    domain, 
    city, 
    state, 
    tier, 
    logo_url, 
    batch_year, 
    is_active
FROM public.institutions
WHERE is_active = true;

-- Grant SELECT on sanitized view to authenticated and anon users
GRANT SELECT ON public.institutions_public_directory TO authenticated, anon;

-- 5. Preserve the zero-enumeration RPC for student code verification
CREATE OR REPLACE FUNCTION public.verify_college_invite_code(p_code text)
RETURNS TABLE (
    institution_id UUID,
    name TEXT,
    slug TEXT
) SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT i.id, i.name, i.slug
    FROM public.institutions i
    WHERE i.invite_code = TRIM(p_code)
      AND i.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.verify_college_invite_code(text) TO authenticated, anon;

