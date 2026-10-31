-- ====================================================================
-- CareerOS — Supabase PostgreSQL Schema & Security Policies
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    degree TEXT,
    college TEXT,
    graduation_year INTEGER,
    target_role TEXT,
    location TEXT,
    experience_level TEXT DEFAULT '0-2 years (Fresher)',
    expected_salary INTEGER,
    remote_preference TEXT DEFAULT 'Hybrid',
    bio TEXT,
    avatar_url TEXT,
    career_readiness INTEGER DEFAULT 0,
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Skills Directory Table (Shared across all jobs and profiles)
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category TEXT DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. User Skills Junction Table
CREATE TABLE IF NOT EXISTS public.user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    proficiency INTEGER DEFAULT 80,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, skill_id)
);

-- 5. Resumes Table
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER DEFAULT 0,
    parsed_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Jobs Directory Table (With role_id filter association)
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id TEXT NOT NULL DEFAULT 'backend',
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    source_url TEXT,
    experience_min INTEGER DEFAULT 0,
    experience_max INTEGER DEFAULT 2,
    salary_range TEXT,
    job_type TEXT DEFAULT 'Full-time',
    is_remote BOOLEAN DEFAULT false,
    skills JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_role_id ON public.jobs(role_id);

-- 7. Job Skills Junction Table
CREATE TABLE IF NOT EXISTS public.job_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    required BOOLEAN DEFAULT true,
    UNIQUE(job_id, skill_id)
);

-- 8. Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'SAVED' CHECK (status IN ('SAVED', 'APPLIED', 'ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED')),
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    salary TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. AI Analyses Table
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    target_role TEXT,
    match_score INTEGER NOT NULL,
    strengths JSONB DEFAULT '[]'::jsonb,
    missing_skills JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    skill_breakdown JSONB DEFAULT '[]'::jsonb,
    detected_skills JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_target ON public.roadmaps(user_id, target_role);

-- 10. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    technologies JSONB DEFAULT '[]'::jsonb,
    github_url TEXT,
    live_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Canonical Role Roadmaps Table (Database-Driven Role Roadmaps)
CREATE TABLE IF NOT EXISTS public.role_roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    phases JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_roadmaps_role_id ON public.role_roadmaps(role_id);

-- 12. User Roadmaps Progress Table (User-specific saved progress)
CREATE TABLE IF NOT EXISTS public.roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    target_role TEXT NOT NULL,
    phases JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, target_role)
);

-- 13. Role-Based Interview Questions Table
CREATE TABLE IF NOT EXISTS public.interview_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    topic TEXT NOT NULL,
    question TEXT NOT NULL,
    answer_key TEXT NOT NULL,
    tips JSONB DEFAULT '[]'::jsonb,
    sample_answer TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_questions_role ON public.interview_questions(role_id, difficulty, topic);

-- ====================================================================
-- Automatic updated_at Triggers
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_resumes_updated_at
BEFORE UPDATE ON public.resumes
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_applications_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_role_roadmaps_updated_at
BEFORE UPDATE ON public.role_roadmaps
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_roadmaps_updated_at
BEFORE UPDATE ON public.roadmaps
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ====================================================================
-- Automatic User Profile Creation on Signup
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, degree, graduation_year, target_role, location)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'degree', ''),
        COALESCE((NEW.raw_user_meta_data->>'graduation_year')::integer, 2026),
        COALESCE(NEW.raw_user_meta_data->>'target_role', ''),
        COALESCE(NEW.raw_user_meta_data->>'location', '')
    )
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- Account Self-Deletion Stored Procedure
-- ====================================================================

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Explicitly purge application records
    DELETE FROM public.applications WHERE user_id = v_user_id;
    DELETE FROM public.analyses WHERE user_id = v_user_id;
    DELETE FROM public.resumes WHERE user_id = v_user_id;
    DELETE FROM public.user_skills WHERE user_id = v_user_id;
    DELETE FROM public.projects WHERE user_id = v_user_id;
    DELETE FROM public.roadmaps WHERE user_id = v_user_id;
    DELETE FROM public.profiles WHERE user_id = v_user_id;

    -- Deletes user from auth.users (cascades any remaining auth associations)
    DELETE FROM auth.users WHERE id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- ====================================================================
-- Row Level Security (RLS) Policies
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

-- 1. Profiles RLS
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Founder and admins can view all profiles" 
    ON public.profiles FOR SELECT 
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('founder', 'admin')
        OR (auth.jwt() ->> 'email') = NULLIF(current_setting('app.settings.founder_email', true), '')
    );

CREATE POLICY "TPOs can view their college student profiles"
    ON public.profiles FOR SELECT
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'tpo'
        AND profiles.institution_id IS NOT NULL
        AND profiles.institution_id::text = (auth.jwt() -> 'app_metadata' ->> 'institution_id')
    );

CREATE POLICY "Service role can manage all profiles" 
    ON public.profiles FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (
        auth.uid() = user_id 
        AND (role IS NULL OR role = 'student')
        AND institution_id IS NULL
    );

-- Enforce Profile Role Immutability (Prevents Client-Side Vertical Privilege Escalation)
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

CREATE OR REPLACE TRIGGER enforce_profile_role_immutability
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_tampering();

-- 2. Skills RLS (Public read, authenticated insert)
CREATE POLICY "Anyone can view skills" 
    ON public.skills FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can create skills" 
    ON public.skills FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- 3. User Skills RLS
CREATE POLICY "Users can view own skills" 
    ON public.user_skills FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own skills" 
    ON public.user_skills FOR ALL 
    USING (auth.uid() = user_id);

-- 4. Resumes RLS
CREATE POLICY "Users can view own resumes" 
    ON public.resumes FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own resumes" 
    ON public.resumes FOR ALL 
    USING (auth.uid() = user_id);

-- 5. Jobs RLS (Public read, service_role manage)
CREATE POLICY "Anyone can view jobs" 
    ON public.jobs FOR SELECT 
    USING (true);

CREATE POLICY "Service role can manage jobs" 
    ON public.jobs FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- 6. Job Skills RLS (Public read, service_role manage)
CREATE POLICY "Anyone can view job skills" 
    ON public.job_skills FOR SELECT 
    USING (true);

CREATE POLICY "Service role can manage job skills" 
    ON public.job_skills FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- 7. Applications RLS
CREATE POLICY "Users can view own applications" 
    ON public.applications FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Founder can view all applications for platform stats" 
    ON public.applications FOR SELECT 
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('founder', 'admin')
        OR (auth.jwt() ->> 'email') = NULLIF(current_setting('app.settings.founder_email', true), '')
    );

CREATE POLICY "Users can manage own applications" 
    ON public.applications FOR ALL 
    USING (auth.uid() = user_id);

-- 8. Analyses RLS
CREATE POLICY "Users can view own analyses" 
    ON public.analyses FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Founder can view all analyses for platform stats" 
    ON public.analyses FOR SELECT 
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('founder', 'admin')
        OR (auth.jwt() ->> 'email') = NULLIF(current_setting('app.settings.founder_email', true), '')
    );

CREATE POLICY "Users can manage own analyses" 
    ON public.analyses FOR ALL 
    USING (auth.uid() = user_id);

-- 9. Projects RLS
CREATE POLICY "Users can view own projects" 
    ON public.projects FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own projects" 
    ON public.projects FOR ALL 
    USING (auth.uid() = user_id);

-- 10. Role Roadmaps RLS (Public read, service_role manage)
CREATE POLICY "Anyone can view role roadmaps" 
    ON public.role_roadmaps FOR SELECT 
    USING (true);

CREATE POLICY "Service role can manage role roadmaps" 
    ON public.role_roadmaps FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- 11. User Roadmaps RLS
CREATE POLICY "Users can view own roadmaps" 
    ON public.roadmaps FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own roadmaps" 
    ON public.roadmaps FOR ALL 
    USING (auth.uid() = user_id);

-- 12. Interview Questions RLS (Public read, service_role manage)
CREATE POLICY "Anyone can view interview questions" 
    ON public.interview_questions FOR SELECT 
    USING (true);

CREATE POLICY "Service role can manage interview questions" 
    ON public.interview_questions FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- ====================================================================
-- Supabase Storage Setup (resumes bucket)
-- ====================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own resume files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own resume files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own resume files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own resume files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- ====================================================================
-- 13. Campus / TPO Multi-Tenant Tables & Invites (Method C)
-- ====================================================================

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

CREATE TABLE IF NOT EXISTS public.institution_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'tpo' CHECK (role IN ('tpo', 'college_admin', 'dept_coordinator')),
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_institution_invites_token ON public.institution_invites(token);
CREATE INDEX IF NOT EXISTS idx_institution_invites_email ON public.institution_invites(email);

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student',
ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'CSE',
ADD COLUMN IF NOT EXISTS cgpa NUMERIC(3,2) DEFAULT 8.20,
ADD COLUMN IF NOT EXISTS roll_number TEXT,
ADD COLUMN IF NOT EXISTS ats_score INTEGER DEFAULT 75,
ADD COLUMN IF NOT EXISTS mock_score INTEGER DEFAULT 70,
ADD COLUMN IF NOT EXISTS tpo_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS placement_status TEXT DEFAULT 'seeking';

ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_invites ENABLE ROW LEVEL SECURITY;

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

-- Secure RPC to verify an institution batch invite code without exposing the full roster of invite codes:
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

-- Institution Invites: Restricted to Admins & Service Role (Prevents Token & PII Enumeration)
CREATE POLICY "Admins can view institution invites"
    ON public.institution_invites FOR SELECT
    TO authenticated
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('founder', 'admin')
        OR (auth.jwt() ->> 'email') = NULLIF(current_setting('app.settings.founder_email', true), '')
    );

CREATE POLICY "Service role can manage institution invites"
    ON public.institution_invites FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Secure RPC for single-token verification (Zero-enumeration design)
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
      AND i.expires_at > NOW();
END;
$$;

