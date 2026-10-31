import os
import re
import json
import time
import logging
from typing import Dict, Any, List, Optional
import requests
from dotenv import load_dotenv

load_dotenv()

# Also load from root and frontend env files including .env.local overrides
env_candidates = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env.local")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", ".env")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", ".env.local")),
]
for p in env_candidates:
    if os.path.exists(p):
        load_dotenv(p, override=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("UniversalLLMEngine")

try:
    from groq import Groq
except ImportError:
    Groq = None

PROVIDER_FALLBACKS = {
    "groq": [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "openai/gpt-oss-120b",
        "llama3-70b-8192",
        "mixtral-8x7b-32768"
    ],
    "google": [
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-pro"
    ],
    "openai": [
        "gpt-4o-mini",
        "gpt-4o",
        "o3-mini"
    ],
    "openrouter": [
        "deepseek/deepseek-chat",
        "deepseek/deepseek-r1",
        "meta-llama/llama-3.3-70b-instruct"
    ],
    "custom": [
        "default"
    ]
}

FALLBACK_MODELS = PROVIDER_FALLBACKS["groq"]

class LLMEngine:
    def __init__(self):
        self._groq_client: Optional[Any] = None
        self._last_env_check: float = 0.0
        self._root_env_mtime: float = 0.0

    @property
    def provider(self) -> str:
        """
        Determines the active AI provider.
        Auto-detects from environment keys unless AI_PROVIDER is explicitly set.
        """
        explicit = (os.getenv("AI_PROVIDER") or os.getenv("LLM_PROVIDER") or "").strip().lower()
        if explicit in ["groq", "google", "gemini", "openai", "openrouter", "custom"]:
            return "google" if explicit == "gemini" else explicit

        # Auto-detection by configured keys
        if os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"):
            return "google"
        if os.getenv("OPENAI_API_KEY"):
            return "openai"
        if os.getenv("OPENROUTER_API_KEY"):
            return "openrouter"
        if os.getenv("CUSTOM_API_KEY") and os.getenv("CUSTOM_BASE_URL"):
            return "custom"
        if os.getenv("GROQ_API_KEY") or os.getenv("GROQ_KEY"):
            return "groq"

        return "groq"

    @property
    def provider_display_name(self) -> str:
        names = {
            "google": "Google Gemini",
            "groq": "Groq LPU",
            "openai": "OpenAI",
            "openrouter": "OpenRouter",
            "custom": "Custom AI Endpoint"
        }
        return names.get(self.provider, "Universal AI")

    @property
    def api_key(self) -> str:
        p = self.provider
        if p == "google":
            return (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or os.getenv("AI_API_KEY") or "").strip()
        elif p == "openai":
            return (os.getenv("OPENAI_API_KEY") or os.getenv("AI_API_KEY") or "").strip()
        elif p == "openrouter":
            return (os.getenv("OPENROUTER_API_KEY") or os.getenv("AI_API_KEY") or "").strip()
        elif p == "custom":
            return (os.getenv("CUSTOM_API_KEY") or os.getenv("AI_API_KEY") or "").strip()
        else:
            return (os.getenv("GROQ_API_KEY") or os.getenv("GROQ_KEY") or os.getenv("AI_API_KEY") or "").strip()

    @property
    def model(self) -> str:
        # Throttle .env inspection to once every 60 seconds using mtime caching to eliminate event-loop disk I/O bottlenecks
        now = time.time()
        if now - self._last_env_check > 60:
            self._last_env_check = now
            root_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
            try:
                if os.path.exists(root_env):
                    mtime = os.path.getmtime(root_env)
                    if mtime > self._root_env_mtime:
                        self._root_env_mtime = mtime
                        load_dotenv(root_env, override=True)
            except Exception:
                pass

        generic_model = os.getenv("AI_MODEL", "").strip()
        if generic_model:
            return generic_model

        p = self.provider
        if p == "google":
            env_m = os.getenv("GEMINI_MODEL") or os.getenv("GOOGLE_MODEL")
            if env_m: return env_m.strip()
        elif p == "openai":
            env_m = os.getenv("OPENAI_MODEL")
            if env_m: return env_m.strip()
        elif p == "openrouter":
            env_m = os.getenv("OPENROUTER_MODEL")
            if env_m: return env_m.strip()
        elif p == "custom":
            env_m = os.getenv("CUSTOM_MODEL")
            if env_m: return env_m.strip()
        else:
            env_m = os.getenv("GROQ_MODEL")
            if env_m: return env_m.strip()

        try:
            from services.usage_tracker import usage_tracker
            if usage_tracker.active_model_override:
                return usage_tracker.active_model_override
        except Exception:
            pass

        defaults = {
            "google": "gemini-2.0-flash",
            "openai": "gpt-4o-mini",
            "openrouter": "deepseek/deepseek-chat",
            "custom": "default",
            "groq": "openai/gpt-oss-120b"
        }
        return defaults.get(p, "openai/gpt-oss-120b")

    @property
    def available_models(self) -> List[str]:
        return PROVIDER_FALLBACKS.get(self.provider, PROVIDER_FALLBACKS["groq"])

    def is_available(self) -> bool:
        """Returns True if a valid non-empty API key is configured for the active provider."""
        return bool(self.api_key and len(self.api_key) > 6)

    def is_external_llm_available(self) -> bool:
        return self.is_available()

    def get_client(self) -> Any:
        """Backward compatibility for Groq client."""
        if self.provider == "groq" and self.is_available() and Groq:
            if not self._groq_client:
                try:
                    self._groq_client = Groq(api_key=self.api_key, timeout=30.0)
                except Exception as e:
                    logger.error(f"Error initializing Groq client: {e}")
            return self._groq_client
        return None

    @staticmethod
    def _clean_json_text(text: str) -> str:
        """Strips markdown code blocks, backticks, and extraneous whitespace."""
        clean = text.strip()
        if "```" in clean:
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", clean, re.IGNORECASE)
            if match:
                clean = match.group(1).strip()
        start_idx = clean.find("{")
        end_idx = clean.rfind("}")
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            clean = clean[start_idx : end_idx + 1]
        return clean.strip()

    def _get_api_endpoint(self) -> str:
        p = self.provider
        if p == "google":
            return "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
        elif p == "openai":
            return "https://api.openai.com/v1/chat/completions"
        elif p == "openrouter":
            return "https://openrouter.ai/api/v1/chat/completions"
        elif p == "custom":
            return os.getenv("CUSTOM_BASE_URL", "http://localhost:11434/v1/chat/completions")
        else:
            return "https://api.groq.com/openai/v1/chat/completions"

    def generate(
        self,
        prompt: str = "",
        system_instruction: str = "",
        temperature: float = 0.6,
        messages: Optional[List[Dict[str, str]]] = None,
        json_mode: bool = False,
        model_override: Optional[str] = None,
        feature: str = "general",
        user_id: Optional[str] = None,
        request_id: Optional[str] = None
    ) -> Optional[str]:
        """
        Universal completion handler supporting Google Gemini, Groq, OpenAI,
        OpenRouter, and custom OpenAI-compatible endpoints with automatic retry & fallback.
        """
        if not self.is_available():
            logger.warning(f"AI API key not configured for provider: {self.provider}")
            return None

        call_messages: List[Dict[str, str]] = []
        if messages:
            call_messages.extend(messages)
        else:
            if system_instruction:
                call_messages.append({"role": "system", "content": system_instruction})
            if prompt:
                call_messages.append({"role": "user", "content": prompt})

        if json_mode and not any("json" in m.get("content", "").lower() for m in call_messages):
            call_messages.append({"role": "system", "content": "You MUST respond with valid JSON only."})

        provider_fallbacks = self.available_models
        target_models = [model_override] if model_override else [self.model] + [m for m in provider_fallbacks if m != self.model]

        from services.usage_tracker import usage_tracker
        start_t = time.time()
        endpoint = self._get_api_endpoint()

        # If Groq SDK is installed and provider is groq, we can use Groq SDK
        groq_client = self.get_client() if self.provider == "groq" else None

        for current_model in target_models:
            try:
                if groq_client:
                    # Native Groq SDK path
                    kwargs: Dict[str, Any] = {
                        "model": current_model,
                        "messages": call_messages,
                        "temperature": temperature,
                        "timeout": 30.0
                    }
                    if json_mode:
                        kwargs["response_format"] = {"type": "json_object"}

                    response = groq_client.chat.completions.create(**kwargs)
                    if response and response.choices and len(response.choices) > 0:
                        content = response.choices[0].message.content
                        if content:
                            latency_ms = int((time.time() - start_t) * 1000)
                            usage_obj = getattr(response, "usage", None)
                            p_toks = getattr(usage_obj, "prompt_tokens", len(str(call_messages)) // 4)
                            c_toks = getattr(usage_obj, "completion_tokens", len(content) // 4)
                            usage_tracker.record_usage(
                                feature=feature,
                                model=current_model,
                                prompt_tokens=p_toks,
                                completion_tokens=c_toks,
                                success=True,
                                latency_ms=latency_ms,
                                user_id=user_id,
                                provider="groq",
                                request_id=request_id
                            )
                            return content
                else:
                    # Universal OpenAI-compatible HTTP POST path (Google Gemini, OpenAI, OpenRouter, Custom)
                    headers = {
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    }
                    if self.provider == "openrouter":
                        headers["HTTP-Referer"] = "https://careeros.app"
                        headers["X-Title"] = "CareerOS"

                    payload: Dict[str, Any] = {
                        "model": current_model,
                        "messages": call_messages,
                        "temperature": temperature
                    }
                    if json_mode:
                        payload["response_format"] = {"type": "json_object"}

                    resp = requests.post(endpoint, headers=headers, json=payload, timeout=35.0)
                    if resp.status_code == 200:
                        data = resp.json()
                        choices = data.get("choices", [])
                        if choices and len(choices) > 0:
                            content = choices[0].get("message", {}).get("content", "")
                            if content:
                                latency_ms = int((time.time() - start_t) * 1000)
                                usage_dict = data.get("usage", {})
                                p_toks = usage_dict.get("prompt_tokens", len(str(call_messages)) // 4)
                                c_toks = usage_dict.get("completion_tokens", len(content) // 4)
                                usage_tracker.record_usage(
                                    feature=feature,
                                    model=current_model,
                                    prompt_tokens=p_toks,
                                    completion_tokens=c_toks,
                                    success=True,
                                    latency_ms=latency_ms,
                                    user_id=user_id,
                                    provider=self.provider,
                                    request_id=request_id
                                )
                                return content
                    else:
                        logger.warning(f"AI API ({self.provider}) HTTP {resp.status_code} with model {current_model}: {resp.text[:250]}")
            except Exception as e:
                logger.warning(f"AI call error on {self.provider} ({current_model}): {e}")
                continue

        latency_ms = int((time.time() - start_t) * 1000)
        usage_tracker.record_usage(
            feature=feature,
            model=target_models[0] if target_models else "unknown",
            prompt_tokens=len(str(call_messages)) // 4,
            completion_tokens=0,
            success=False,
            latency_ms=latency_ms,
            user_id=user_id,
            provider=self.provider,
            request_id=request_id
        )
        return None

    def generate_json(
        self,
        prompt: str = "",
        system_instruction: str = "",
        temperature: float = 0.5,
        messages: Optional[List[Dict[str, str]]] = None,
        max_retries: int = 2,
        feature: str = "general",
        user_id: Optional[str] = None,
        request_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Executes a completion in JSON mode and parses the response.
        If generation or parsing fails, retries up to max_retries times.
        """
        if not self.is_available():
            return None

        for attempt in range(max_retries + 1):
            raw_text = self.generate(
                prompt=prompt,
                system_instruction=system_instruction,
                temperature=temperature if attempt == 0 else 0.2,
                messages=messages,
                json_mode=True,
                feature=feature,
                user_id=user_id,
                request_id=request_id
            )
            if raw_text:
                try:
                    cleaned = self._clean_json_text(raw_text)
                    data = json.loads(cleaned)
                    if isinstance(data, dict):
                        return data
                    logger.warning(f"Output was not a JSON dict on attempt {attempt + 1}: {type(data)}")
                except Exception as parse_err:
                    logger.warning(f"JSON parse failed on attempt {attempt + 1}: {parse_err}. Raw text: {raw_text[:200]}")
            else:
                logger.warning(f"Empty AI response on attempt {attempt + 1}")

        return None

llm_engine = LLMEngine()
