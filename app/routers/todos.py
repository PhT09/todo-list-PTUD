from fastapi import APIRouter, Depends, Query, Path, HTTPException
from typing import Optional
from ..schemas.todo import TodoCreate, Todo, PaginatedResponse
from ..services.todo_service import TodoService, get_todo_service

router = APIRouter()

@router.get("/todos", response_model=PaginatedResponse)
def read_todos(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    q: Optional[str] = None,
    is_done: Optional[bool] = None,
    sort_desc: bool = True,
    service: TodoService = Depends(get_todo_service)
):
    return service.get_todos(skip, limit, q, is_done, sort_desc).model_dump()
    # model_dump() trả về dict, PaginatedResponse cũng là model.
    # Service trả về object PaginatedResponse.
    # FastAPI có thể pass object Pydantic trực tiếp.
    # Nhưng service trong code trước trả về PaginatedResponse(...).
    # Tôi sẽ sửa lại service return tuple hoặc router wrap.
    # Service Step 256: `return PaginatedResponse(...)`.
    # OK.

@router.post("/todos", response_model=Todo, status_code=201)
def create_todo(
    todo: TodoCreate,
    service: TodoService = Depends(get_todo_service)
):
    return service.create_todo(todo)

@router.get("/todos/{todo_id}", response_model=Todo)
def read_todo(
    todo_id: int = Path(..., title="The ID of the todo to get"),
    service: TodoService = Depends(get_todo_service)
):
    return service.get_todo(todo_id)

@router.put("/todos/{todo_id}", response_model=Todo)
def update_todo(
    todo_id: int,
    todo: TodoCreate,
    service: TodoService = Depends(get_todo_service)
):
    return service.update_todo(todo_id, todo)

@router.delete("/todos/{todo_id}")
def delete_todo(
    todo_id: int,
    service: TodoService = Depends(get_todo_service)
):
    return service.delete_todo(todo_id)
