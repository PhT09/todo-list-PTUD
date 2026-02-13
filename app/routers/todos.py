from fastapi import APIRouter, Depends, Query, Path, HTTPException
from typing import Optional, List
from ..schemas.todo import TodoCreate, TodoUpdate, TodoResponse, PaginatedResponse
from ..services.todo_service import TodoService, get_todo_service
from ..api.deps import get_current_user
from ..models.user import User

router = APIRouter()

# ─── All endpoints require authentication ───


@router.get("/todos", response_model=PaginatedResponse)
def read_todos(
    skip: int = Query(0, ge=0, alias="offset"),
    limit: int = Query(10, ge=1, le=100),
    q: Optional[str] = None,
    is_done: Optional[bool] = None,
    sort_desc: bool = True,
    tag_id: Optional[int] = None,
    service: TodoService = Depends(get_todo_service),
    current_user: User = Depends(get_current_user),
):
    return service.get_todos(current_user.id, skip, limit, q, is_done, sort_desc, tag_id)


# ─── Smart Retrieval Endpoints (Level 6) ───

@router.get("/todos/overdue", response_model=List[TodoResponse])
def read_overdue_todos(
    service: TodoService = Depends(get_todo_service),
    current_user: User = Depends(get_current_user),
):
    """List tasks that are past their due_date and not yet completed."""
    return service.get_overdue_todos(current_user.id)


@router.get("/todos/today", response_model=List[TodoResponse])
def read_today_todos(
    service: TodoService = Depends(get_todo_service),
    current_user: User = Depends(get_current_user),
):
    """List tasks scheduled for the current calendar day."""
    return service.get_today_todos(current_user.id)


@router.post("/todos", response_model=TodoResponse, status_code=201)
def create_todo(
    todo: TodoCreate,
    service: TodoService = Depends(get_todo_service),
    current_user: User = Depends(get_current_user),
):
    return service.create_todo(todo, current_user.id)


@router.get("/todos/{todo_id}", response_model=TodoResponse)
def read_todo(
    todo_id: int = Path(..., title="The ID of the todo to get"),
    service: TodoService = Depends(get_todo_service),
    current_user: User = Depends(get_current_user),
):
    return service.get_todo(todo_id, current_user.id)


@router.put("/todos/{todo_id}", response_model=TodoResponse)
def update_todo(
    todo_id: int,
    todo: TodoCreate,
    service: TodoService = Depends(get_todo_service),
    current_user: User = Depends(get_current_user),
):
    return service.update_todo(todo_id, todo, current_user.id)


@router.patch("/todos/{todo_id}", response_model=TodoResponse)
def patch_todo(
    todo_id: int,
    todo: TodoUpdate,
    service: TodoService = Depends(get_todo_service),
    current_user: User = Depends(get_current_user),
):
    return service.update_todo(todo_id, todo, current_user.id)


@router.post("/todos/{todo_id}/complete", response_model=TodoResponse)
def complete_todo(
    todo_id: int,
    service: TodoService = Depends(get_todo_service),
    current_user: User = Depends(get_current_user),
):
    return service.complete_todo(todo_id, current_user.id)


@router.delete("/todos/completed")
def delete_completed_todos(
    service: TodoService = Depends(get_todo_service),
    current_user: User = Depends(get_current_user),
):
    return service.delete_completed_todos(current_user.id)


@router.delete("/todos/{todo_id}")
def delete_todo(
    todo_id: int,
    service: TodoService = Depends(get_todo_service),
    current_user: User = Depends(get_current_user),
):
    return service.delete_todo(todo_id, current_user.id)
