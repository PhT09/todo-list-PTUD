from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import Depends

from ..models.todo import Todo
from ..schemas.todo import TodoCreate, TodoUpdate
from ..core.database import get_db

class TodoRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(
        self,
        skip: int = 0,
        limit: int = 10,
        q: Optional[str] = None,
        is_done: Optional[bool] = None,
        sort_desc: bool = True
    ) -> tuple[List[Todo], int]:
        
        query = self.db.query(Todo)

        if is_done is not None:
            query = query.filter(Todo.is_done == is_done)
        
        if q:
            # SQLite ilike support via like in older versions, but ilike is generally supported via SQLAlchemy dialect
            # For pure SQLite, we can use like for case-insensitive if configured, but let's assume simple like or func.lower
            # SQLAlchemy ilike compiles to `lower(a) LIKE lower(b)` usually.
            query = query.filter(Todo.title.ilike(f"%{q}%"))

        # Sort
        if sort_desc:
            query = query.order_by(desc(Todo.created_at))
        else:
            query = query.order_by(Todo.created_at)

        total = query.count()
        
        # Paginate (DB Level)
        items = query.offset(skip).limit(limit).all()

        return items, total

    def get_by_id(self, todo_id: int) -> Optional[Todo]:
        return self.db.query(Todo).filter(Todo.id == todo_id).first()

    def create(self, todo_data: TodoCreate) -> Todo:
        new_todo = Todo(
            title=todo_data.title,
            description=todo_data.description,
            is_done=todo_data.is_done
        )
        self.db.add(new_todo)
        self.db.commit()
        self.db.refresh(new_todo)
        return new_todo

    def update(self, todo_id: int, todo_update: TodoUpdate) -> Optional[Todo]:
        db_todo = self.get_by_id(todo_id)
        if not db_todo:
            return None
        
        # Only update fields that are set (exclude_unset=True)
        update_data = todo_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_todo, key, value)
        
        self.db.commit()
        self.db.refresh(db_todo)
        return db_todo

    def delete(self, todo_id: int) -> bool:
        db_todo = self.get_by_id(todo_id)
        if not db_todo:
            return False
        
        self.db.delete(db_todo)
        self.db.commit()
        return True

# Dependency Injection Helper
def get_todo_repo(db: Session = Depends(get_db)) -> TodoRepository:
    return TodoRepository(db)
