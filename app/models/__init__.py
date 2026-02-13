# Import all models here so Alembic can detect them
from ..core.database import Base
from .user import User
from .todo import Todo
from .tag import Tag, todo_tags
