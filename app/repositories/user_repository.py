from typing import Optional
from sqlalchemy.orm import Session
from fastapi import Depends

from ..models.user import User
from ..schemas.user import UserCreate
from ..core.database import get_db
from ..core.security import get_password_hash


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def create(self, user_data: UserCreate) -> User:
        hashed_pw = get_password_hash(user_data.password)
        new_user = User(
            email=user_data.email,
            hashed_password=hashed_pw,
        )
        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)
        return new_user


# Dependency Injection Helper
def get_user_repo(db: Session = Depends(get_db)) -> UserRepository:
    return UserRepository(db)
