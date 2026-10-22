-- ====================================================================
-- CareerOS — Campus / Placement Training Officer (TPO) Migration
-- Method C: Admin Invite / Provisioning & Multi-Tenant Batch Roster
-- ====================================================================

-- 1. Create Institutions (Colleges & Universities)
CREATE TABLE IF NOT EXISTS public.institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- e.g. 'apex-tech'
    domain TEXT,               -- e.g. 'apextech.edu.in'
    invite_code TEXT UNIQUE NOT NULL, -- e.g. 'APEX-2026'
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

-- Index for instant lookup by slug & invite_code
CREATE INDEX IF NOT EXISTS idx_institutions_slug ON public.institutions(slug);
CREATE INDEX IF NOT EXISTS idx_institutions_invite_code ON public.institutions(invite_code);

-- 2. Create Institution Invites Table (Admin Provisioning & Single-Use Tokens)
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

-- 3. Extend Profiles Table for Campus Roles & Student Placement Metrics
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student',
ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'CSE',
ADD COLUMN IF NOT EXISTS cgpa NUMERIC(3,2) DEFAULT 8.20,
ADD COLUMN IF NOT EXISTS roll_number TEXT,
ADD COLUMN IF NOT EXISTS ats_score INTEGER DEFAULT 75,
ADD COLUMN IF NOT EXISTS mock_score INTEGER DEFAULT 70,
ADD COLUMN IF NOT EXISTS tpo_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS placement_status TEXT DEFAULT 'seeking' CHECK (placement_status IN ('seeking', 'shortlisted', 'interviewing', 'placed'));

CREATE INDEX IF NOT EXISTS idx_profiles_institution_id ON public.profiles(institution_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_branch ON public.profiles(branch);

-- 4. Enable RLS on New Tables
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_invites ENABLE ROW LEVEL SECURITY;

-- 5. Row-Level Security Policies

-- Institutions: Authenticated users can view basic institution details
CREATE POLICY "Anyone can view institutions"
    ON public.institutions FOR SELECT
    USING (true);

-- Institutions: Service role or founder can manage
CREATE POLICY "Admins can manage institutions"
    ON public.institutions FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
            AND (profiles.role = 'admin' OR profiles.role = 'founder')
        )
    );

-- Institution Invites: Invitees can view their pending token
CREATE POLICY "Public token lookup for valid invites"
    ON public.institution_invites FOR SELECT
    USING (true);

-- Institution Invites: Admins can create and revoke invites
CREATE POLICY "Admins can manage institution invites"
    ON public.institution_invites FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
            AND (profiles.role = 'admin' OR profiles.role = 'founder')
        )
    );

-- TPO Multi-Tenancy Policy for Profiles:
-- TPOs can view all profiles belonging to their own assigned institution
CREATE POLICY "TPOs can view students in their institution"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        institution_id IS NOT NULL AND
        institution_id = (
            SELECT p.institution_id 
            FROM public.profiles p 
            WHERE p.user_id = auth.uid() 
            AND p.role IN ('tpo', 'college_admin')
        )
    );

-- 6. Insert Default Seed Institution: Apex Institute of Technology
INSERT INTO public.institutions (id, name, slug, domain, invite_code, city, state, tier, contact_name, contact_email)
VALUES (
    'b7a12345-0000-0000-0000-000000000001',
    'Apex Institute of Technology',
    'apex-tech',
    'apextech.edu.in',
    'APEX-2026',
    'Bengaluru',
    'Karnataka',
    'Tier-1',
    'Dr. Rajeshwar Rao (Director of Training & Placements)',
    'tpo@apextech.edu.in'
)
ON CONFLICT (slug) DO UPDATE 
SET invite_code = EXCLUDED.invite_code, 
    contact_name = EXCLUDED.contact_name;

-- 7. Seed Active TPO Provisioned Invite Token
INSERT INTO public.institution_invites (
    institution_id, 
    email, 
    full_name, 
    role, 
    token, 
    status, 
    expires_at
)
VALUES (
    'b7a12345-0000-0000-0000-000000000001',
    'tpo@apextech.edu.in',
    'Dr. Rajeshwar Rao',
    'tpo',
    'demo-tpo-apex-token-2026',
    'pending',
    NOW() + INTERVAL '30 days'
)
ON CONFLICT (token) DO NOTHING;
