from typing import Optional, Union, List
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, Depends
from ..core.database import get_db
from ..schemas.todo import TodoCreate, TodoUpdate, TodoResponse, PaginatedResponse
from ..repositories.todo_repository import TodoRepository
from ..repositories.tag_repository import TagRepository


def _make_naive(dt):
    """Strip timezone info for consistent comparison with DB naive datetimes."""
    if dt and dt.tzinfo is not None:
        return dt.replace(tzinfo=None)
    return dt


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
        "tags": todo.tags,
        "is_overdue": (
            not todo.is_done
            and todo.due_date is not None
            and todo.due_date < datetime.utcnow()
        ),
    }
    return data


class TodoService:
    def __init__(self, repo: TodoRepository, tag_repo: TagRepository):
        self.repo = repo
        self.tag_repo = tag_repo

    def _resolve_tags(self, tag_ids: Optional[List[int]], owner_id: int):
        """Resolve tag_ids to Tag ORM objects, filtered by owner."""
        if tag_ids is None:
            return None
        if not tag_ids:
            return []
        tags = self.tag_repo.get_by_ids(tag_ids, owner_id)
        return tags

    def get_todos(
        self,
        owner_id: int,
        skip: int = 0,
        limit: int = 10,
        q: Optional[str] = None,
        is_done: Optional[bool] = None,
        sort_desc: bool = True,
        tag_id: Optional[int] = None,
    ) -> PaginatedResponse:
        items, total = self.repo.get_all(
            owner_id=owner_id,
            skip=skip,
            limit=limit,
            q=q,
            is_done=is_done,
            sort_desc=sort_desc,
            tag_id=tag_id,
        )
        enriched = [_enrich_todo(t) for t in items]
        return PaginatedResponse(
            items=enriched,
            total=total,
            limit=limit,
            offset=skip
        )

    def create_todo(self, todo: TodoCreate, owner_id: int) -> dict:
        # Validate: due_date must be in the future (after created_at which is ~now)
        if todo.due_date is not None and _make_naive(todo.due_date) <= datetime.utcnow():
            raise HTTPException(
                status_code=400,
                detail="Deadline phải sau thời điểm hiện tại"
            )
        tags = self._resolve_tags(todo.tag_ids, owner_id)
        new_todo = self.repo.create(todo, owner_id, tags=tags or [])
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
            if _make_naive(new_due) <= existing.created_at:
                raise HTTPException(
                    status_code=400,
                    detail="Deadline phải sau thời điểm tạo công việc"
                )
        tag_ids = getattr(todo_update, 'tag_ids', None)
        tags = self._resolve_tags(tag_ids, owner_id)
        updated_todo = self.repo.update(todo_id, todo_update, owner_id, tags=tags)
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


# Dependency Injection Helper — MUST share a single DB session
def get_todo_service(
    db: Session = Depends(get_db),
) -> TodoService:
    return TodoService(TodoRepository(db), TagRepository(db))
