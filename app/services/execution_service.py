from sqlalchemy.orm import Session

from app.executors.python_executor import run_python_code
from app.models.execution import Execution
from app.schemas.execution import ExecutionCreate
from app.services.llm_service import explain_code_result


def create_execution(db: Session, payload: ExecutionCreate) -> Execution:
    execution = Execution(
        session_id=payload.session_id,
        language=payload.language,
        code=payload.code,
        stdin_input=payload.stdin_input,
        status="running",
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)

    if payload.language.lower() == "python":
        result = run_python_code(payload.code, payload.stdin_input)
    else:
        result = {
            "status": "failed",
            "stdout": "",
            "stderr": f"Language '{payload.language}' is not supported yet",
            "exit_code": -1,
        }

    execution.status = result["status"]
    execution.stdout = result["stdout"]
    execution.stderr = result["stderr"]
    execution.exit_code = result["exit_code"]

    try:
        execution.llm_explanation = explain_code_result(
            language=execution.language,
            code=execution.code,
            stdout=execution.stdout,
            stderr=execution.stderr,
            exit_code=execution.exit_code,
            ai_config=payload.ai_config,
        )
    except Exception as exc:
        execution.llm_explanation = f"LLM explanation failed: {exc}"

    db.commit()
    db.refresh(execution)

    return execution


def get_execution(db: Session, execution_id: int) -> Execution | None:
    return db.query(Execution).filter(Execution.id == execution_id).first()


def list_executions(
    db: Session,
    session_id: str,
    limit: int = 10,
) -> list[Execution]:
    return (
        db.query(Execution)
        .filter(Execution.session_id == session_id)
        .order_by(Execution.id.desc())
        .limit(limit)
        .all()
    )
