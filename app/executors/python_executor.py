import os
import subprocess
import sys
import tempfile
from pathlib import Path


EXECUTION_TIMEOUT_SECONDS = 5
MAX_OUTPUT_CHARS = 12000
SAFE_ENV_KEYS = {
    "PATH",
    "SYSTEMROOT",
    "WINDIR",
    "TEMP",
    "TMP",
}


def _trim_output(output: str) -> str:
    if len(output) <= MAX_OUTPUT_CHARS:
        return output

    return (
        output[:MAX_OUTPUT_CHARS]
        + "\n\n[output truncated because it exceeded the sandbox limit]"
    )


def _build_safe_env(workspace: Path) -> dict[str, str]:
    safe_env = {
        key: value
        for key, value in os.environ.items()
        if key.upper() in SAFE_ENV_KEYS
    }
    safe_env["PYTHONIOENCODING"] = "utf-8"
    safe_env["PYTHONDONTWRITEBYTECODE"] = "1"
    safe_env["PYTHONUNBUFFERED"] = "1"
    safe_env["EXECUTION_WORKSPACE"] = str(workspace)
    return safe_env


def run_python_code(code: str, stdin_input: str | None = None) -> dict:
    try:
        with tempfile.TemporaryDirectory(prefix="compiler-bot-") as workspace_dir:
            workspace = Path(workspace_dir)
            script_path = workspace / "main.py"
            script_path.write_text(code, encoding="utf-8")

            result = subprocess.run(
                [sys.executable, str(script_path)],
                input=stdin_input or "",
                capture_output=True,
                text=True,
                timeout=EXECUTION_TIMEOUT_SECONDS,
                cwd=workspace,
                env=_build_safe_env(workspace),
            )

            return {
                "status": "completed" if result.returncode == 0 else "failed",
                "stdout": _trim_output(result.stdout),
                "stderr": _trim_output(result.stderr),
                "exit_code": result.returncode,
            }

    except subprocess.TimeoutExpired:
        return {
            "status": "failed",
            "stdout": "",
            "stderr": (
                f"Execution timed out after {EXECUTION_TIMEOUT_SECONDS} seconds."
            ),
            "exit_code": -1,
        }

    except Exception as exc:
        return {
            "status": "failed",
            "stdout": "",
            "stderr": str(exc),
            "exit_code": -1,
        }
