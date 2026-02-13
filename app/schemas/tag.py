from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List


class TagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    color: str = Field(default="#6366f1", pattern=r"^#[0-9a-fA-F]{6}$")


class TagCreate(TagBase):
    pass


class TagResponse(TagBase):
    id: int
    owner_id: int

    model_config = ConfigDict(from_attributes=True)
