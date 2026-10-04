# CareerOS Automated Test Suite & QA Matrix

This repository contains the complete automated test suite for CareerOS, covering FastAPI AI microservices, Supabase RLS security, prompt injections, payload resilience, and API access controls.

## 📁 Test Directory Structure

```
tests/
├── api/
│   └── test_fastapi_endpoints.py    # Tests all 9 /api/ai/* endpoints (Auth, Validation, Prompt Injections, PDF Uploads)
├── security/
│   ├── test_prompt_injection.py     # Deep LLM prompt injection & secret leakage tests
│   └── test_cors_and_headers.py     # CORS configuration & security header verification
├── rls/
│   └── test_supabase_rls.py         # Multi-tenant RLS isolation tests (Anon, User A, User B)
├── unit/
│   └── test_vector_engine.py        # Semantic vector embedding unit tests
└── README.md
```

## 🚀 How to Run the Test Suite

### 1. Run API & Security Tests (FastAPI Microservice)
```bash
# Start FastAPI local server
python backend/main.py

# In a separate terminal, execute API test suite
python tests/api/test_fastapi_endpoints.py
python tests/security/test_prompt_injection.py
python tests/security/test_cors_and_headers.py
```

### 2. Run Supabase RLS Tests
```bash
python tests/rls/test_supabase_rls.py
```

### 3. Run Entire Suite via Runner Script
```bash
python run_all_tests.py
```
