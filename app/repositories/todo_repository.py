from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, func
from fastapi import Depends
from datetime import datetime, date, timezone

from ..models.todo import Todo
from ..schemas.todo import TodoCreate, TodoUpdate
from ..core.database import get_db


class TodoRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(
        self,
        owner_id: int,
        skip: int = 0,
        limit: int = 10,
        q: Optional[str] = None,
        is_done: Optional[bool] = None,
        sort_desc: bool = True,
        priority: Optional[str] = None,
    ) -> tuple[List[Todo], int]:

        # Always filter by owner and active status (not deleted)
        query = self.db.query(Todo).filter(
            Todo.owner_id == owner_id,
            Todo.deleted_at == None
        )

        if is_done is not None:
            query = query.filter(Todo.is_done == is_done)

        if q:
            query = query.filter(Todo.title.ilike(f"%{q}%"))

        if priority is not None:
            query = query.filter(Todo.priority == priority)

        # Sort
        if sort_desc:
            query = query.order_by(desc(Todo.created_at))
        else:
            query = query.order_by(Todo.created_at)

        total = query.count()
        items = query.offset(skip).limit(limit).all()

        return items, total

    def get_overdue(self, owner_id: int) -> List[Todo]:
        """Tasks past their due_date and NOT completed."""
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        return self.db.query(Todo).filter(
            Todo.owner_id == owner_id,
            Todo.is_done == False,
            Todo.due_date != None,
            Todo.due_date < now,
            Todo.deleted_at == None
        ).order_by(Todo.due_date).all()

    def get_today(self, owner_id: int) -> List[Todo]:
        """Tasks due today (any time within the calendar day)."""
        today = date.today()
        return self.db.query(Todo).filter(
            Todo.owner_id == owner_id,
            func.date(Todo.due_date) == today,
            Todo.deleted_at == None
        ).order_by(Todo.due_date).all()

    def get_by_id(self, todo_id: int, owner_id: int, include_deleted: bool = False) -> Optional[Todo]:
        query = self.db.query(Todo).filter(Todo.id == todo_id, Todo.owner_id == owner_id)
        if not include_deleted:
            query = query.filter(Todo.deleted_at == None)
        return query.first()

    def create(self, todo_data: TodoCreate, owner_id: int) -> Todo:
        new_todo = Todo(
            title=todo_data.title,
            description=todo_data.description,
            is_done=todo_data.is_done,
            due_date=todo_data.due_date,
            priority=todo_data.priority.value if todo_data.priority else "Normal",
            owner_id=owner_id,
        )
        self.db.add(new_todo)
        self.db.commit()
        self.db.refresh(new_todo)
        return new_todo

    def update(self, todo_id: int, todo_update: TodoUpdate, owner_id: int) -> Optional[Todo]:
        db_todo = self.get_by_id(todo_id, owner_id)
        if not db_todo:
            return None

        update_data = todo_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if key == "priority" and value is not None:
                setattr(db_todo, key, value.value if hasattr(value, 'value') else value)
            else:
                setattr(db_todo, key, value)

        self.db.commit()
        self.db.refresh(db_todo)
        return db_todo

    def delete(self, todo_id: int, owner_id: int) -> bool:
        """Soft delete a todo."""
        db_todo = self.get_by_id(todo_id, owner_id)
        if not db_todo:
            return False

        db_todo.deleted_at = datetime.now(timezone.utc).replace(tzinfo=None)
        self.db.commit()
        return True

    def restore(self, todo_id: int, owner_id: int) -> bool:
        """Restore a soft-deleted todo."""
        db_todo = self.get_by_id(todo_id, owner_id, include_deleted=True)
        if not db_todo or db_todo.deleted_at is None:
            return False

        db_todo.deleted_at = None
        self.db.commit()
        return True

    def permanent_delete(self, todo_id: int, owner_id: int) -> bool:
        """Permanently remove a todo."""
        db_todo = self.get_by_id(todo_id, owner_id, include_deleted=True)
        if not db_todo:
            return False

        self.db.delete(db_todo)
        self.db.commit()
        return True

    def get_deleted_todos(self, owner_id: int) -> List[Todo]:
        """Get all soft-deleted todos."""
        return self.db.query(Todo).filter(
            Todo.owner_id == owner_id,
            Todo.deleted_at != None
        ).order_by(desc(Todo.deleted_at)).all()

    def delete_completed(self, owner_id: int) -> int:
        """Delete all completed todos for the owner. Returns count of deleted items."""
        count = self.db.query(Todo).filter(
            Todo.owner_id == owner_id,
            Todo.is_done == True,
            Todo.deleted_at == None
        ).delete()
        self.db.commit()
        return count


# Dependency Injection Helper
def get_todo_repo(db: Session = Depends(get_db)) -> TodoRepository:
    return TodoRepository(db)
