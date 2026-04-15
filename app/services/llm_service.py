import json
from urllib import error, request

import ollama

from app.core.config import settings
from app.schemas.execution import AIConfig


OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def _chat_with_ollama(prompt: str, ai_config: AIConfig) -> str:
    client = ollama.Client(host=ai_config.base_url or "http://127.0.0.1:11434")
    response = client.chat(
        model=ai_config.model or settings.ollama_model,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
    )
    return response["message"]["content"]


def _chat_with_openrouter(prompt: str, ai_config: AIConfig) -> str:
    if not ai_config.api_key:
        raise ValueError("OpenRouter API key is required.")

    payload = json.dumps(
        {
            "model": ai_config.model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        }
    ).encode("utf-8")

    headers = {
        "Authorization": f"Bearer {ai_config.api_key}",
        "Content-Type": "application/json",
    }

    req = request.Request(OPENROUTER_URL, data=payload, headers=headers, method="POST")

    try:
        with request.urlopen(req, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="ignore")
        raise ValueError(f"OpenRouter request failed: {details or exc.reason}") from exc

    return data["choices"][0]["message"]["content"]


def _chat_with_groq(prompt: str, ai_config: AIConfig) -> str:
    if not ai_config.api_key:
        raise ValueError("Groq API key is required.")

    payload = json.dumps(
        {
            "model": ai_config.model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        }
    ).encode("utf-8")

    headers = {
        "Authorization": f"Bearer {ai_config.api_key}",
        "Content-Type": "application/json",
    }

    req = request.Request(GROQ_URL, data=payload, headers=headers, method="POST")

    try:
        with request.urlopen(req, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="ignore")
        raise ValueError(f"Groq request failed: {details or exc.reason}") from exc

    return data["choices"][0]["message"]["content"]


def _run_prompt(prompt: str, ai_config: AIConfig | None) -> str:
    config = ai_config or AIConfig(model=settings.ollama_model)
    provider = config.provider.lower()

    if provider == "ollama":
        return _chat_with_ollama(prompt, config)

    if provider == "openrouter":
        return _chat_with_openrouter(prompt, config)

    if provider == "groq":
        return _chat_with_groq(prompt, config)

    raise ValueError(f"Unsupported AI provider: {config.provider}")


def explain_code_result(
    language: str,
    code: str,
    stdout: str | None,
    stderr: str | None,
    exit_code: int | None,
    ai_config: AIConfig | None = None,
) -> str:
    prompt = f"""
You are a beginner-friendly coding assistant.

A user ran this {language} code.

Code:
{code}

stdout:
{stdout or ""}

stderr:
{stderr or ""}

exit code:
{exit_code}

Explain:
1. What happened
2. Whether the code succeeded or failed
3. If it failed, what the error means in simple beginner-friendly language
4. Suggest a possible fix

Keep the answer simple and clear.
"""

    return _run_prompt(prompt, ai_config)


def answer_general_question(
    question: str,
    ai_config: AIConfig,
    context: str | None = None,
) -> str:
    prompt = f"""
You are a clear, practical AI coding assistant inside a code sandbox.

Context:
{context or "No additional context provided."}

User question:
{question}

Answer in a helpful, direct style. If the question is about code, explain it in a beginner-friendly way.
"""

    return _run_prompt(prompt, ai_config)


def test_ai_connection(ai_config: AIConfig) -> str:
    prompt = "Reply with a short one-line confirmation that the AI connection is working."
    return _run_prompt(prompt, ai_config)
