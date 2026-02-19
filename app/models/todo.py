from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..core.database import Base


def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Todo(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    is_done = Column(Boolean, default=False)

    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Level 5: Data Ownership
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Level 6: Deadline
    due_date = Column(DateTime, nullable=True)

    # Level 7: Soft Delete
    deleted_at = Column(DateTime, nullable=True)

    # Analytics: Completion tracking
    completed_at = Column(DateTime, nullable=True)
    productivity_score = Column(Float, nullable=True)

    # Priority Tag (fixed enum: Priority, Important, Necessary, Normal)
    priority = Column(String(20), default="Normal", nullable=False)
