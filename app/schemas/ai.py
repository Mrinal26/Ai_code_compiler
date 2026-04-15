from pydantic import BaseModel

from app.schemas.execution import AIConfig


class AIChatRequest(BaseModel):
    question: str
    context: str | None = None
    ai_config: AIConfig


class AIChatResponse(BaseModel):
    answer: str
