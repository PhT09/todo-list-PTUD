from fastapi import APIRouter, Depends, Query, Path, HTTPException
from typing import Optional, Union
from ..schemas.todo import TodoCreate, TodoUpdate, Todo, PaginatedResponse
from ..services.todo_service import TodoService, get_todo_service

router = APIRouter()

@router.get("/todos", response_model=PaginatedResponse)
def read_todos(
    skip: int = Query(0, ge=0, alias="offset"),
    limit: int = Query(10, ge=1, le=100),
    q: Optional[str] = None,
    is_done: Optional[bool] = None,
    sort_desc: bool = True,
    service: TodoService = Depends(get_todo_service)
):
    return service.get_todos(skip, limit, q, is_done, sort_desc)

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
    todo: TodoCreate, # PUT replaces resource, so require all fields usually. But TodoCreate fits.
    service: TodoService = Depends(get_todo_service)
):
    return service.update_todo(todo_id, todo)

@router.patch("/todos/{todo_id}", response_model=Todo)
def patch_todo(
    todo_id: int,
    todo: TodoUpdate, # PATCH updates partially, all fields optional
    service: TodoService = Depends(get_todo_service)
):
    return service.update_todo(todo_id, todo)

@router.post("/todos/{todo_id}/complete", response_model=Todo)
def complete_todo(
    todo_id: int,
    service: TodoService = Depends(get_todo_service)
):
    return service.complete_todo(todo_id)

@router.delete("/todos/{todo_id}")
def delete_todo(
    todo_id: int,
    service: TodoService = Depends(get_todo_service)
):
    return service.delete_todo(todo_id)
