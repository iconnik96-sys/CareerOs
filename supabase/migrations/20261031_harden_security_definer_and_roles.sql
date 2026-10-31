-- ====================================================================
-- CareerOS Security Hardening Migration
-- Date: 2026-10-31
-- Findings Addressed:
--   - FIX-004: Harden SECURITY DEFINER search_path against schema hijacking
--   - FIX-010: Decouple hardcoded founder email from RLS authorization policies
-- ====================================================================

-- 1. Harden handle_new_user() with explicit search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        user_id,
        email,
        full_name,
        role,
        target_role,
        location
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        COALESCE(NEW.raw_user_meta_data->>'target_role', ''),
        COALESCE(NEW.raw_user_meta_data->>'location', '')
    )
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- 2. Harden prevent_profile_role_tampering() with explicit search_path
CREATE OR REPLACE FUNCTION public.prevent_profile_role_tampering()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Prevent unprivileged clients from inserting elevated roles or institutions
        IF (auth.role() IS NULL OR auth.role() != 'service_role') THEN
            IF NEW.role IS NOT NULL AND NEW.role != 'student' THEN
                RAISE EXCEPTION 'Unauthorized: Newly registered profiles can only default to student role.';
            END IF;
            IF NEW.institution_id IS NOT NULL THEN
                RAISE EXCEPTION 'Unauthorized: Direct institution assignment is prohibited during registration.';
            END IF;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF (NEW.role IS DISTINCT FROM OLD.role OR NEW.institution_id IS DISTINCT FROM OLD.institution_id)
           AND (auth.role() IS NULL OR auth.role() != 'service_role') THEN
            RAISE EXCEPTION 'Unauthorized: Users cannot modify their own role or institution assignment.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3. Harden check_invite_token() with pg_temp in search_path
CREATE OR REPLACE FUNCTION public.check_invite_token(p_token text)
RETURNS TABLE (
    institution_id UUID,
    email TEXT,
    full_name TEXT,
    role TEXT,
    status TEXT,
    expires_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.institution_id,
        i.email,
        i.full_name,
        i.role,
        i.status,
        i.expires_at
    FROM public.institution_invites i
    WHERE i.token = p_token
      AND i.status = 'pending'
      AND i.expires_at > NOW()
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 4. FIX-010: Decouple hardcoded founder email from RLS Policies
-- Profiles Policy
DROP POLICY IF EXISTS "Founder and admins can view all profiles" ON public.profiles;
CREATE POLICY "Founder and admins can view all profiles" 
    ON public.profiles FOR SELECT 
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('founder', 'admin')
        OR (auth.jwt() ->> 'email') = NULLIF(current_setting('app.settings.founder_email', true), '')
    );

-- Applications Policy
DROP POLICY IF EXISTS "Founder can view all applications for platform stats" ON public.applications;
CREATE POLICY "Founder can view all applications for platform stats" 
    ON public.applications FOR SELECT 
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('founder', 'admin')
        OR (auth.jwt() ->> 'email') = NULLIF(current_setting('app.settings.founder_email', true), '')
    );

-- Analyses Policy
DROP POLICY IF EXISTS "Founder can view all analyses for platform stats" ON public.analyses;
CREATE POLICY "Founder can view all analyses for platform stats" 
    ON public.analyses FOR SELECT 
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('founder', 'admin')
        OR (auth.jwt() ->> 'email') = NULLIF(current_setting('app.settings.founder_email', true), '')
    );

-- Institution Invites Policy
DROP POLICY IF EXISTS "Admins can view institution invites" ON public.institution_invites;
CREATE POLICY "Admins can view institution invites"
    ON public.institution_invites FOR SELECT
    TO authenticated
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('founder', 'admin')
        OR (auth.jwt() ->> 'email') = NULLIF(current_setting('app.settings.founder_email', true), '')
    );
