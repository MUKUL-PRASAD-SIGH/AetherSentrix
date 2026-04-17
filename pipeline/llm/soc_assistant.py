from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


class LLMConfigurationError(RuntimeError):
    pass


class LLMAssistantError(RuntimeError):
    def __init__(self, message: str, error_type: str = "assistant_error", status_code: Optional[int] = None, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.error_type = error_type
        self.status_code = status_code
        self.details = details or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "message": self.message,
            "type": self.error_type,
            "status_code": self.status_code,
            "details": self.details,
        }


class SOCAssistant:
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        endpoint: Optional[str] = None,
    ):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.model = model or os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
        self.endpoint = endpoint or os.getenv("OPENAI_RESPONSES_URL", "https://api.openai.com/v1/responses")
        self.last_error: Optional[Dict[str, Any]] = None
        self.last_success_at: Optional[str] = None

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def get_health(self) -> Dict[str, Any]:
        return {
            "configured": self.is_configured(),
            "model": self.model,
            "endpoint": self.endpoint,
            "api_key_present": bool(self.api_key),
            "last_success_at": self.last_success_at,
            "last_error": self.last_error,
        }

    def answer_query(
        self,
        query: str,
        alert: Optional[Dict[str, Any]] = None,
        alerts: Optional[List[Dict[str, Any]]] = None,
        system_context: Optional[str] = None,
    ) -> Dict[str, Any]:
        if not self.is_configured():
            raise LLMConfigurationError("OPENAI_API_KEY is not configured.")

        prompt = self._build_prompt(query=query, alert=alert, alerts=alerts, system_context=system_context)
        payload = {
            "model": self.model,
            "input": prompt,
            "max_output_tokens": 500,
        }

        response = self._post_json(payload)
        self.last_error = None
        self.last_success_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        return {
            "model": self.model,
            "answer": self._extract_output_text(response),
            "raw_response_id": response.get("id"),
        }

    def _build_prompt(
        self,
        query: str,
        alert: Optional[Dict[str, Any]],
        alerts: Optional[List[Dict[str, Any]]],
        system_context: Optional[str],
    ) -> str:
        context_blocks = []
        if system_context:
            context_blocks.append(f"System context:\n{system_context}")
        if alert:
            context_blocks.append("Single alert context:\n" + json.dumps(alert, indent=2))
        if alerts:
            context_blocks.append("Recent alerts context:\n" + json.dumps(alerts[-10:], indent=2))

        instructions = (
            "You are an enterprise SOC assistant for AetherSentrix. "
            "Answer as a security analyst assistant. Be concise, factual, and action-oriented. "
            "When enough context exists, explain the likely threat, confidence, impact, MITRE mapping, "
            "and recommended next steps. If context is missing, say what is missing."
        )

        prompt_parts = [instructions]
        if context_blocks:
            prompt_parts.append("\n\n".join(context_blocks))
        prompt_parts.append(f"User query:\n{query}")
        return "\n\n".join(prompt_parts)

    def _post_json(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        request = urllib.request.Request(
            self.endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            translated = self._translate_http_error(exc.code, body)
            self.last_error = translated.to_dict()
            raise translated from exc
        except urllib.error.URLError as exc:
            translated = LLMAssistantError(
                message="The assistant could not reach the OpenAI API from this environment.",
                error_type="connection_error",
                details={
                    "technical_reason": str(exc.reason),
                    "suggested_action": "Check firewall, proxy, or sandbox network permissions and retry.",
                },
            )
            self.last_error = translated.to_dict()
            raise translated from exc

    def _translate_http_error(self, status_code: int, body: str) -> LLMAssistantError:
        parsed = self._safe_parse_json(body)
        error = parsed.get("error", {}) if isinstance(parsed, dict) else {}
        error_code = error.get("code")
        error_type = error.get("type", "http_error")
        upstream_message = error.get("message", body)

        if status_code == 401:
            return LLMAssistantError(
                message="The assistant could not authenticate with OpenAI.",
                error_type="authentication_error",
                status_code=status_code,
                details={
                    "upstream_message": upstream_message,
                    "suggested_action": "Check that OPENAI_API_KEY is valid and belongs to the expected project.",
                },
            )

        if status_code == 429 and error_code == "insufficient_quota":
            return LLMAssistantError(
                message="The assistant is configured, but the OpenAI project has no usable quota right now.",
                error_type="insufficient_quota",
                status_code=status_code,
                details={
                    "upstream_message": upstream_message,
                    "suggested_action": "Verify billing, credits, project selection, and key ownership in the OpenAI platform, then retry.",
                },
            )

        if status_code == 429:
            return LLMAssistantError(
                message="The assistant hit an OpenAI rate limit.",
                error_type="rate_limit",
                status_code=status_code,
                details={
                    "upstream_message": upstream_message,
                    "suggested_action": "Wait briefly and retry, or reduce request volume.",
                },
            )

        return LLMAssistantError(
            message="The assistant request failed upstream.",
            error_type=error_type,
            status_code=status_code,
            details={
                "upstream_message": upstream_message,
                "suggested_action": "Retry the request. If it continues, inspect the upstream OpenAI error details.",
            },
        )

    def _safe_parse_json(self, value: str) -> Dict[str, Any]:
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            return {}

    def _extract_output_text(self, response: Dict[str, Any]) -> str:
        output_text = response.get("output_text")
        if output_text:
            return output_text

        for item in response.get("output", []):
            for content in item.get("content", []):
                text = content.get("text")
                if text:
                    return text

        return "No assistant output returned."
