from pydantic import BaseModel, Field, ConfigDict
from datetime import date
from typing import Optional, List
from enum import Enum


# ─── Priority Enum (Fixed 4 options) ───
class PriorityEnum(str, Enum):
    PRIORITY = "Priority"
    IMPORTANT = "Important"
    NECESSARY = "Necessary"
    NORMAL = "Normal"


# Base Model
class TodoBase(BaseModel):
    model_config = ConfigDict(extra='ignore')

    title: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = None
    is_done: bool = False
    due_date: Optional[date] = None
    priority: PriorityEnum = PriorityEnum.NORMAL


# Create Model
class TodoCreate(TodoBase):
    pass


# Patch Model (Partial Update)
class TodoUpdate(BaseModel):
    model_config = ConfigDict(extra='ignore')

    title: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = None
    is_done: Optional[bool] = None
    due_date: Optional[date] = None
    priority: Optional[PriorityEnum] = None


# Response Model
class TodoResponse(TodoBase):
    id: int
    created_at: date
    updated_at: Optional[date] = None
    owner_id: int
    is_overdue: bool = False
    deleted_at: Optional[date] = None
    completed_at: Optional[date] = None
    productivity_score: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedResponse(BaseModel):
    items: List[TodoResponse]
    total: int
    limit: int
    offset: int
