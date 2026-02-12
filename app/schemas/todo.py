from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional, List

# Base Model
class TodoBase(BaseModel):
    model_config = ConfigDict(extra='ignore')
    
    title: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = None
    is_done: bool = False

# Create Model
class TodoCreate(TodoBase):
    pass

# Patch Model (Partial Update)
class TodoUpdate(BaseModel):
    model_config = ConfigDict(extra='ignore')

    title: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = None
    is_done: Optional[bool] = None

# Response Model (Output)
class TodoResponse(TodoBase):
    id: int
    created_at: datetime
    updated_at: datetime
    owner_id: int # Add owner_id to response if needed, or keep hidden

    model_config = ConfigDict(from_attributes=True)

class PaginatedResponse(BaseModel):
    items: List[TodoResponse]
    total: int
    limit: int
    offset: int
