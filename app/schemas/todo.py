from pydantic import BaseModel, Field, field_validator, ConfigDict
from datetime import datetime
from typing import Optional, List

# --- Models ---
class TodoBase(BaseModel):
    model_config = ConfigDict(extra='ignore')
    
    title: str = Field(..., min_length=3, max_length=100)
    is_done: bool = False

class TodoCreate(TodoBase):
    pass

class Todo(TodoBase):
    id: int
    created_at: datetime = Field(default_factory=datetime.now)

class PaginatedResponse(BaseModel):
    items: List[Todo]
    total: int
    limit: int
    offset: int
