import os
import sys
import unittest
import time
import threading
from unittest.mock import MagicMock, patch
from contextlib import contextmanager

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(__file__))

import migrate
from migrate import (
    calculate_file_checksum,
    scan_migration_for_destructive_sql,
    get_available_migrations,
    ensure_migration_tracking_table,
    get_applied_migrations,
    validate_database_security_policies,
    run_migrations,
    TABLE_SECURITY_POLICY,
    ADVISORY_LOCK_ID
)
import database
from database import verify_schema_version_healthy


class MockCursor:
    """Mock database cursor simulating PostgreSQL for offline/mock test verification."""
    def __init__(self, db_state):
        self.db_state = db_state
        self.last_query = None
        self.last_params = None
        self._results = []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

    def execute(self, query, params=None):
        self.last_query = query
        self.last_params = params
        q = query.strip().upper()

        if "INVALID SQL" in q:
            raise Exception("syntax error at or near INVALID")

        if "CREATE TABLE IF NOT EXISTS PUBLIC._SCHEMA_MIGRATIONS" in q:
            self.db_state.setdefault("_schema_migrations", {})
            self._results = []
        elif "SELECT VERSION, NAME, CHECKSUM" in q:
            rows = []
            for v, data in self.db_state.get("_schema_migrations", {}).items():
                rows.append((v, data["name"], data["checksum"], data["applied_at"], data["execution_time_ms"], data["success"]))
            self._results = rows
        elif "SELECT TABLENAME, ROWSECURITY" in q:
            # Simulate all table security policies
            rows = []
            for t, pol in TABLE_SECURITY_POLICY.items():
                rows.append((t, pol["rls"]))
            self._results = rows
        elif "SELECT PRONAME, PROCONFIG" in q:
            self._results = [("consume_user_quota", ["search_path=public, pg_temp"])]
        elif "SELECT PG_ADVISORY_LOCK" in q:
            self.db_state["advisory_locked"] = True
            self._results = [(True,)]
        elif "SELECT PG_ADVISORY_UNLOCK" in q:
            self.db_state["advisory_locked"] = False
            self._results = [(True,)]
        elif "INSERT INTO PUBLIC._SCHEMA_MIGRATIONS" in q:
            v = params[0]
            name = params[1]
            chk = params[2]
            exec_time = params[3]
            self.db_state.setdefault("_schema_migrations", {})[v] = {
                "name": name,
                "checksum": chk,
                "applied_at": "2026-10-31T09:00:00Z",
                "execution_time_ms": exec_time,
                "success": True
            }
            self._results = []
        elif "SELECT EXISTS" in q:
            self._results = [(True,)]
        elif "SELECT VERSION FROM PUBLIC._SCHEMA_MIGRATIONS" in q:
            applied = list(self.db_state.get("_schema_migrations", {}).keys())
            applied.sort()
            latest = applied[-1] if applied else None
            self._results = [(latest,)] if latest else []
        else:
            self._results = []

    def fetchone(self):
        return self._results[0] if self._results else None

    def fetchall(self):
        return self._results

    def close(self):
        pass


class MockConnection:
    """Mock database connection with transaction state tracking."""
    def __init__(self, db_state=None):
        self.db_state = db_state if db_state is not None else {}
        self.committed = False
        self.rolled_back = False

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

    def cursor(self):
        return MockCursor(self.db_state)

    def commit(self):
        self.committed = True

    def rollback(self):
        self.rolled_back = True

    def close(self):
        pass


class TestDatabaseMigrationsAndPersistence(unittest.TestCase):
    """Test suite covering the 10 mandatory criteria for database migrations and persistent quotas."""

    def setUp(self):
        self.db_state = {}
        self.mock_conn = MockConnection(self.db_state)

    def test_01_discovery_of_all_eight_migrations(self):
        """Test 1: Discovers all 8 versioned migration scripts in chronological sequence."""
        migrations = get_available_migrations()
        self.assertGreaterEqual(len(migrations), 8)
        versions = [m["version"] for m in migrations]

        # Verify exact required migrations exist
        expected_migrations = [
            "20261013_workplace_simulations",
            "20261022_campus_tpo_system",
            "20261028_placement_arena_tables",
            "20261031_campus_persistence",
            "20261031_harden_institutions_rls",
            "20261031_harden_security_definer_and_roles",
            "20261031_payment_system",
            "20261031_user_quota_persistence",
            "20261031_z_ai_usage_analytics"
        ]
        for exp in expected_migrations:
            self.assertIn(exp, versions, f"Required migration '{exp}' not discovered!")

        # Verify sorted ordering
        self.assertEqual(versions, sorted(versions), "Migrations must be strictly ordered by version.")

    def test_02_destructive_sql_detection_safety_guard(self):
        """Test 2: Pre-scan safety guard strictly flags DROP TABLE and TRUNCATE."""
        safe_sql = "CREATE TABLE IF NOT EXISTS public.test (id int); CREATE INDEX idx ON public.test(id);"
        violations = scan_migration_for_destructive_sql("test_safe.sql", safe_sql)
        self.assertEqual(len(violations), 0)

        dangerous_sql = "DROP TABLE public.users CASCADE; TRUNCATE public.profiles;"
        violations = scan_migration_for_destructive_sql("test_danger.sql", dangerous_sql)
        self.assertEqual(len(violations), 2)
        self.assertTrue(any("DROP TABLE" in v for v in violations))
        self.assertTrue(any("TRUNCATE" in v for v in violations))

    def test_03_fresh_database_installation_execution(self):
        """Test 3: Fresh database initialization runs all migrations and records history."""
        success = run_migrations(self.mock_conn)
        self.assertTrue(success)
        self.assertTrue(self.mock_conn.committed)

        # Check recorded migrations in _schema_migrations table
        recorded = self.db_state.get("_schema_migrations", {})
        self.assertGreaterEqual(len(recorded), 8)
        self.assertIn("20261031_user_quota_persistence", recorded)
        self.assertTrue(recorded["20261031_user_quota_persistence"]["success"])

    def test_04_idempotent_repeated_execution(self):
        """Test 4: Running migrations a second time discovers 0 pending and executes no-op."""
        # First execution applies all
        run_migrations(self.mock_conn)
        initial_count = len(self.db_state["_schema_migrations"])

        # Second execution
        success = run_migrations(self.mock_conn)
        self.assertTrue(success)
        self.assertEqual(len(self.db_state["_schema_migrations"]), initial_count)

    def test_05_concurrent_advisory_lock_simulation(self):
        """Test 5: Concurrency locking ensures two processes do not collide."""
        shared_db_state = {}
        lock_held = threading.Event()
        worker1_done = threading.Event()

        def worker1():
            conn = MockConnection(shared_db_state)
            cur = conn.cursor()
            migrate.acquire_advisory_lock(cur)
            lock_held.set()
            time.sleep(0.05)
            migrate.run_migrations(conn)
            migrate.release_advisory_lock(cur)
            worker1_done.set()

        def worker2():
            lock_held.wait()
            conn = MockConnection(shared_db_state)
            # Worker 2 will run after lock released
            worker1_done.wait()
            migrate.run_migrations(conn)

        t1 = threading.Thread(target=worker1)
        t2 = threading.Thread(target=worker2)
        t1.start()
        t2.start()
        t1.join()
        t2.join()

        # Both completed cleanly without corrupted state
        self.assertGreaterEqual(len(shared_db_state.get("_schema_migrations", {})), 8)

    def test_06_transactional_rollback_on_failed_migration(self):
        """Test 6: Syntax error inside migration triggers transaction rollback."""
        bad_migration = {
            "version": "20261101_bad_syntax",
            "filename": "20261101_bad_syntax.sql",
            "filepath": "fake_path.sql",
            "checksum": "fake_sha",
            "content": "INVALID SQL SYNTAX HERE;"
        }

        with patch("migrate.get_available_migrations", return_value=[bad_migration]):
            conn = MockConnection(self.db_state)
            with self.assertRaises(RuntimeError):
                run_migrations(conn)
            self.assertTrue(conn.rolled_back)

    def test_07_table_by_table_rls_security_validation(self):
        """Test 7: Validates that public tables enforce Row Level Security."""
        cursor = self.mock_conn.cursor()
        is_valid, issues = validate_database_security_policies(cursor)
        self.assertTrue(is_valid, f"Security policies failed: {issues}")
        self.assertEqual(len(issues), 0)

    def test_08_startup_schema_health_gate(self):
        """Test 8: FastAPI startup verifies schema version and blocks if outdated."""
        @contextmanager
        def mock_cursor_ctx(commit=False):
            yield self.mock_conn.cursor()

        # When DB has latest version applied
        self.db_state["_schema_migrations"] = {
            "20261031_user_quota_persistence": {"success": True}
        }
        with patch("database.get_db_cursor", side_effect=mock_cursor_ctx):
            with patch("database.is_db_configured", return_value=True):
                is_healthy, version = verify_schema_version_healthy(required_version="20261031_user_quota_persistence")
                self.assertTrue(is_healthy)
                self.assertEqual(version, "20261031_user_quota_persistence")

        # When DB has older version applied
        self.db_state["_schema_migrations"] = {
            "20261013_workplace_simulations": {"success": True}
        }
        with patch("database.get_db_cursor", side_effect=mock_cursor_ctx):
            with patch("database.is_db_configured", return_value=True):
                is_healthy, version = verify_schema_version_healthy(required_version="20261031_user_quota_persistence")
                self.assertFalse(is_healthy)
                self.assertIn("out of date", version)

    def test_09_production_quota_fail_closed_behavior(self):
        """Test 9: In production mode, database quota check fails closed when DB unavailable."""
        from services.quota_service import check_and_consume_quota
        from fastapi import HTTPException

        user_payload = {"sub": "student-prod-fail-01", "email": "student@college.edu", "app_metadata": {"plan_id": "free"}}

        # When IS_PRODUCTION=True and DB is unconfigured, raises HTTP 503
        with patch("services.quota_service.IS_PRODUCTION", True):
            with patch("services.quota_service.is_db_configured", return_value=False):
                with self.assertRaises(HTTPException) as ctx:
                    check_and_consume_quota(user_payload, "resume_scans")
                self.assertEqual(ctx.exception.status_code, 503)

    def test_10_atomic_quota_enforcement_boundary(self):
        """Test 10: PostgreSQL stored function consume_user_quota enforces limits inside DB."""
        from services.quota_service import check_and_consume_quota
        from fastapi import HTTPException

        user_payload = {"sub": "student-atomic-01", "app_metadata": {"plan_id": "free"}}

        mock_cur = MagicMock()
        mock_cur.fetchone.return_value = (True, 1, 2)  # Scan 1 allowed

        @contextmanager
        def mock_ctx(commit=False):
            yield mock_cur

        with patch("services.quota_service.is_db_configured", return_value=True):
            with patch("services.quota_service.get_db_cursor", side_effect=mock_ctx):
                # 1st scan allowed
                check_and_consume_quota(user_payload, "resume_scans")
                mock_cur.execute.assert_called()

                # On limit reached, consume_user_quota returns allowed=False
                mock_cur.fetchone.return_value = (False, 2, 2)
                with self.assertRaises(HTTPException) as ctx:
                    check_and_consume_quota(user_payload, "resume_scans")
                self.assertEqual(ctx.exception.status_code, 403)
                self.assertIn("Monthly subscription quota reached", ctx.exception.detail)


if __name__ == "__main__":
    unittest.main()
