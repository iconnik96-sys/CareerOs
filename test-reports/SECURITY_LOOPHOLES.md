# 🛡️ SECURITY_LOOPHOLES.md — Security & Access Control Analysis

> **Generated Date:** 2026-10-04  
> **Target Application:** CareerOS  
> **Audit Type:** Source Code Static Analysis  
> **Status:** All findings marked `Confirmed (static analysis)` or `Not verified against live DB; owner is running pg_policies checks`.

---

## 1. Unauthenticated AI Endpoint Access Attack Scenario

* **Vulnerability ID:** `BUG-01`
* **Status:** Confirmed (static analysis)
* **Location:** [`backend/routers/`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/backend/routers) (all 7 router files)
* **Attack Scenario:**
  1. An attacker inspects frontend API calls or repo code to obtain the FastAPI URL.
  2. The attacker writes a script targeting `/api/ai/resume/analyze` or `/api/ai/copilot/chat`.
  3. The script fires thousands of requests in parallel with arbitrary text inputs.
  4. Because no authentication header or API key is required by FastAPI, all requests are processed and sent to Groq.
  5. The developer's Groq API quota is completely exhausted within minutes, bringing down all AI features for real candidates.

---

## 2. Public Content Insert Pollution Attack Scenario (`role_roadmaps`, `interview_questions`, `jobs`, `skills`)

* **Vulnerability IDs:** `BUG-02`, `BUG-03`, `BUG-04`, `BUG-12`
* **Status:** Not verified against live DB; owner is running pg_policies checks
* **Location:** [`supabase/schema.sql:L282-371`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/supabase/schema.sql#L282-L371)
* **Attack Scenario:**
  1. A logged-in candidate account sends `INSERT` requests to `/rest/v1/jobs`, `/rest/v1/role_roadmaps`, `/rest/v1/interview_questions`, or `/rest/v1/skills`.
  2. Because policies use `WITH CHECK (auth.role() = 'authenticated')` without admin role filters, Supabase permits the insertion.
  3. The candidate inserts arbitrary fake job postings, fake skills, or spam roadmaps into public directories.
  4. Chained with `BUG-08` (Stored DOM XSS), a user-inserted job containing a `javascript:` `source_url` can render executable links for all candidates viewing the job details page.

---

## 3. Storage Orphan File Retention Scenario

* **Vulnerability ID:** `BUG-13`
* **Status:** Not verified against live DB; owner is running pg_policies checks
* **Location:** [`supabase/schema.sql:L380-410`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/supabase/schema.sql#L380-L410)
* **Scenario:**
  1. A candidate uploads a resume PDF (`resume_v1.pdf`).
  2. The candidate later deletes their resume or invokes `delete_user_account()`.
  3. The row in `public.resumes` or `auth.users` is deleted via `ON DELETE CASCADE`.
  4. However, the physical binary file remains inside `storage.objects` bucket `resumes/<user_id>/resume_v1.pdf` forever.
