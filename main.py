from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import copy

app = FastAPI()

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models ---

class TodoBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=100, description="Tiêu đề công việc, từ 3-100 ký tự")
    is_done: bool = False

class TodoCreate(TodoBase):
    id: int  # Vẫn nhận ID từ client theo logic cũ để đồng bộ, thực tế nên để server tự sinh

class Todo(TodoBase):
    id: int
    created_at: datetime = Field(default_factory=datetime.now)

class PaginatedResponse(BaseModel):
    items: List[Todo]
    total: int
    limit: int
    offset: int

# --- In-memory Database ---
todos_db: List[Todo] = []

# --- Endpoints ---

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/")
def read_root():
    return {"message": "Welcome to Todo App Level 2 API"}

@app.post("/todos", status_code=201, response_model=Todo)
def create_todo(todo: TodoCreate):
    # Check ID conflict
    if any(t.id == todo.id for t in todos_db):
        raise HTTPException(status_code=400, detail="Todo ID already exists")
    
    # Create new Todo with timestamp
    new_todo = Todo(
        id=todo.id,
        title=todo.title,
        is_done=todo.is_done,
        created_at=datetime.now()
    )
    todos_db.append(new_todo)
    return new_todo

@app.get("/todos", response_model=PaginatedResponse)
def get_todos(
    q: Optional[str] = Query(None, description="Từ khóa tìm kiếm trong title"),
    is_done: Optional[bool] = Query(None, description="Lọc theo trạng thái hoàn thành"),
    sort_desc: bool = Query(True, description="Sắp xếp thời gian tạo giảm dần"),
    limit: int = Query(5, ge=1, le=50, description="Số lượng item mỗi trang"),
    offset: int = Query(0, ge=0, description="Vị trí bắt đầu lấy dữ liệu")
):
    # 1. Filtering
    filtered_todos = todos_db
    
    if is_done is not None:
        filtered_todos = [t for t in filtered_todos if t.is_done == is_done]
    
    if q:
        filtered_todos = [t for t in filtered_todos if q.lower() in t.title.lower()]
    
    # 2. Sorting
    filtered_todos.sort(key=lambda x: x.created_at, reverse=sort_desc)
    
    # 3. Pagination
    total = len(filtered_todos)
    # Cắt list theo limit/offset
    paginated_items = filtered_todos[offset : offset + limit]
    
    return {
        "items": paginated_items,
        "total": total,
        "limit": limit,
        "offset": offset
    }

@app.get("/todos/{todo_id}", response_model=Todo)
def get_todo_detail(todo_id: int):
    todo = next((t for t in todos_db if t.id == todo_id), None)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo

@app.put("/todos/{todo_id}", response_model=Todo)
def update_todo(todo_id: int, todo_update: TodoBase):
    # Tìm todo
    for index, todo in enumerate(todos_db):
        if todo.id == todo_id:
            # Giữ nguyên id và created_at, chỉ update title/is_done
            updated_todo = todo.copy(update=todo_update.dict())
            todos_db[index] = updated_todo
            return updated_todo
            
    raise HTTPException(status_code=404, detail="Todo not found")

@app.delete("/todos/{todo_id}")
def delete_todo(todo_id: int):
    for index, todo in enumerate(todos_db):
        if todo.id == todo_id:
            todos_db.pop(index)
            return {"message": "Deleted successfully"}
    raise HTTPException(status_code=404, detail="Todo not found")
