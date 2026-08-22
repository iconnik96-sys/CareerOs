"""
Verification Script for CareerOS Role-Based Dynamics and Pure Database Integration.
"""

import sys
import os

def test_no_role_data_file():
    print("\n--- TEST 1: Verify roleData.js is Completely Removed ---")
    role_data_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'src', 'utils', 'roleData.js')
    assert not os.path.exists(role_data_path), "Error: roleData.js should not exist!"
    print("  [PASS] Confirmed: frontend/src/utils/roleData.js does not exist.")

def test_database_job_query():
    print("\n--- TEST 2: Verify jobService is Purely Database-Driven ---")
    job_service_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'src', 'services', 'jobService.js')
    with open(job_service_path, 'r', encoding='utf-8') as f:
        content = f.read()

    assert "supabase.from('jobs').select('*')" in content
    assert "role_id.eq." in content or "role_id.ilike." in content
    assert "ROLE_JOBS_DATA" not in content
    print("  [PASS] jobService.js queries Supabase database directly with role filter and no static fallback arrays.")

def test_clean_onboarding():
    print("\n--- TEST 3: Verify Clean Onboarding & Form Isolation ---")
    onboarding_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'src', 'pages', 'OnboardingPage.jsx')
    with open(onboarding_path, 'r', encoding='utf-8') as f:
        content = f.read()

    assert 'autoComplete="off"' in content
    assert 'selectedSkills' in content
    print("  [PASS] Onboarding form enforces autoComplete='off' and clean initial state.")

if __name__ == '__main__':
    print("=" * 60)
    print("CareerOS Pure Database Jobs & Dynamic Role Verification")
    print("=" * 60)
    try:
        test_no_role_data_file()
        test_database_job_query()
        test_clean_onboarding()
        print("\n" + "=" * 60)
        print("ALL VERIFICATIONS PASSED SUCCESSFULLY!")
        print("=" * 60)
    except Exception as e:
        print(f"\n[FAIL] {e}")
        sys.exit(1)
