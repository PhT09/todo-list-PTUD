from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base
from .tag import todo_tags


class Todo(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    is_done = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Level 5: Data Ownership
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Level 6: Deadline
    due_date = Column(DateTime, nullable=True)

    # Level 6: Tags (Many-to-Many)
    tags = relationship("Tag", secondary=todo_tags, back_populates="todos", lazy="joined")
