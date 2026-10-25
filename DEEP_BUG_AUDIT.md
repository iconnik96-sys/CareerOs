# CAREEROS — PHASE 2 DEEP FUNCTIONAL BUG & RELIABILITY AUDIT

**Date:** October 24, 2026  
**Auditor:** Principal Software Quality Assurance & Systems Reliability Engineer  
**Scope:** Functional Bugs, Edge Cases, Concurrency Races, AI Schema Mismatches, and Workflow Gaps  
**Posture:** Read-Only Source Code Analysis  

---

## 1. High-Priority Functional Bugs

### BUG-DEEP-01: DOM XSS Risk & HTML Injection in Interview PDF Export Engine
- **Component:** `frontend/src/utils/interviewPdfExport.js:L594`
- **Severity:** **MEDIUM-HIGH**
- **Description:**
  In `interviewPdfExport.js`, the export engine dynamically constructs a DOM container:
  ```javascript
  const mountContainer = document.createElement('div');
  mountContainer.id = 'pdf-render-mount';
  mountContainer.innerHTML = htmlContent;
  document.body.appendChild(mountContainer);
  ```
  While `candidateName` and `targetRole` undergo basic regex escaping, dynamic AI feedback strings (`evaluation.feedback`, `evaluation.ideal_answer`, question prompts) are directly interpolated into `htmlContent` without DOMPurify or contextual HTML entity encoding.
- **Impact:** If an attacker crafts an interview question or feeds back crafted malicious HTML/JS payloads that the AI reflects, the DOM mount executes script payloads during client-side PDF compilation.
- **Remediation Blueprint:** Use `DOMPurify.sanitize(htmlContent)` before assigning to `innerHTML`, or use native programmatic DOM node construction.

---

### BUG-DEEP-02: Campus Student Export Fallback Leaks All Mock/Cross-College Records
- **Component:** `backend/routers/campus.py:L896-902`
- **Severity:** **HIGH**
- **Description:**
  When a TPO exports their student roster via `/api/campus/export-csv`, the route filters students by `institution_id`. However, line 898 introduces a flawed fallback:
  ```python
  filtered = [s for s in STUDENTS_DB if s.get("college_id") == institution_id]
  if not filtered:
      filtered = STUDENTS_DB  # FLAW: If college has no registered students, return EVERYONE!
  ```
- **Impact:** If a newly registered institution or a college with zero active students requests a CSV export, the backend returns the entire global `STUDENTS_DB` database containing student records from other colleges.
- **Remediation Blueprint:** Remove the `if not filtered: filtered = STUDENTS_DB` fallback. If no students match the institution, return an empty CSV with headers only.

---

### BUG-DEEP-03: Web Worker Pyodide Infinite Loop CPU Denial of Service
- **Component:** `frontend/src/utils/pyodideWorker.js` / `frontend/src/pages/SimulationPage.jsx`
- **Severity:** **MEDIUM**
- **Description:**
  When executing user-submitted Python code in the browser via Pyodide Web Worker, the worker lacks an execution watchdog timer.
  ```python
  # Malicious or accidental student code:
  while True:
      pass
  ```
- **Impact:** A single submission with an infinite loop pins the Web Worker thread at 100% CPU utilization. Because the main thread never issues `worker.terminate()`, the browser tab becomes sluggish or crashes.
- **Remediation Blueprint:** Implement a strict execution timeout (e.g. 5000ms) on the host thread:
  ```javascript
  const timeoutId = setTimeout(() => {
      worker.terminate();
      resolve({ error: "Execution timed out (5s limit exceeded)." });
  }, 5000);
  ```

---

### BUG-DEEP-04: Non-Atomic File Write Concurrency Race in Usage Tracker
- **Component:** `backend/services/usage_tracker.py:L77-96`
- **Severity:** **MEDIUM**
- **Description:**
  Every AI request invokes `usage_tracker.record_request()`, which synchronously writes `.usage_cache.json` using `open(PERSIST_FILE, "w")`:
  ```python
  def _save_to_disk(self):
      with open(PERSIST_FILE, "w", encoding="utf-8") as f:
          json.dump(data, f, indent=2)
  ```
- **Impact:** Under concurrent API requests, file writes interleave, leading to truncated JSON files. When the backend restarts, `json.load()` throws a `JSONDecodeError`, resetting all usage metrics to zero.
- **Remediation Blueprint:** Write to a temporary file in the same directory and execute an atomic replace:
  ```python
  temp_file = f"{PERSIST_FILE}.tmp.{os.getpid()}"
  with open(temp_file, "w", encoding="utf-8") as f:
      json.dump(data, f, indent=2)
  os.replace(temp_file, PERSIST_FILE)
  ```

---

### BUG-DEEP-05: Reverse Proxy IP Masking Dilutes Rate Limiting
- **Component:** `backend/main.py:L117`
- **Severity:** **MEDIUM**
- **Description:**
  The rate limiter extracts client IP via:
  ```python
  client_ip = request.client.host if request.client else "127.0.0.1"
  ```
- **Impact:** When deployed behind reverse proxies (Nginx, Render, Cloudflare, AWS ALB), `request.client.host` is always the internal proxy gateway IP. This causes:
  1. All legitimate users behind that proxy to share the same 60 req/min quota, leading to accidental 429 lockouts.
  2. Inability to throttle specific abusive client IP addresses.
- **Remediation Blueprint:** Configure FastAPI's `uvicorn` with `--proxy-headers` and `--forwarded-allow-ips`, or inspect validated proxy headers (`X-Forwarded-For`).

---

### BUG-DEEP-06: Profile Creation vs Auth State Change Race Condition
- **Component:** `frontend/src/contexts/AuthContext.jsx:L190-210`
- **Severity:** **MEDIUM**
- **Description:**
  During `signup()`, the user profile is created asynchronously using:
  ```javascript
  profileService.createProfile(data.user.id, freshProfile).then(...)
  ```
  Simultaneously, `supabase.auth.onAuthStateChange` fires `SIGNED_IN`, triggering its own independent call to `loadProfile(session.user.id)`. Because `createProfile` has not yet completed, `loadProfile` encounters a `PGRST116` (record not found) error and triggers a duplicate profile creation call with different default parameters.
- **Impact:** Double write collisions, unnecessary network requests, and brief UI flashing of uninitialized profile states.
- **Remediation Blueprint:** Coordinate profile initialization with an in-flight promise cache or rely entirely on Supabase database triggers (`AFTER INSERT ON auth.users`) to guarantee profile row existence.

---

## 2. AI Schema Mismatches & Fallback Fragility

| Router / Feature | LLM Prompt Schema | Failure Mode | Behavior on Error |
| :--- | :--- | :--- | :--- |
| `interview_evaluator.py` | JSON with `overall_score`, `technical_accuracy` | If candidate answer includes escaped curly braces or markdown code blocks, LLM output can be malformed. | Returns generic 500 error: `"AI returned malformed interview evaluation data."` |
| `roadmap_generator.py` | Nested JSON with 6-month milestones | If user requests a non-traditional tech role, model occasionally emits non-JSON explanatory text prefix. | Fails `json.loads()`, returns fallback static roadmap. |
| `resume_analyzer.py` | Strict `DeepAnalysisResponse` schema | If uploaded PDF contains unusual unicode characters or binary artifacts, parser passes corrupted text to prompt. | Graceful fallback to default role text, but analysis quality degrades to 0%. |

---

## 3. Reliability & SRE Summary
- **Zero-Downtime Resilience:** Needs distributed Redis rate limiting and atomic file writes.
- **Error Handling Coverage:** Global exception handler in `backend/main.py:L48-54` prevents stack trace leaks to clients.
- **Browser Thread Safety:** Pyodide Web Worker needs an active host watchdog timer.
