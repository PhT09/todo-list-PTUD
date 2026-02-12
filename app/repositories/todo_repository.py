from datetime import datetime
from typing import List, Optional
from ..schemas.todo import Todo, TodoCreate

# In-memory database
todos_db: List[Todo] = []

class TodoRepository:
    def get_all(
        self,
        skip: int = 0,
        limit: int = 10,
        q: Optional[str] = None,
        is_done: Optional[bool] = None,
        sort_desc: bool = True
    ) -> tuple[List[Todo], int]:
        """
        Lấy danh sách Todos với bộ lọc, tìm kiếm, sắp xếp và phân trang.
        Trả về (list_items, total_count).
        """
        filtered_items = todos_db

        # 1. Filter by status
        if is_done is not None:
            filtered_items = [t for t in filtered_items if t.is_done == is_done]

        # 2. Search by title
        if q:
            q_lower = q.lower()
            filtered_items = [t for t in filtered_items if q_lower in t.title.lower()]

        # 3. Calculate Total Count
        total = len(filtered_items)

        # 4. Sort
        filtered_items.sort(
            key=lambda x: x.created_at, 
            reverse=sort_desc
        )

        # 5. Pagination
        paginated_items = filtered_items[skip : skip + limit]

        return paginated_items, total

    def get_by_id(self, todo_id: int) -> Optional[Todo]:
        for todo in todos_db:
            if todo.id == todo_id:
                return todo
        return None

    def create(self, todo_data: TodoCreate) -> Todo:
        new_id = len(todos_db) + 1 if not todos_db else max(t.id for t in todos_db) + 1
        new_todo = Todo(
            id=new_id, 
            title=todo_data.title, 
            is_done=todo_data.is_done,
            created_at=datetime.now()
        )
        todos_db.insert(0, new_todo) # Mặc định thêm vào đầu nếu sort desc
        return new_todo

    def update(self, todo_id: int, todo_data: TodoCreate) -> Optional[Todo]:
        for index, todo in enumerate(todos_db):
            if todo.id == todo_id:
                updated_todo = todo.model_copy(update=todo_data.model_dump())
                todos_db[index] = updated_todo
                return updated_todo
        return None

    def delete(self, todo_id: int) -> bool:
        for index, todo in enumerate(todos_db):
            if todo.id == todo_id:
                del todos_db[index]
                return True
        return False

# Dependency Injection Helper (Singleton for Mem Repo)
todo_repo = TodoRepository()
def get_todo_repo() -> TodoRepository:
    return todo_repo
