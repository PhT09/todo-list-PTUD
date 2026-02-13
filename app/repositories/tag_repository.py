from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import Depends

from ..models.tag import Tag
from ..schemas.tag import TagCreate
from ..core.database import get_db


class TagRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, owner_id: int) -> List[Tag]:
        return self.db.query(Tag).filter(Tag.owner_id == owner_id).order_by(Tag.name).all()

    def get_by_id(self, tag_id: int, owner_id: int) -> Optional[Tag]:
        return self.db.query(Tag).filter(Tag.id == tag_id, Tag.owner_id == owner_id).first()

    def get_by_ids(self, tag_ids: List[int], owner_id: int) -> List[Tag]:
        """Get multiple tags by IDs, filtered by owner. Returns only tags belonging to the owner."""
        return self.db.query(Tag).filter(
            Tag.id.in_(tag_ids),
            Tag.owner_id == owner_id
        ).all()

    def create(self, tag_data: TagCreate, owner_id: int) -> Tag:
        new_tag = Tag(
            name=tag_data.name,
            color=tag_data.color,
            owner_id=owner_id,
        )
        self.db.add(new_tag)
        self.db.commit()
        self.db.refresh(new_tag)
        return new_tag

    def update(self, tag_id: int, tag_data: TagCreate, owner_id: int) -> Optional[Tag]:
        tag = self.get_by_id(tag_id, owner_id)
        if not tag:
            return None
        tag.name = tag_data.name
        tag.color = tag_data.color
        self.db.commit()
        self.db.refresh(tag)
        return tag

    def delete(self, tag_id: int, owner_id: int) -> bool:
        tag = self.get_by_id(tag_id, owner_id)
        if not tag:
            return False
        self.db.delete(tag)
        self.db.commit()
        return True


# DI Helper
def get_tag_repo(db: Session = Depends(get_db)) -> TagRepository:
    return TagRepository(db)
