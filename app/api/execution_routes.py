from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.ai import (
    AIChatRequest,
    AIChatResponse,
    AIConnectionTestRequest,
    AIConnectionTestResponse,
)
from app.schemas.execution import ExecutionCreate, ExecutionResponse
from app.services.execution_service import create_execution, get_execution, list_executions
from app.services.llm_service import (
    answer_general_question,
    stream_general_question,
    test_ai_connection,
)


router = APIRouter(prefix="/executions", tags=["Executions"])


@router.post("/", response_model=ExecutionResponse)
def create_execution_api(
    payload: ExecutionCreate,
    db: Session = Depends(get_db)
):
    return create_execution(db, payload)


@router.get("/", response_model=list[ExecutionResponse])
def list_executions_api(
    session_id: str,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    return list_executions(db, session_id=session_id, limit=limit)


@router.get("/{execution_id}", response_model=ExecutionResponse)
def get_execution_api(
    execution_id: int,
    db: Session = Depends(get_db)
):
    execution = get_execution(db, execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    return execution


@router.post("/ai/chat", response_model=AIChatResponse)
def ai_chat(payload: AIChatRequest):
    try:
        answer = answer_general_question(
            question=payload.question,
            ai_config=payload.ai_config,
            context=payload.context,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return AIChatResponse(answer=answer)


@router.post("/ai/chat/stream")
def ai_chat_stream(payload: AIChatRequest):
    try:
        stream = stream_general_question(
            question=payload.question,
            ai_config=payload.ai_config,
            context=payload.context,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return StreamingResponse(stream, media_type="text/plain")


@router.post("/ai/test", response_model=AIConnectionTestResponse)
def ai_test(payload: AIConnectionTestRequest):
    try:
        message = test_ai_connection(payload.ai_config)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return AIConnectionTestResponse(
        ok=True,
        provider=payload.ai_config.provider,
        model=payload.ai_config.model,
        message=message,
    )
