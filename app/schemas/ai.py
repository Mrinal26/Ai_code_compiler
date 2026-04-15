from pydantic import BaseModel

from app.schemas.execution import AIConfig


class AIChatRequest(BaseModel):
    question: str
    context: str | None = None
    ai_config: AIConfig


class AIChatResponse(BaseModel):
    answer: str


class AIConnectionTestRequest(BaseModel):
    ai_config: AIConfig


class AIConnectionTestResponse(BaseModel):
    ok: bool
    provider: str
    model: str
    message: str
