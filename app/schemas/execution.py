from pydantic import BaseModel


class AIConfig(BaseModel):
    provider: str = "ollama"
    model: str = "llama3.2"
    base_url: str | None = "http://127.0.0.1:11434"
    api_key: str | None = None


class ExecutionCreate(BaseModel):
    session_id: str
    language: str
    code: str
    stdin_input: str | None = None
    ai_config: AIConfig | None = None


class ExecutionResponse(BaseModel):
    id: int
    session_id: str
    language: str
    code: str
    stdin_input: str | None
    status: str
    stdout: str | None
    stderr: str | None
    exit_code: int | None
    llm_explanation: str | None = None

    class Config:
        from_attributes = True
