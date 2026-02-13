from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List
from .tag import TagResponse

# Base Model
class TodoBase(BaseModel):
    model_config = ConfigDict(extra='ignore')
    
    title: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = None
    is_done: bool = False
    due_date: Optional[datetime] = None  # Level 6: Deadline

# Create Model
class TodoCreate(TodoBase):
    tag_ids: Optional[List[int]] = None  # Level 6: Assign tags on creation

# Patch Model (Partial Update)
class TodoUpdate(BaseModel):
    model_config = ConfigDict(extra='ignore')

    title: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = None
    is_done: Optional[bool] = None
    due_date: Optional[datetime] = None  # Level 6: Update deadline
    tag_ids: Optional[List[int]] = None  # Level 6: Update tags

# Response Model
class TodoResponse(TodoBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    owner_id: int
    tags: List[TagResponse] = []  # Level 6: Embedded tag info
    is_overdue: bool = False  # Level 6: Computed field

    model_config = ConfigDict(from_attributes=True)

class PaginatedResponse(BaseModel):
    items: List[TodoResponse]
    total: int
    limit: int
    offset: int
