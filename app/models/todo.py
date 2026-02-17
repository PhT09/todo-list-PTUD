from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..core.database import Base
from .tag import todo_tags


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

    # Level 6: Tags (Many-to-Many)
    tags = relationship("Tag", secondary=todo_tags, back_populates="todos", lazy="joined")
