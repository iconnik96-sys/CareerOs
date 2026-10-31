import os
import json
import time
import threading
from datetime import datetime
from typing import Dict, Any, List, Optional
import logging

try:
    from services.request_context import get_current_user_id, get_current_request_id
except ImportError:
    try:
        from backend.services.request_context import get_current_user_id, get_current_request_id
    except ImportError:
        def get_current_user_id() -> Optional[str]: return None
        def get_current_request_id() -> Optional[str]: return None

logger = logging.getLogger("UsageTracker")

PERSIST_FILE = os.path.join(os.path.dirname(__file__), ".usage_cache.json")

# Rates per 1M tokens in INR (approx 1 USD = 85 INR)
RATES_PER_MILLION_INR = {
    # --- Groq LPU Models ---
    "llama-3.1-8b-instant": {"input": 4.25, "output": 6.80, "name": "Llama 3.1 8B Instant", "provider": "Groq"},
    "llama-3.3-70b-versatile": {"input": 50.0, "output": 67.0, "name": "Llama 3.3 70B Versatile", "provider": "Groq"},
    "llama3-70b-8192": {"input": 50.0, "output": 67.0, "name": "Llama 3 70B", "provider": "Groq"},
    "mixtral-8x7b-32768": {"input": 20.0, "output": 20.0, "name": "Mixtral 8x7B", "provider": "Groq"},
    "openai/gpt-oss-120b": {"input": 12.75, "output": 51.00, "name": "GPT-OSS 120B", "provider": "Groq"},

    # --- Google Gemini Models ---
    "gemini-2.0-flash": {"input": 6.38, "output": 25.50, "name": "Gemini 2.0 Flash", "provider": "Google"},
    "gemini-2.0-flash-lite": {"input": 6.38, "output": 25.50, "name": "Gemini 2.0 Flash Lite", "provider": "Google"},
    "gemini-1.5-flash": {"input": 6.38, "output": 25.50, "name": "Gemini 1.5 Flash", "provider": "Google"},
    "gemini-1.5-flash-8b": {"input": 3.19, "output": 12.75, "name": "Gemini 1.5 Flash 8B", "provider": "Google"},
    "gemini-1.5-pro": {"input": 106.25, "output": 425.00, "name": "Gemini 1.5 Pro", "provider": "Google"},

    # --- OpenAI Models ---
    "gpt-4o-mini": {"input": 12.75, "output": 51.00, "name": "GPT-4o Mini", "provider": "OpenAI"},
    "gpt-4o": {"input": 212.50, "output": 850.00, "name": "GPT-4o", "provider": "OpenAI"},
    "o3-mini": {"input": 93.50, "output": 374.00, "name": "o3-mini", "provider": "OpenAI"},

    # --- DeepSeek Models ---
    "deepseek-chat": {"input": 11.90, "output": 23.80, "name": "DeepSeek V3", "provider": "DeepSeek"},
    "deepseek/deepseek-chat": {"input": 11.90, "output": 23.80, "name": "DeepSeek V3 (OpenRouter)", "provider": "OpenRouter"},
    "deepseek-reasoner": {"input": 46.75, "output": 186.15, "name": "DeepSeek R1", "provider": "DeepSeek"},
    "deepseek/deepseek-r1": {"input": 46.75, "output": 186.15, "name": "DeepSeek R1 (OpenRouter)", "provider": "OpenRouter"},

    # --- Standard Fallback ---
    "default": {"input": 25.0, "output": 50.0, "name": "Universal Model", "provider": "Custom"}
}

class UsageTracker:
    def __init__(self):
        self._lock = threading.Lock()
        self.total_requests = 0
        self.successful_requests = 0
        self.failed_requests = 0
        self.total_prompt_tokens = 0
        self.total_completion_tokens = 0
        self.total_tokens = 0
        self.total_cost_inr = 0.0
        self.feature_breakdown: Dict[str, Dict[str, Any]] = {}
        self.model_breakdown: Dict[str, Dict[str, Any]] = {}
        self.recent_logs: List[Dict[str, Any]] = []
        self.active_model_override: Optional[str] = None
        self._processed_request_ids: set = set()
        self._load_from_disk()

    def _load_from_disk(self):
        try:
            if os.path.exists(PERSIST_FILE):
                with open(PERSIST_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.total_requests = data.get("total_requests", 0)
                    self.successful_requests = data.get("successful_requests", 0)
                    self.failed_requests = data.get("failed_requests", 0)
                    self.total_prompt_tokens = data.get("total_prompt_tokens", 0)
                    self.total_completion_tokens = data.get("total_completion_tokens", 0)
                    self.total_tokens = data.get("total_tokens", 0)
                    self.total_cost_inr = data.get("total_cost_inr", 0.0)
                    self.feature_breakdown = data.get("feature_breakdown", {})
                    self.model_breakdown = data.get("model_breakdown", {})
                    self.recent_logs = data.get("recent_logs", [])[-50:]
                    self.active_model_override = None
        except Exception as e:
            logger.warning(f"Could not load usage cache: {e}")

    def _save_to_disk(self):
        with self._lock:
            try:
                data = {
                    "total_requests": self.total_requests,
                    "successful_requests": self.successful_requests,
                    "failed_requests": self.failed_requests,
                    "total_prompt_tokens": self.total_prompt_tokens,
                    "total_completion_tokens": self.total_completion_tokens,
                    "total_tokens": self.total_tokens,
                    "total_cost_inr": round(self.total_cost_inr, 4),
                    "feature_breakdown": self.feature_breakdown,
                    "model_breakdown": self.model_breakdown,
                    "recent_logs": self.recent_logs[-50:],
                    "active_model_override": None
                }
                temp_file = f"{PERSIST_FILE}.tmp.{os.getpid()}"
                with open(temp_file, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2)
                os.replace(temp_file, PERSIST_FILE)
            except Exception as e:
                logger.warning(f"Could not save usage cache: {e}")

    @staticmethod
    def get_rate_for_model(model: str) -> Dict[str, Any]:
        """Resolves exact or fuzzy rate per 1M tokens in INR."""
        if not model:
            return RATES_PER_MILLION_INR["default"]

        m_key = model.strip().lower()
        for k, v in RATES_PER_MILLION_INR.items():
            if k.lower() == m_key:
                return v

        # Fuzzy matching based on model family
        if "8b" in m_key:
            return {"input": 4.25, "output": 6.80, "name": model, "provider": "Groq"}
        if "flash" in m_key:
            return {"input": 6.38, "output": 25.50, "name": model, "provider": "Google"}
        if "mini" in m_key:
            return {"input": 12.75, "output": 51.00, "name": model, "provider": "OpenAI"}
        if "70b" in m_key:
            return {"input": 50.0, "output": 67.0, "name": model, "provider": "Groq"}
        if "pro" in m_key:
            return {"input": 106.25, "output": 425.00, "name": model, "provider": "Google"}
        if "4o" in m_key:
            return {"input": 212.50, "output": 850.00, "name": model, "provider": "OpenAI"}
        if "deepseek" in m_key:
            return {"input": 11.90, "output": 23.80, "name": model, "provider": "DeepSeek"}

        return RATES_PER_MILLION_INR["default"]

    @staticmethod
    def calculate_cost_inr(model: str, prompt_tokens: int, completion_tokens: int) -> float:
        rate = UsageTracker.get_rate_for_model(model)
        p_cost = (prompt_tokens / 1_000_000) * rate["input"]
        c_cost = (completion_tokens / 1_000_000) * rate["output"]
        return round(p_cost + c_cost, 5)

    def _persist_to_postgres(self, record: Dict[str, Any]):
        """
        Asynchronously / non-blockingly persists AI token usage to PostgreSQL.
        Never throws or blocks the caller if database operations fail.
        """
        try:
            try:
                from database import get_db_cursor
            except ImportError:
                from backend.database import get_db_cursor

            with get_db_cursor(commit=True) as cur:
                if not cur:
                    return

                cur.execute(
                    """
                    INSERT INTO public.ai_usage_logs (
                        user_id,
                        provider,
                        model,
                        feature,
                        input_tokens,
                        output_tokens,
                        total_tokens,
                        estimated_cost_inr,
                        status,
                        request_id,
                        latency_ms
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                    """,
                    (
                        record.get("user_id"),
                        record.get("provider", "groq"),
                        record.get("model", "unknown"),
                        record.get("feature", "general"),
                        int(record.get("prompt_tokens", 0)),
                        int(record.get("completion_tokens", 0)),
                        int(record.get("total_tokens", 0)),
                        float(record.get("cost_inr", 0.0)),
                        record.get("status", "SUCCESS"),
                        record.get("request_id"),
                        int(record.get("latency_ms", 0))
                    )
                )
        except Exception as e:
            logger.warning(f"Could not persist AI usage log to PostgreSQL (non-blocking fallback): {e}")

    def record_usage(
        self,
        feature: str,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        success: bool = True,
        latency_ms: int = 0,
        user_id: Optional[str] = None,
        provider: Optional[str] = None,
        request_id: Optional[str] = None
    ):
        # Resolve context variables if omitted
        eff_user_id = user_id or get_current_user_id()
        eff_request_id = request_id or get_current_request_id() or f"req_{int(time.time() * 1000)}"

        # Deduplicate request processing if request_id provided
        if eff_request_id:
            with self._lock:
                if eff_request_id in self._processed_request_ids:
                    logger.debug(f"Duplicate request_id {eff_request_id} detected in usage tracker; skipping duplicate log.")
                    return
                self._processed_request_ids.add(eff_request_id)
                if len(self._processed_request_ids) > 10000:
                    self._processed_request_ids.clear()

        eff_provider = provider
        if not eff_provider:
            eff_provider = self.get_rate_for_model(model).get("provider", "Groq").lower()

        total = prompt_tokens + completion_tokens
        cost = self.calculate_cost_inr(model, prompt_tokens, completion_tokens)

        with self._lock:
            self.total_requests += 1
            if success:
                self.successful_requests += 1
            else:
                self.failed_requests += 1

            self.total_prompt_tokens += prompt_tokens
            self.total_completion_tokens += completion_tokens
            self.total_tokens += total
            self.total_cost_inr += cost

            # Feature Breakdown
            feat = feature or "other"
            if feat not in self.feature_breakdown:
                self.feature_breakdown[feat] = {
                    "requests": 0,
                    "tokens": 0,
                    "cost_inr": 0.0
                }
            self.feature_breakdown[feat]["requests"] += 1
            self.feature_breakdown[feat]["tokens"] += total
            self.feature_breakdown[feat]["cost_inr"] = round(self.feature_breakdown[feat]["cost_inr"] + cost, 4)

            # Model Breakdown
            if model not in self.model_breakdown:
                self.model_breakdown[model] = {
                    "requests": 0,
                    "tokens": 0,
                    "cost_inr": 0.0
                }
            self.model_breakdown[model]["requests"] += 1
            self.model_breakdown[model]["tokens"] += total
            self.model_breakdown[model]["cost_inr"] = round(self.model_breakdown[model]["cost_inr"] + cost, 4)

            # Log item
            log_entry = {
                "id": eff_request_id,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "feature": feat,
                "model": model,
                "provider": eff_provider,
                "user_id": eff_user_id,
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": total,
                "cost_inr": cost,
                "status": "SUCCESS" if success else "FAILED",
                "latency_ms": latency_ms,
                "request_id": eff_request_id
            }
            self.recent_logs.append(log_entry)
            if len(self.recent_logs) > 60:
                self.recent_logs.pop(0)

        # Save to disk cache
        self._save_to_disk()

        # Authoritatively persist to PostgreSQL in non-blocking fashion
        self._persist_to_postgres(log_entry)

    def get_founder_analytics(self, days: int = 30) -> Dict[str, Any]:
        """Queries daily summary analytics from PostgreSQL view or falls back to in-memory stats."""
        try:
            try:
                from database import get_db_cursor
            except ImportError:
                from backend.database import get_db_cursor

            with get_db_cursor(commit=False) as cur:
                if cur:
                    cur.execute(
                        """
                        SELECT 
                            TO_CHAR(usage_date, 'YYYY-MM-DD') AS date_str,
                            provider,
                            model,
                            feature,
                            total_requests,
                            successful_requests,
                            failed_requests,
                            total_input_tokens,
                            total_output_tokens,
                            total_tokens,
                            total_cost_inr,
                            avg_latency_ms
                        FROM public.ai_usage_daily_summary
                        WHERE usage_date >= NOW() - (INTERVAL '1 day' * %s)
                        ORDER BY usage_date DESC
                        """,
                        (int(days),)
                    )
                    rows = cur.fetchall()
                    if rows:
                        results = []
                        for r in rows:
                            results.append({
                                "date": r[0],
                                "provider": r[1],
                                "model": r[2],
                                "feature": r[3],
                                "total_requests": r[4],
                                "successful_requests": r[5],
                                "failed_requests": r[6],
                                "total_input_tokens": r[7],
                                "total_output_tokens": r[8],
                                "total_tokens": r[9],
                                "total_cost_inr": float(r[10]),
                                "avg_latency_ms": float(r[11])
                            })
                        return {"source": "database", "daily_summary": results}
        except Exception as e:
            logger.warning(f"Could not load founder analytics from PostgreSQL: {e}")

        return {"source": "memory", "stats": self.get_stats()}

    def get_user_analytics(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Fetches total tokens and estimated cost for a specific authenticated user."""
        try:
            try:
                from database import get_db_cursor
            except ImportError:
                from backend.database import get_db_cursor

            with get_db_cursor(commit=False) as cur:
                if cur:
                    cur.execute(
                        """
                        SELECT 
                            COUNT(*) AS total_requests,
                            COALESCE(SUM(total_tokens), 0) AS total_tokens,
                            COALESCE(SUM(estimated_cost_inr), 0) AS total_cost_inr
                        FROM public.ai_usage_logs
                        WHERE user_id = %s
                          AND created_at >= NOW() - (INTERVAL '1 day' * %s)
                        """,
                        (user_id, int(days))
                    )
                    row = cur.fetchone()
                    if row:
                        return {
                            "user_id": user_id,
                            "total_requests": row[0],
                            "total_tokens": row[1],
                            "total_cost_inr": float(row[2])
                        }
        except Exception as e:
            logger.warning(f"Could not query user analytics for {user_id}: {e}")

        return {"user_id": user_id, "total_requests": 0, "total_tokens": 0, "total_cost_inr": 0.0}

    def get_stats(self) -> Dict[str, Any]:
        return {
            "total_requests": self.total_requests,
            "successful_requests": self.successful_requests,
            "failed_requests": self.failed_requests,
            "total_prompt_tokens": self.total_prompt_tokens,
            "total_completion_tokens": self.total_completion_tokens,
            "total_tokens": self.total_tokens,
            "total_cost_inr": round(self.total_cost_inr, 2),
            "feature_breakdown": self.feature_breakdown,
            "model_breakdown": self.model_breakdown,
            "recent_logs": list(reversed(self.recent_logs[-30:])),
            "active_model_override": self.active_model_override
        }

    def set_active_model(self, model_name: Optional[str]):
        self.active_model_override = model_name
        self._save_to_disk()

    def reset_stats(self):
        with self._lock:
            self.total_requests = 0
            self.successful_requests = 0
            self.failed_requests = 0
            self.total_prompt_tokens = 0
            self.total_completion_tokens = 0
            self.total_tokens = 0
            self.total_cost_inr = 0.0
            self.feature_breakdown = {}
            self.model_breakdown = {}
            self.recent_logs = []
            self.active_model_override = None
            self._processed_request_ids.clear()
        self._save_to_disk()

usage_tracker = UsageTracker()
