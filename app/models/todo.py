from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime, timezone, date
from ..core.database import Base


def current_date():
    return datetime.now().date()


class Todo(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    is_done = Column(Boolean, default=False)

    created_at = Column(Date, default=current_date)
    updated_at = Column(Date, default=current_date, onupdate=current_date)

    # Level 5: Data Ownership
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Level 6: Deadline
    due_date = Column(Date, nullable=True)

    # Level 7: Soft Delete
    deleted_at = Column(Date, nullable=True)

    # Analytics: Completion tracking
    completed_at = Column(Date, nullable=True)
    productivity_score = Column(Float, nullable=True)

    # Priority Tag (fixed enum: Priority, Important, Necessary, Normal)
    priority = Column(String(20), default="Normal", nullable=False)
