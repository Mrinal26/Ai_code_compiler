from sqlalchemy import Column, DateTime, Integer, String, Text, func

from app.db.database import Base


class Execution(Base):
    __tablename__ = "executions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), index=True, nullable=False)
    language = Column(String(50), nullable=False)
    code = Column(Text, nullable=False)
    stdin_input = Column(Text, nullable=True)
    status = Column(String(50), default="pending")
    stdout = Column(Text, nullable=True)
    stderr = Column(Text, nullable=True)
    exit_code = Column(Integer, nullable=True)
    llm_explanation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
