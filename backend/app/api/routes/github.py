from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_id
from app.core.database import get_db
from app.schemas.github import GitHubConnectRequest, GitHubStatusResponse
from app.services.github import (
    connect_github_account,
    disconnect_github_account,
    fetch_github_repos,
    get_github_status,
)

router = APIRouter(
    prefix="/api/v1/users/me/github",
    tags=["GitHub Integration"],
)


@router.get("", response_model=GitHubStatusResponse)
def get_github_connection_status(
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    return get_github_status(db=db, user_id=current_user_id)


@router.post("/connect", response_model=GitHubStatusResponse)
def connect_github(
    data: GitHubConnectRequest,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    try:
        connect_github_account(
            db=db,
            user_id=current_user_id,
            github_username=data.github_username,
            access_token=data.access_token,
        )
        return get_github_status(db=db, user_id=current_user_id)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        ) from err


@router.delete("/disconnect", response_model=GitHubStatusResponse)
def disconnect_github(
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    disconnect_github_account(db=db, user_id=current_user_id)
    return get_github_status(db=db, user_id=current_user_id)


@router.get("/repos")
def get_my_github_repos(
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    status_info = get_github_status(db=db, user_id=current_user_id)
    if not status_info["is_connected"] or not status_info["github_username"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub account is not connected",
        )
    return fetch_github_repos(status_info["github_username"])
