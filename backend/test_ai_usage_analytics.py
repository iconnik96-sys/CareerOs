import os
import sys
import unittest
from unittest.mock import MagicMock, patch
from contextlib import contextmanager

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(__file__))

from services.usage_tracker import UsageTracker, usage_tracker, RATES_PER_MILLION_INR
from services.request_context import (
    set_current_user_id,
    get_current_user_id,
    set_current_request_id,
    get_current_request_id
)
from services.llm_engine import LLMEngine


class TestAIUsageAnalytics(unittest.TestCase):
    """
    Comprehensive verification suite for Persistent Per-User AI Token & Cost Analytics.
    Verifies user attribution, token tracking, INR calculations, database persistence,
    non-blocking error resilience, and duplicate prevention.
    """

    def setUp(self):
        self.tracker = UsageTracker()
        self.tracker.reset_stats()
        set_current_user_id(None)
        set_current_request_id(None)

    def tearDown(self):
        set_current_user_id(None)
        set_current_request_id(None)

    def test_01_cost_calculation_inr(self):
        """Test 1: Cost calculation in INR accurately computes prompt and completion costs."""
        # Test Groq Llama 3.1 8B: input: 4.25/M, output: 6.80/M
        cost = UsageTracker.calculate_cost_inr("llama-3.1-8b-instant", 1_000_000, 1_000_000)
        self.assertAlmostEqual(cost, 11.05, places=2)

        # Test Google Gemini 2.0 Flash: input: 6.38/M, output: 25.50/M
        cost = UsageTracker.calculate_cost_inr("gemini-2.0-flash", 500_000, 500_000)
        # (0.5 * 6.38) + (0.5 * 25.50) = 3.19 + 12.75 = 15.94
        self.assertAlmostEqual(cost, 15.94, places=2)

        # Test small token counts
        cost = UsageTracker.calculate_cost_inr("llama-3.1-8b-instant", 1000, 500)
        expected = (1000 / 1e6) * 4.25 + (500 / 1e6) * 6.80
        self.assertAlmostEqual(cost, expected, places=4)

    def test_02_user_id_attribution_via_direct_argument(self):
        """Test 2: Explicit user_id is properly captured in log entry and persisted."""
        mock_cursor = MagicMock()

        @contextmanager
        def mock_ctx(commit=True):
            yield mock_cursor

        with patch("database.get_db_cursor", side_effect=mock_ctx):
            self.tracker.record_usage(
                feature="resume_analyzer",
                model="llama-3.1-8b-instant",
                prompt_tokens=450,
                completion_tokens=220,
                user_id="11111111-2222-3333-4444-555555555555",
                provider="groq",
                request_id="req_test_01"
            )

        self.assertEqual(len(self.tracker.recent_logs), 1)
        log = self.tracker.recent_logs[0]
        self.assertEqual(log["user_id"], "11111111-2222-3333-4444-555555555555")
        self.assertEqual(log["provider"], "groq")
        self.assertEqual(log["prompt_tokens"], 450)
        self.assertEqual(log["completion_tokens"], 220)
        self.assertEqual(log["total_tokens"], 670)

        # Check DB insert was called with user_id
        mock_cursor.execute.assert_called_once()
        args = mock_cursor.execute.call_args[0][1]
        self.assertEqual(args[0], "11111111-2222-3333-4444-555555555555")
        self.assertEqual(args[1], "groq")
        self.assertEqual(args[2], "llama-3.1-8b-instant")
        self.assertEqual(args[3], "resume_analyzer")

    def test_03_context_variable_propagation(self):
        """Test 3: Context variable set_current_user_id automatically propagates when user_id is omitted."""
        set_current_user_id("context-user-uuid-999")
        set_current_request_id("ctx_req_trace_42")

        mock_cursor = MagicMock()

        @contextmanager
        def mock_ctx(commit=True):
            yield mock_cursor

        with patch("database.get_db_cursor", side_effect=mock_ctx):
            self.tracker.record_usage(
                feature="interview_evaluator",
                model="gemini-2.0-flash",
                prompt_tokens=300,
                completion_tokens=150
            )

        log = self.tracker.recent_logs[0]
        self.assertEqual(log["user_id"], "context-user-uuid-999")
        self.assertEqual(log["request_id"], "ctx_req_trace_42")

        # Verify SQL parameter
        args = mock_cursor.execute.call_args[0][1]
        self.assertEqual(args[0], "context-user-uuid-999")
        self.assertEqual(args[9], "ctx_req_trace_42")

    def test_04_failed_request_logging(self):
        """Test 4: Failed AI completions are logged with status='FAILED' and zero completion tokens."""
        mock_cursor = MagicMock()

        @contextmanager
        def mock_ctx(commit=True):
            yield mock_cursor

        with patch("database.get_db_cursor", side_effect=mock_ctx):
            self.tracker.record_usage(
                feature="cover_letter",
                model="llama-3.3-70b-versatile",
                prompt_tokens=800,
                completion_tokens=0,
                success=False,
                latency_ms=1200,
                user_id="user_failed_01",
                request_id="req_fail_01"
            )

        self.assertEqual(self.tracker.failed_requests, 1)
        self.assertEqual(self.tracker.successful_requests, 0)
        log = self.tracker.recent_logs[0]
        self.assertEqual(log["status"], "FAILED")
        self.assertEqual(log["completion_tokens"], 0)
        self.assertEqual(log["latency_ms"], 1200)

        # Check SQL parameter
        args = mock_cursor.execute.call_args[0][1]
        self.assertEqual(args[8], "FAILED")

    def test_05_non_blocking_db_resilience(self):
        """Test 5: PostgreSQL connection errors or timeouts do NOT crash record_usage."""
        @contextmanager
        def broken_db_ctx(commit=True):
            raise ConnectionError("PostgreSQL connection pool exhausted or unreachable")

        with patch("database.get_db_cursor", side_effect=broken_db_ctx):
            # This must NOT raise an exception
            self.tracker.record_usage(
                feature="simulation",
                model="gpt-4o-mini",
                prompt_tokens=200,
                completion_tokens=100,
                user_id="user_resilience_01",
                request_id="req_resilient_01"
            )

        # Memory state must still be tracked properly
        self.assertEqual(self.tracker.total_requests, 1)
        self.assertEqual(self.tracker.total_tokens, 300)
        self.assertEqual(len(self.tracker.recent_logs), 1)

    def test_06_duplicate_request_id_prevention(self):
        """Test 6: Duplicate request_id prevents double logging and double counting."""
        mock_cursor = MagicMock()

        @contextmanager
        def mock_ctx(commit=True):
            yield mock_cursor

        with patch("database.get_db_cursor", side_effect=mock_ctx):
            # First submission
            self.tracker.record_usage(
                feature="bullet_enhancer",
                model="llama-3.1-8b-instant",
                prompt_tokens=100,
                completion_tokens=50,
                request_id="dedup_req_001"
            )
            # Duplicate submission with same request_id
            self.tracker.record_usage(
                feature="bullet_enhancer",
                model="llama-3.1-8b-instant",
                prompt_tokens=100,
                completion_tokens=50,
                request_id="dedup_req_001"
            )

        self.assertEqual(self.tracker.total_requests, 1)
        self.assertEqual(len(self.tracker.recent_logs), 1)
        mock_cursor.execute.assert_called_once()

    def test_07_get_founder_analytics(self):
        """Test 7: get_founder_analytics queries daily summary view and maps results."""
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            ("2026-10-31", "groq", "llama-3.1-8b-instant", "resume_analyzer", 10, 10, 0, 5000, 2500, 7500, 0.05, 320.5)
        ]

        @contextmanager
        def mock_ctx(commit=False):
            yield mock_cursor

        with patch("database.get_db_cursor", side_effect=mock_ctx):
            res = self.tracker.get_founder_analytics(days=7)

        self.assertEqual(res["source"], "database")
        self.assertEqual(len(res["daily_summary"]), 1)
        item = res["daily_summary"][0]
        self.assertEqual(item["date"], "2026-10-31")
        self.assertEqual(item["model"], "llama-3.1-8b-instant")
        self.assertEqual(item["total_requests"], 10)
        self.assertEqual(item["total_tokens"], 7500)

    def test_08_get_user_analytics(self):
        """Test 8: get_user_analytics queries usage logs for specific user."""
        mock_cursor = MagicMock()
        mock_cursor.fetchone.return_value = (5, 12500, 0.125)

        @contextmanager
        def mock_ctx(commit=False):
            yield mock_cursor

        with patch("database.get_db_cursor", side_effect=mock_ctx):
            res = self.tracker.get_user_analytics("test-student-user-123", days=30)

        self.assertEqual(res["user_id"], "test-student-user-123")
        self.assertEqual(res["total_requests"], 5)
        self.assertEqual(res["total_tokens"], 12500)
        self.assertEqual(res["total_cost_inr"], 0.125)

    def test_09_llm_engine_passes_context_and_provider(self):
        """Test 9: LLMEngine passes provider, user_id, and request_id down to usage tracker."""
        engine = LLMEngine()

        # Mock API response from requests.post
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "choices": [{"message": {"content": '{"analyzed": true}'}}],
            "usage": {"prompt_tokens": 120, "completion_tokens": 60}
        }

        mock_tracker = MagicMock()

        with patch.object(engine, "is_available", return_value=True), \
             patch.object(engine, "get_client", return_value=None), \
             patch("requests.post", return_value=mock_resp), \
             patch("services.usage_tracker.usage_tracker", mock_tracker):

            result = engine.generate(
                prompt="Analyze this resume",
                feature="resume_analyzer",
                user_id="user_direct_call_007",
                request_id="req_engine_007"
            )

            self.assertEqual(result, '{"analyzed": true}')
            mock_tracker.record_usage.assert_called_once()
            call_kwargs = mock_tracker.record_usage.call_args[1]
            self.assertEqual(call_kwargs["feature"], "resume_analyzer")
            self.assertEqual(call_kwargs["prompt_tokens"], 120)
            self.assertEqual(call_kwargs["completion_tokens"], 60)
            self.assertEqual(call_kwargs["user_id"], "user_direct_call_007")
            self.assertEqual(call_kwargs["request_id"], "req_engine_007")
            self.assertEqual(call_kwargs["success"], True)


if __name__ == "__main__":
    unittest.main()

