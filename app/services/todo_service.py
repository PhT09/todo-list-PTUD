from typing import Optional, Union
from fastapi import HTTPException, Depends
from ..schemas.todo import TodoCreate, TodoUpdate, Todo, PaginatedResponse
from ..repositories.todo_repository import TodoRepository, get_todo_repo


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
        sort_desc: bool = True
    ) -> PaginatedResponse:
        items, total = self.repo.get_all(
            owner_id=owner_id,
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

    def create_todo(self, todo: TodoCreate, owner_id: int) -> Todo:
        return self.repo.create(todo, owner_id)

    def get_todo(self, todo_id: int, owner_id: int) -> Todo:
        todo = self.repo.get_by_id(todo_id, owner_id)
        if not todo:
            raise HTTPException(status_code=404, detail="Task không tồn tại hoặc không thuộc về bạn")
        return todo

    def update_todo(self, todo_id: int, todo_update: Union[TodoCreate, TodoUpdate], owner_id: int) -> Todo:
        updated_todo = self.repo.update(todo_id, todo_update, owner_id)
        if not updated_todo:
            raise HTTPException(status_code=404, detail="Task không tồn tại hoặc không thuộc về bạn")
        return updated_todo

    def delete_todo(self, todo_id: int, owner_id: int):
        success = self.repo.delete(todo_id, owner_id)
        if not success:
            raise HTTPException(status_code=404, detail="Task không tồn tại hoặc không thuộc về bạn")
        return {"message": "Xóa thành công"}

    def complete_todo(self, todo_id: int, owner_id: int) -> Todo:
        update_data = TodoUpdate(is_done=True)
        return self.update_todo(todo_id, update_data, owner_id)

    def delete_completed_todos(self, owner_id: int) -> dict:
        count = self.repo.delete_completed(owner_id)
        return {"message": f"Deleted {count} completed tasks", "count": count}


# Dependency Injection Helper
def get_todo_service(repo: TodoRepository = Depends(get_todo_repo)) -> TodoService:
    return TodoService(repo)
