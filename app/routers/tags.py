from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from ..schemas.tag import TagCreate, TagResponse
from ..repositories.tag_repository import TagRepository, get_tag_repo
from ..api.deps import get_current_user
from ..models.user import User

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("/", response_model=List[TagResponse])
def list_tags(
    repo: TagRepository = Depends(get_tag_repo),
    current_user: User = Depends(get_current_user),
):
    return repo.get_all(current_user.id)


@router.post("/", response_model=TagResponse, status_code=201)
def create_tag(
    tag_data: TagCreate,
    repo: TagRepository = Depends(get_tag_repo),
    current_user: User = Depends(get_current_user),
):
    return repo.create(tag_data, current_user.id)


@router.put("/{tag_id}", response_model=TagResponse)
def update_tag(
    tag_id: int,
    tag_data: TagCreate,
    repo: TagRepository = Depends(get_tag_repo),
    current_user: User = Depends(get_current_user),
):
    tag = repo.update(tag_id, tag_data, current_user.id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag không tồn tại")
    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(
    tag_id: int,
    repo: TagRepository = Depends(get_tag_repo),
    current_user: User = Depends(get_current_user),
):
    success = repo.delete(tag_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Tag không tồn tại")
