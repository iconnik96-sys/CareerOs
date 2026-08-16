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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- Account Self-Deletion Stored Procedure
-- ====================================================================

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void AS $$
BEGIN
    -- Deletes user from auth.users (cascades to all user tables)
    DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

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

-- 5. Jobs RLS (Public read, authenticated insert)
CREATE POLICY "Anyone can view jobs" 
    ON public.jobs FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can add jobs" 
    ON public.jobs FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- 6. Job Skills RLS (Public read)
CREATE POLICY "Anyone can view job skills" 
    ON public.job_skills FOR SELECT 
    USING (true);

-- 7. Applications RLS
CREATE POLICY "Users can view own applications" 
    ON public.applications FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own applications" 
    ON public.applications FOR ALL 
    USING (auth.uid() = user_id);

-- 8. Analyses RLS
CREATE POLICY "Users can view own analyses" 
    ON public.analyses FOR SELECT 
    USING (auth.uid() = user_id);

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

-- 10. Role Roadmaps RLS (Public read, authenticated manage)
CREATE POLICY "Anyone can view role roadmaps" 
    ON public.role_roadmaps FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can manage role roadmaps" 
    ON public.role_roadmaps FOR ALL 
    WITH CHECK (auth.role() = 'authenticated');

-- 11. User Roadmaps RLS
CREATE POLICY "Users can view own roadmaps" 
    ON public.roadmaps FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own roadmaps" 
    ON public.roadmaps FOR ALL 
    USING (auth.uid() = user_id);

-- 12. Interview Questions RLS (Public read, authenticated manage)
CREATE POLICY "Anyone can view interview questions" 
    ON public.interview_questions FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can manage interview questions" 
    ON public.interview_questions FOR ALL 
    WITH CHECK (auth.role() = 'authenticated');

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
