from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user_id


router = APIRouter(
    prefix="/api/v1/users",
    tags=["Users"],
)


@router.get("/me")
def get_me(
    user_id: str = Depends(get_current_user_id),
):
    return {
        "user_id": user_id,
    }