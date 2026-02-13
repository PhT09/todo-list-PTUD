from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from ..core.database import Base

# Many-to-Many Association Table: todos <-> tags
todo_tags = Table(
    "todo_tags",
    Base.metadata,
    Column("todo_id", Integer, ForeignKey("todos.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    color = Column(String(7), default="#6366f1")  # Hex color code
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationship
    todos = relationship("Todo", secondary=todo_tags, back_populates="tags")
