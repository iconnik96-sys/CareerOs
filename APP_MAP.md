# 🗺️ APP_MAP.md — CareerOS Application Architecture & Discovery Map

> **Generated Date:** 2026-10-04  
> **Environment:** Development / Local Staging  
> **Repository:** `CareerOS`

---

## 1. Technical Stack Overview

* **Frontend:** React 19, TypeScript/JSX, Vite 8, React Router v7, Recharts, Lucide React, Vanilla CSS Design System.
* **Backend AI Microservice:** Python 3.11+, FastAPI 0.115, Uvicorn, Pydantic v2, PyPDF, Groq SDK (`llama-3.3-70b-versatile`, `openai/gpt-oss-120b`).
* **Database & Authentication (BaaS):** Supabase (PostgreSQL 15, GoTrue Auth, Storage Buckets for Resumes, Row Level Security).
* **Containerization:** Docker, Docker Compose, Nginx.

---

## 2. Environment Variables & Configuration

### Frontend (`frontend/.env` / Root `.env`)
| Variable | Description | Scope / Secret |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Supabase Project URL | Public |
| `VITE_SUPABASE_ANON_KEY` | Supabase Client Anonymous API Key | Public |
| `VITE_AI_BACKEND_URL` | Python FastAPI Backend Endpoint (`http://localhost:8000`) | Public |

### Backend (`backend/.env` / Root `.env`)
| Variable | Description | Scope / Secret |
| :--- | :--- | :--- |
| `PORT` | FastAPI Server Port (Default `8000`) | Internal |
| `HOST` | Host Binding (Default `0.0.0.0`) | Internal |
| `GROQ_API_KEY` | Groq API Authorization Key | **Secret / Private** |
| `GROQ_MODEL` | Default LLM model (`openai/gpt-oss-120b` or `llama-3.3-70b-versatile`) | Internal |

---

## 3. Frontend Routes & Pages

| Route Path | Component File | Auth Required | Purpose / Description |
| :--- | :--- | :--- | :--- |
| `/` | [`LandingPage.jsx`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/frontend/src/pages/LandingPage.jsx) | No | Public landing page with feature matrix & hero CTA |
| `/login` | [`LoginPage.jsx`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/frontend/src/pages/LoginPage.jsx) | No (Guest) | Supabase Auth login form |
| `/register` | [`RegisterPage.jsx`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/frontend/src/pages/RegisterPage.jsx) | No (Guest) | User registration & account creation |
| `/forgot-password` | [`ForgotPasswordPage.jsx`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/frontend/src/pages/ForgotPasswordPage.jsx) | No (Guest) | Password reset request form |
| `/onboarding` | [`OnboardingPage.jsx`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/frontend/src/pages/OnboardingPage.jsx) | **Yes** | 4-step candidate profile wizard |
| `/dashboard` | [`DashboardPage.jsx`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/frontend/src/pages/DashboardPage.jsx) | **Yes** | Overview metrics, career readiness, recent applications |
| `/resume` | [`ResumePage.jsx`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/frontend/src/pages/ResumePage.jsx) | **Yes** | Resume PDF upload, text extractor & saved resumes |
| `/resume-analysis` | [`ResumeAnalysisPage.jsx`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/frontend/src/pages/ResumeAnalysisPage.jsx) | **Yes** | Multi-vector ATS resume scanner (FastAPI AI) |
| `/ai-studio` | [`AICareerStudioPage.jsx`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/frontend/src/pages/AICareerStudioPage.jsx) | **Yes** | STAR bullet polisher, Cover letters & Outreach generator |
| `/interview-prep` | [`InterviewPrepPage.jsx`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/frontend/src/pages/InterviewPrepPage.jsx) | **Yes** | 4-vector AI mock interview practice & rubric evaluator |
| `/job-analyzer` | [`JobAnalyzerPage.jsx`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/frontend/src/pages/JobAnalyzerPage.jsx) | **Yes** | JD parsing, skill gap analysis & prep plan generator |
| `/jobs` | [`JobsPage.jsx`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/frontend/src/pages/JobsPage.jsx) | **Yes** | Curated job directory, role filters & search |
| `/jobs/:id` | [`JobDetailsPage.jsx`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/frontend/src/pages/JobDetailsPage.jsx) | **Yes** | Job details, skill match breakdown, apply button |
| `/roadmap` | [`CareerRoadmapPage.jsx`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/frontend/src/pages/CareerRoadmapPage.jsx) | **Yes** | Dynamic career roadmap & milestone tracker |
| `/applications` | [`ApplicationsPage.jsx`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/frontend/src/pages/ApplicationsPage.jsx) | **Yes** | Kanban board for tracking job application pipeline |
| `/profile` | [`CareerProfilePage.jsx`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/frontend/src/pages/CareerProfilePage.jsx) | **Yes** | User bio, skills matrix, projects showcase |
| `/settings` | [`SettingsPage.jsx`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/frontend/src/pages/SettingsPage.jsx) | **Yes** | Account settings, notifications & security preferences |

---

## 4. Complete API Endpoints Catalog (FastAPI AI Engine)

| Method | Endpoint Path | Router File | Auth Enforced in Code | Inputs | Outputs |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | [`main.py`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/backend/main.py#L58) | None | None | Health status, Groq availability |
| `POST` | `/api/ai/resume/analyze` | [`resume_analyzer.py`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/backend/routers/resume_analyzer.py#L182) | **None (Open)** | `{ resume_text, target_role, job_description }` | ATS score (0-100), 4 vector scores, missing keywords, bullets |
| `POST` | `/api/ai/resume/extract-pdf` | [`resume_analyzer.py`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/backend/routers/resume_analyzer.py#L125) | **None (Open)** | `file: UploadFile` | `{ extracted_text, char_count, is_pdf }` |
| `POST` | `/api/ai/analyze-resume-upload` | [`resume_analyzer.py`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/backend/routers/resume_analyzer.py#L277) | **None (Open)** | `file: UploadFile`, `target_role: Form`, `job_description: Form` | `DeepAnalysisResponse` JSON |
| `POST` | `/api/ai/bullets/enhance` | [`bullet_enhancer.py`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/backend/routers/bullet_enhancer.py#L27) | **None (Open)** | `{ bullet_point, target_role }` | Google XYZ STAR polished bullets, metrics, action verbs |
| `POST` | `/api/ai/interview/evaluate` | [`interview_evaluator.py`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/backend/routers/interview_evaluator.py#L38) | **None (Open)** | `{ question, user_answer, role, difficulty }` | 4-vector score (0-100), feedback, staff-level model answer |
| `POST` | `/api/ai/cover-letter/generate` | [`cover_letter.py`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/backend/routers/cover_letter.py#L35) | **None (Open)** | `{ job_title, company, job_description, resume_summary }` | Tailored cover letter markdown |
| `POST` | `/api/ai/outreach/generate` | [`cover_letter.py`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/backend/routers/cover_letter.py#L130) | **None (Open)** | `{ recipient_type, company, target_role, key_highlight }` | LinkedIn Connection note (<300 chars) & InMail referral pitch |
| `POST` | `/api/ai/copilot/chat` | [`career_copilot.py`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/backend/routers/career_copilot.py#L30) | **None (Open)** | `{ message, history, user_profile }` | AI mentor advice response |
| `POST` | `/api/ai/jobs/match` | [`job_matcher.py`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/backend/routers/job_matcher.py#L60) | **None (Open)** | `{ job_description, resume_text }` | Match score, required vs present skills, action plan |
| `POST` | `/api/ai/roadmap/generate` | [`roadmap_generator.py`](file:///c:/Users/nikhi/OneDrive/Desktop/Project/CareerOS%20-%20Copy/backend/routers/roadmap_generator.py#L38) | **None (Open)** | `{ target_role, current_skills, timeframe_weeks }` | Phased learning roadmap with capstone projects |

---

## 5. PostgreSQL Database Schema (All 12 Tables in `schema.sql`)

| Table Name | Primary Key | Foreign Keys | RLS Enabled | Declared RLS Policy Scope |
| :--- | :--- | :--- | :--- | :--- |
| `public.profiles` | `id (UUID)` | `user_id -> auth.users` | Yes | `auth.uid() = user_id` (Select, Insert, Update) |
| `public.skills` | `id (UUID)` | None | Yes | Select: Public `true`; Insert: `auth.role() = 'authenticated'` |
| `public.user_skills` | `id (UUID)` | `user_id`, `skill_id` | Yes | `auth.uid() = user_id` (Select, All) |
| `public.resumes` | `id (UUID)` | `user_id -> auth.users` | Yes | `auth.uid() = user_id` (Select, All) |
| `public.jobs` | `id (UUID)` | None | Yes | Select: Public `true`; Insert: `auth.role() = 'authenticated'` |
| `public.job_skills` | `id (UUID)` | `job_id`, `skill_id` | Yes | Select: Public `true` |
| `public.applications` | `id (UUID)` | `user_id`, `job_id` | Yes | `auth.uid() = user_id` (Select, All) |
| `public.analyses` | `id (UUID)` | `user_id`, `resume_id`, `job_id` | Yes | `auth.uid() = user_id` (Select, All) |
| `public.projects` | `id (UUID)` | `user_id -> auth.users` | Yes | `auth.uid() = user_id` (Select, All) |
| `public.role_roadmaps`| `id (UUID)` | None | Yes | Select: Public `true`; Manage: `auth.role() = 'authenticated'` |
| `public.roadmaps` | `id (UUID)` | `user_id -> auth.users` | Yes | `auth.uid() = user_id` (Select, All) |
| `public.interview_questions`| `id (UUID)` | None | Yes | Select: Public `true`; Manage: `auth.role() = 'authenticated'` |
