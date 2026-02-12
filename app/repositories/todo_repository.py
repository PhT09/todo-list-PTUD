from sqlalchemy.orm import Session
from app.models.todo import Todo
from app.schemas.todo import TodoCreate, TodoUpdate
from typing import List, Optional

class TodoRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_todos(self, limit: int, offset: int, q: Optional[str], is_done: Optional[bool], sort_desc: bool, owner_id: int):
        query = self.db.query(Todo).filter(Todo.owner_id == owner_id)
        
        if q:
            query = query.filter(Todo.title.contains(q))
        
        if is_done is not None:
            query = query.filter(Todo.is_done == is_done)
            
        if sort_desc:
            query = query.order_by(Todo.created_at.desc())
        else:
            query = query.order_by(Todo.created_at.asc())
            
        return query.limit(limit).offset(offset).all()

    def count_todos(self, q: Optional[str], is_done: Optional[bool], owner_id: int):
        query = self.db.query(Todo).filter(Todo.owner_id == owner_id)
        if q:
            query = query.filter(Todo.title.contains(q))
        if is_done is not None:
            query = query.filter(Todo.is_done == is_done)
        return query.count()

    def create_todo(self, todo: TodoCreate, owner_id: int):
        db_todo = Todo(**todo.dict(), owner_id=owner_id)
        self.db.add(db_todo)
        self.db.commit()
        self.db.refresh(db_todo)
        return db_todo

    def get_todo_by_id(self, todo_id: int, owner_id: int):
        return self.db.query(Todo).filter(Todo.id == todo_id, Todo.owner_id == owner_id).first()

    def update_todo(self, todo_id: int, updates: TodoUpdate, owner_id: int):
        db_todo = self.get_todo_by_id(todo_id, owner_id)
        if not db_todo:
            return None
            
        for key, value in updates.dict(exclude_unset=True).items():
            setattr(db_todo, key, value)
            
        self.db.commit()
        self.db.refresh(db_todo)
        return db_todo

    def delete_todo(self, todo_id: int, owner_id: int):
        db_todo = self.get_todo_by_id(todo_id, owner_id)
        if not db_todo:
            return False
            
        self.db.delete(db_todo)
        self.db.commit()
        return True
