import os
import re
import json
import logging
from typing import Dict, Any, List, Optional
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
logger = logging.getLogger("LLMEngine")

try:
    from groq import Groq
except ImportError:
    Groq = None

# Groq models in order of capability & speed
FALLBACK_MODELS = [
    "openai/gpt-oss-120b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "llama3-70b-8192",
    "mixtral-8x7b-32768"
]

class LLMEngine:
    def __init__(self):
        self._client: Optional[Any] = None

    @property
    def api_key(self) -> str:
        key = (
            os.getenv("GROQ_API_KEY") or
            os.getenv("GROQ_KEY") or
            ""
        ).strip()
        return key

    @property
    def model(self) -> str:
        configured = os.getenv("GROQ_MODEL", "").strip()
        return configured or "openai/gpt-oss-120b"

    def is_available(self) -> bool:
        """Returns True if Groq SDK is installed and a valid non-empty GROQ_API_KEY is configured."""
        return bool(self.api_key and len(self.api_key) > 8 and Groq is not None)

    def is_external_llm_available(self) -> bool:
        """Backward-compatibility alias for health check."""
        return self.is_available()

    def get_client(self) -> Any:
        """Returns an authenticated Groq client instance with timeout protection."""
        if not self.is_available():
            return None
        try:
            return Groq(api_key=self.api_key, timeout=30.0)
        except Exception as e:
            logger.error(f"Error initializing Groq client: {e}")
            return None

    @staticmethod
    def _clean_json_text(text: str) -> str:
        """Strips markdown code blocks, backticks, and extraneous whitespace."""
        clean = text.strip()
        # Remove ```json ... ``` or ``` ... ```
        if "```" in clean:
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", clean, re.IGNORECASE)
            if match:
                clean = match.group(1).strip()
        # In case there's leading/trailing non-json content, find first { and last }
        start_idx = clean.find("{")
        end_idx = clean.rfind("}")
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            clean = clean[start_idx : end_idx + 1]
        return clean.strip()

    def generate(
        self,
        prompt: str = "",
        system_instruction: str = "",
        temperature: float = 0.6,
        messages: Optional[List[Dict[str, str]]] = None,
        json_mode: bool = False,
        model_override: Optional[str] = None
    ) -> Optional[str]:
        """Calls Groq Chat Completions API with strict 30s timeout and model fallback."""
        if not self.is_available():
            logger.warning("Groq API key not configured or Groq SDK unavailable.")
            return None

        client = self.get_client()
        if not client:
            return None

        call_messages: List[Dict[str, str]] = []
        if messages:
            call_messages.extend(messages)
        else:
            if system_instruction:
                call_messages.append({"role": "system", "content": system_instruction})
            if prompt:
                call_messages.append({"role": "user", "content": prompt})

        # When json_mode is requested, ensure prompt instructs JSON
        if json_mode and not any("json" in m.get("content", "").lower() for m in call_messages):
            call_messages.append({"role": "system", "content": "You MUST respond with valid JSON only."})

        target_models = [model_override] if model_override else [self.model] + [m for m in FALLBACK_MODELS if m != self.model]

        for current_model in target_models:
            try:
                kwargs: Dict[str, Any] = {
                    "model": current_model,
                    "messages": call_messages,
                    "temperature": temperature,
                    "timeout": 30.0
                }
                if json_mode:
                    kwargs["response_format"] = {"type": "json_object"}

                response = client.chat.completions.create(**kwargs)
                if response and response.choices and len(response.choices) > 0:
                    content = response.choices[0].message.content
                    if content:
                        return content
            except Exception as e:
                logger.warning(f"Groq API call error with model {current_model}: {e}")
                # Try next model in fallback list if model-specific error
                continue

        return None

    def generate_json(
        self,
        prompt: str = "",
        system_instruction: str = "",
        temperature: float = 0.5,
        messages: Optional[List[Dict[str, str]]] = None,
        max_retries: int = 2
    ) -> Optional[Dict[str, Any]]:
        """
        Executes a Groq chat completion in JSON mode and parses the response.
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
                json_mode=True
            )
            if raw_text:
                try:
                    cleaned = self._clean_json_text(raw_text)
                    data = json.loads(cleaned)
                    if isinstance(data, dict):
                        return data
                    logger.warning(f"Groq output was not a JSON dict on attempt {attempt + 1}: {type(data)}")
                except Exception as parse_err:
                    logger.warning(f"JSON parse failed on attempt {attempt + 1}: {parse_err}. Raw text: {raw_text[:200]}")
            else:
                logger.warning(f"Groq returned empty response on attempt {attempt + 1}")

        return None


llm_engine = LLMEngine()
