from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, func
from fastapi import Depends
from datetime import datetime, date

from ..models.todo import Todo
from ..models.tag import Tag
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
        tag_id: Optional[int] = None,
    ) -> tuple[List[Todo], int]:
        
        # Always filter by owner
        query = self.db.query(Todo).filter(Todo.owner_id == owner_id)

        if is_done is not None:
            query = query.filter(Todo.is_done == is_done)
        
        if q:
            query = query.filter(Todo.title.ilike(f"%{q}%"))

        if tag_id is not None:
            query = query.filter(Todo.tags.any(Tag.id == tag_id))

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
        now = datetime.utcnow()
        return self.db.query(Todo).filter(
            Todo.owner_id == owner_id,
            Todo.is_done == False,
            Todo.due_date != None,
            Todo.due_date < now,
        ).order_by(Todo.due_date).all()

    def get_today(self, owner_id: int) -> List[Todo]:
        """Tasks due today (any time within the calendar day)."""
        today = date.today()
        return self.db.query(Todo).filter(
            Todo.owner_id == owner_id,
            func.date(Todo.due_date) == today,
        ).order_by(Todo.due_date).all()

    def get_by_id(self, todo_id: int, owner_id: int) -> Optional[Todo]:
        return self.db.query(Todo).filter(
            Todo.id == todo_id,
            Todo.owner_id == owner_id
        ).first()

    def create(self, todo_data: TodoCreate, owner_id: int, tags: List[Tag] = None) -> Todo:
        new_todo = Todo(
            title=todo_data.title,
            description=todo_data.description,
            is_done=todo_data.is_done,
            due_date=todo_data.due_date,
            owner_id=owner_id,
        )
        if tags:
            new_todo.tags = tags
        self.db.add(new_todo)
        self.db.commit()
        self.db.refresh(new_todo)
        return new_todo

    def update(self, todo_id: int, todo_update: TodoUpdate, owner_id: int, tags: List[Tag] = None) -> Optional[Todo]:
        db_todo = self.get_by_id(todo_id, owner_id)
        if not db_todo:
            return None
        
        update_data = todo_update.model_dump(exclude_unset=True, exclude={"tag_ids"})
        for key, value in update_data.items():
            setattr(db_todo, key, value)
        
        if tags is not None:
            db_todo.tags = tags
        
        self.db.commit()
        self.db.refresh(db_todo)
        return db_todo

    def delete(self, todo_id: int, owner_id: int) -> bool:
        db_todo = self.get_by_id(todo_id, owner_id)
        if not db_todo:
            return False
        
        self.db.delete(db_todo)
        self.db.commit()
        return True

    def delete_completed(self, owner_id: int) -> int:
        """Delete all completed todos for the owner. Returns count of deleted items."""
        count = self.db.query(Todo).filter(
            Todo.owner_id == owner_id,
            Todo.is_done == True
        ).delete()
        self.db.commit()
        return count


# Dependency Injection Helper
def get_todo_repo(db: Session = Depends(get_db)) -> TodoRepository:
    return TodoRepository(db)
