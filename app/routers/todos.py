from fastapi import APIRouter, Depends, Query, Path, HTTPException
from typing import Optional
from ..schemas.todo import TodoCreate, TodoUpdate, Todo, PaginatedResponse
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
    service: TodoService = Depends(get_todo_service),
    current_user: User = Depends(get_current_user),
):
    return service.get_todos(current_user.id, skip, limit, q, is_done, sort_desc)


@router.post("/todos", response_model=Todo, status_code=201)
def create_todo(
    todo: TodoCreate,
    service: TodoService = Depends(get_todo_service),
    current_user: User = Depends(get_current_user),
):
    return service.create_todo(todo, current_user.id)


@router.get("/todos/{todo_id}", response_model=Todo)
def read_todo(
    todo_id: int = Path(..., title="The ID of the todo to get"),
    service: TodoService = Depends(get_todo_service),
    current_user: User = Depends(get_current_user),
):
    return service.get_todo(todo_id, current_user.id)


@router.put("/todos/{todo_id}", response_model=Todo)
def update_todo(
    todo_id: int,
    todo: TodoCreate,
    service: TodoService = Depends(get_todo_service),
    current_user: User = Depends(get_current_user),
):
    return service.update_todo(todo_id, todo, current_user.id)


@router.patch("/todos/{todo_id}", response_model=Todo)
def patch_todo(
    todo_id: int,
    todo: TodoUpdate,
    service: TodoService = Depends(get_todo_service),
    current_user: User = Depends(get_current_user),
):
    return service.update_todo(todo_id, todo, current_user.id)


@router.post("/todos/{todo_id}/complete", response_model=Todo)
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
