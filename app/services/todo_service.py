from typing import Optional, Union, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, Depends
from ..core.database import get_db
from ..schemas.todo import TodoCreate, TodoUpdate, TodoResponse, PaginatedResponse
from ..repositories.todo_repository import TodoRepository
from .productivity_scorer import compute_productivity




def _enrich_todo(todo) -> dict:
    """Convert a Todo ORM object to a dict with computed is_overdue field."""
    data = {
        "id": todo.id,
        "title": todo.title,
        "description": todo.description,
        "is_done": todo.is_done,
        "due_date": todo.due_date,
        "created_at": todo.created_at,
        "updated_at": todo.updated_at,
        "owner_id": todo.owner_id,
        "priority": todo.priority,
        "deleted_at": todo.deleted_at,
        "completed_at": todo.completed_at,
        "productivity_score": todo.productivity_score,
        "is_overdue": (
            not todo.is_done
            and todo.due_date is not None
            and todo.due_date < datetime.now().date()
        ),
    }
    return data


class TodoService:
    def __init__(self, repo: TodoRepository):
        self.repo = repo

    def get_todos(
        self,
        owner_id: int,
        skip: int = 0,
        limit: int = 10,
        q: Optional[str] = None,
        is_done: Optional[bool] = None,
        sort_desc: bool = True,
        priority: Optional[str] = None,
    ) -> PaginatedResponse:
        items, total = self.repo.get_all(
            owner_id=owner_id,
            skip=skip,
            limit=limit,
            q=q,
            is_done=is_done,
            sort_desc=sort_desc,
            priority=priority,
        )
        enriched = [_enrich_todo(t) for t in items]
        return PaginatedResponse(
            items=enriched,
            total=total,
            limit=limit,
            offset=skip
        )

    def create_todo(self, todo: TodoCreate, owner_id: int) -> dict:
        # Validate: due_date must be today or in the future
        if todo.due_date is not None and todo.due_date < datetime.now().date():
            raise HTTPException(
                status_code=400,
                detail="Deadline không được nằm trong quá khứ"
            )
        new_todo = self.repo.create(todo, owner_id)
        return _enrich_todo(new_todo)

    def get_todo(self, todo_id: int, owner_id: int) -> dict:
        todo = self.repo.get_by_id(todo_id, owner_id)
        if not todo:
            raise HTTPException(status_code=404, detail="Task không tồn tại hoặc không thuộc về bạn")
        return _enrich_todo(todo)

    def update_todo(self, todo_id: int, todo_update: Union[TodoCreate, TodoUpdate], owner_id: int) -> dict:
        # Validate: due_date must be after the task's created_at
        new_due = getattr(todo_update, 'due_date', None)
        if new_due is not None:
            existing = self.repo.get_by_id(todo_id, owner_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Task không tồn tại hoặc không thuộc về bạn")
            if new_due < existing.created_at:
                raise HTTPException(
                    status_code=400,
                    detail="Deadline không được trước ngày tạo công việc"
                )

        # Check if task is being marked as done (is_done transitioning to True)
        is_done_value = getattr(todo_update, 'is_done', None)
        if is_done_value is True:
            existing = self.repo.get_by_id(todo_id, owner_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Task không tồn tại hoặc không thuộc về bạn")

            if not existing.is_done:
                # Task is being completed — compute productivity score
                now = datetime.now().date()
                priority = getattr(todo_update, 'priority', None)
                if priority is not None:
                    priority_str = priority.value if hasattr(priority, 'value') else priority
                else:
                    priority_str = existing.priority or "Normal"

                result = compute_productivity(
                    created_at=existing.created_at,
                    due_date=existing.due_date,
                    completed_at=now,
                    priority=priority_str,
                )

                # Set completed_at and score directly on the ORM object
                existing.completed_at = now
                existing.productivity_score = result["score"]
                existing.is_done = True

                if result["should_trash"]:
                    # Auto-trash: score = 0, move to trash
                    existing.productivity_score = 0.0
                    existing.deleted_at = now

                # Apply other fields from update if any
                update_data = todo_update.model_dump(exclude_unset=True, exclude={"is_done"})
                for key, value in update_data.items():
                    if key == "priority" and value is not None:
                        setattr(existing, key, value.value if hasattr(value, 'value') else value)
                    else:
                        setattr(existing, key, value)

                self.repo.db.commit()
                self.repo.db.refresh(existing)
                return _enrich_todo(existing)

        # If is_done is being set to False (un-completing), clear completed_at & score
        if is_done_value is False:
            existing = self.repo.get_by_id(todo_id, owner_id)
            if existing and existing.is_done:
                existing.completed_at = None
                existing.productivity_score = None

        updated_todo = self.repo.update(todo_id, todo_update, owner_id)
        if not updated_todo:
            raise HTTPException(status_code=404, detail="Task không tồn tại hoặc không thuộc về bạn")
        return _enrich_todo(updated_todo)

    def delete_todo(self, todo_id: int, owner_id: int):
        success = self.repo.delete(todo_id, owner_id)
        if not success:
            raise HTTPException(status_code=404, detail="Task không tồn tại hoặc không thuộc về bạn")
        return {"message": "Xóa thành công"}

    def complete_todo(self, todo_id: int, owner_id: int) -> dict:
        update_data = TodoUpdate(is_done=True)
        return self.update_todo(todo_id, update_data, owner_id)

    def delete_completed_todos(self, owner_id: int) -> dict:
        count = self.repo.delete_completed(owner_id)
        return {"message": f"Deleted {count} completed tasks", "count": count}

    def get_overdue_todos(self, owner_id: int) -> List[dict]:
        todos = self.repo.get_overdue(owner_id)
        return [_enrich_todo(t) for t in todos]

    def get_today_todos(self, owner_id: int) -> List[dict]:
        todos = self.repo.get_today(owner_id)
        return [_enrich_todo(t) for t in todos]

    def get_trash(self, owner_id: int) -> List[dict]:
        todos = self.repo.get_deleted_todos(owner_id)
        return [_enrich_todo(t) for t in todos]

    def restore_todo(self, todo_id: int, owner_id: int) -> dict:
        success = self.repo.restore(todo_id, owner_id)
        if not success:
            raise HTTPException(status_code=404, detail="Task không tồn tại trong thùng rác")
        return self.get_todo(todo_id, owner_id)

    def permanent_delete_todo(self, todo_id: int, owner_id: int):
        success = self.repo.permanent_delete(todo_id, owner_id)
        if not success:
            raise HTTPException(status_code=404, detail="Task không tồn tại")
        return {"message": "Xóa vĩnh viễn thành công"}


# Dependency Injection Helper — uses single DB session
def get_todo_service(
    db: Session = Depends(get_db),
) -> TodoService:
    return TodoService(TodoRepository(db))
