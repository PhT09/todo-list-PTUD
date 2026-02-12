from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.todo import TodoCreate, TodoUpdate, TodoResponse
from app.repositories.todo_repository import TodoRepository
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/todos", tags=["todos"])

def get_todo_repo(db: Session = Depends(get_db)):
    return TodoRepository(db)

@router.get("/", response_model=dict)
def read_todos(
    limit: int = 10,
    offset: int = 0,
    q: str = None,
    is_done: bool = None,
    sort_desc: bool = True,
    repo: TodoRepository = Depends(get_todo_repo),
    current_user: User = Depends(get_current_user)
):
    todos = repo.get_todos(limit, offset, q, is_done, sort_desc, owner_id=current_user.id)
    count = repo.count_todos(q, is_done, owner_id=current_user.id)
    return {
        "items": todos,
        "total": count,
        "limit": limit,
        "offset": offset
    }

@router.post("/", response_model=TodoResponse)
def create_todo(
    todo: TodoCreate,
    repo: TodoRepository = Depends(get_todo_repo),
    current_user: User = Depends(get_current_user)
):
    return repo.create_todo(todo, owner_id=current_user.id)

@router.patch("/{todo_id}", response_model=TodoResponse)
def update_todo(
    todo_id: int,
    updates: TodoUpdate,
    repo: TodoRepository = Depends(get_todo_repo),
    current_user: User = Depends(get_current_user)
):
    todo = repo.update_todo(todo_id, updates, owner_id=current_user.id)
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found or not owned by user"
        )
    return todo

@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
    todo_id: int,
    repo: TodoRepository = Depends(get_todo_repo),
    current_user: User = Depends(get_current_user)
):
    success = repo.delete_todo(todo_id, owner_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found or not owned by user"
        )
