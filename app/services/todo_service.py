from typing import Optional, List
from fastapi import HTTPException, Depends
from ..schemas.todo import TodoCreate, Todo, PaginatedResponse
from ..repositories.todo_repository import TodoRepository, get_todo_repo

class TodoService:

    def __init__(self, repo: TodoRepository):
        self.repo = repo

    def get_todos(
        self, 
        skip: int = 0, 
        limit: int = 10, 
        q: Optional[str] = None, 
        is_done: Optional[bool] = None, 
        sort_desc: bool = True
    ) -> PaginatedResponse:
        items, total = self.repo.get_all(
            skip=skip, 
            limit=limit, 
            q=q, 
            is_done=is_done, 
            sort_desc=sort_desc
        )
        return PaginatedResponse(
            items=items,
            total=total,
            limit=limit,
            offset=skip
        )

    def create_todo(self, todo: TodoCreate) -> Todo:
        return self.repo.create(todo)

    def get_todo(self, todo_id: int) -> Todo:
        todo = self.repo.get_by_id(todo_id)
        if not todo:
            raise HTTPException(status_code=404, detail="Todo not found")
        return todo

    def update_todo(self, todo_id: int, todo_data: TodoCreate) -> Todo:
        updated_todo = self.repo.update(todo_id, todo_data)
        if not updated_todo:
            raise HTTPException(status_code=404, detail="Todo not found")
        return updated_todo

    def delete_todo(self, todo_id: int):
        success = self.repo.delete(todo_id)
        if not success:
            raise HTTPException(status_code=404, detail="Todo not found")
        return {"message": "Todo deleted successfully"}

# Dependency Injection Helper
def get_todo_service(repo: TodoRepository = Depends(get_todo_repo)) -> TodoService:
    return TodoService(repo)
