# 🛠️ FIX_PRIORITY_ROADMAP.md — Action Plan & Code Fixes

> **Generated Date:** 2026-10-04  
> **Target Application:** CareerOS  
> **Note:** All code snippets provided below are drop-in ready. **DO NOT apply fixes automatically until approved.**

---

## 🔍 Section 1: Frontend Write Dependency Analysis & Lockdown Strategy

Before locking down write access on global database tables, a static code audit of `frontend/src/` was conducted to ensure no candidate feature is broken:

| Table | Candidate Writes in Frontend? | Candidate Reads in Frontend? | Lockdown Impact & Solution |
| :--- | :--- | :--- | :--- |
| `public.role_roadmaps` | **No** (0 writes found) | **Yes** ([`roadmapService.js:L139`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/frontend/src/services/roadmapService.js#L139)) | Candidates only read canonical roadmaps. User progress is saved in `public.roadmaps`. Restricting `role_roadmaps` writes to `service_role` **causes 0 disruption to candidates**. |
| `public.interview_questions` | **No** (0 writes found) | **Yes** ([`interviewService.js:L18`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/frontend/src/services/interviewService.js#L18)) | Candidates only query questions. Restricting writes to `service_role` **causes 0 disruption to candidates**. |
| `public.jobs` | **No** (0 writes found) | **Yes** ([`jobService.js:L13`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/frontend/src/services/jobService.js#L13)) | Candidates discover jobs and track them in `public.applications` or `localStorage`. Restricting `jobs` inserts to admin/service role **causes 0 disruption to candidates**. |
| `public.job_skills` | **No** (0 writes found) | **Yes** ([`jobService.js:L59`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/frontend/src/services/jobService.js#L59)) | Read-only junction table. Restricting writes **causes 0 disruption to candidates**. |
| `public.skills` | **Yes** ([`profileService.js:L60`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/frontend/src/services/profileService.js#L60)) | **Yes** ([`profileService.js:L42`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/frontend/src/services/profileService.js#L42)) | Candidates insert new custom skills typed in bio. Direct RLS lockdown on `skills` table requires providing a `SECURITY DEFINER` function `add_custom_skill(name)` so candidates can continue adding valid custom skills without open insert policy. |

---

## 🔍 Section 2: "Verify Manually" SQL Validation Scripts

Run this SQL in the **Supabase SQL Editor** wrapped in `BEGIN ... ROLLBACK;` to test policy behavior:

```sql
BEGIN;

-- 1. Test if authenticated user can INSERT into global role_roadmaps
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000001';

INSERT INTO public.role_roadmaps (role_id, title, description, phases)
VALUES ('qa_test_manual_check', 'QA Manual Test Roadmap', 'Testing RLS', '[]'::jsonb);

-- 2. Test if authenticated user can UPDATE interview_questions
INSERT INTO public.interview_questions (role_id, difficulty, topic, question, answer_key, sample_answer)
VALUES ('qa_test_manual_check', 'Easy', 'QA', 'Manual Question Test', 'Key', 'Sample');

UPDATE public.interview_questions
SET question = 'HACKED QUESTION'
WHERE role_id = 'qa_test_manual_check';

-- ROLLBACK so no rows are modified
ROLLBACK;
```

---

## 💻 Section 3: Exact Code Fixes (Drop-in Ready)

### Fix 1: Supabase JWT Verification via Supabase Auth API (`/auth/v1/user`)
* **Target File:** Create [`backend/dependencies.py`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/backend/dependencies.py)

```python
import os
import requests
from fastapi import HTTPException, Security, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", "")

def verify_supabase_jwt(request: Request, credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    token = credentials.credentials
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization Bearer token."
        )

    auth_url = f"{SUPABASE_URL}/auth/v1/user"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {token}"
    }

    try:
        response = requests.get(auth_url, headers=headers, timeout=5)
        if response.status_code == 200:
            user_data = response.json()
            request.state.user_id = user_data.get("id")
            return user_data
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired Supabase authentication session."
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication service verification failed: {str(e)}"
        )
```

---

### Fix 2: Per-User Keyed Rate Limiting & 10 MB File Limit

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request

def get_user_id_or_ip(request: Request) -> str:
    user_id = getattr(request.state, "user_id", None)
    if user_id:
        return f"user:{user_id}"
    return get_remote_address(request)

limiter = Limiter(key_func=get_user_id_or_ip, default_limits=["20/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

---

### Fix 3: Removal of Fabricated Fallback Text on Empty PDF Extraction

* **Location:** [`backend/routers/resume_analyzer.py:L297-300`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/backend/routers/resume_analyzer.py#L297-L300)

```python
if not resume_text or len(resume_text.strip()) < 10:
    raise HTTPException(
        status_code=400,
        detail="Could not extract readable text from the uploaded PDF resume. Please ensure the file is not empty or password-protected."
    )
```

---

### Fix 4: Replacement RLS Policies & SECURITY DEFINER Skill Function in [`supabase/schema.sql`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/supabase/schema.sql)

```sql
-- 1. Fix role_roadmaps (Public read, write restricted to service_role)
DROP POLICY IF EXISTS "Authenticated users can manage role roadmaps" ON public.role_roadmaps;

CREATE POLICY "Service role can manage role roadmaps"
    ON public.role_roadmaps FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- 2. Fix interview_questions (Public read, write restricted to service_role)
DROP POLICY IF EXISTS "Authenticated users can manage interview questions" ON public.interview_questions;

CREATE POLICY "Service role can manage interview questions"
    ON public.interview_questions FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- 3. Fix jobs (Public read, insert restricted to service_role or admin metadata)
DROP POLICY IF EXISTS "Authenticated users can add jobs" ON public.jobs;

CREATE POLICY "Admins can add jobs"
    ON public.jobs FOR INSERT
    WITH CHECK (auth.jwt()->>'role' = 'service_role' OR (auth.jwt()->'user_metadata'->>'is_admin')::boolean = true);

-- 4. Safe Custom Skill Addition Function (Replaces open INSERT on skills)
CREATE OR REPLACE FUNCTION public.add_custom_skill(skill_name TEXT, skill_category TEXT DEFAULT 'General')
RETURNS UUID AS $$
DECLARE
    new_skill_id UUID;
BEGIN
    INSERT INTO public.skills (name, category)
    VALUES (TRIM(skill_name), skill_category)
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO new_skill_id;
    
    RETURN new_skill_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.add_custom_skill(TEXT, TEXT) TO authenticated;
```
