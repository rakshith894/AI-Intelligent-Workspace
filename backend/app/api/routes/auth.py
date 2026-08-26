from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth import UserRegister, UserResponse
from app.services.auth import create_user


router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"],
)
from app.schemas.auth import (
    ForgotPasswordRequest,
    MessageResponse,
    ResetPasswordRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.services.auth import (
    authenticate_user,
    create_user,
    login_user,
    request_password_reset,
    reset_password,
)

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    credentials: UserLogin,
    db: Session = Depends(get_db),
):
    try:
        token = login_user(db, credentials)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error),
            headers={"WWW-Authenticate": "Bearer"},
        ) from error

    return TokenResponse(
        access_token=token,
        token_type="bearer",
    )


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    user_data: UserRegister,
    db: Session = Depends(get_db),
):
    try:
        user = create_user(db, user_data)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error

    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_verified=user.is_verified,
    )


@router.post("/forgot-password")
def forgot_password_endpoint(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    res = request_password_reset(db, payload.email)
    return res


@router.post("/reset-password", response_model=MessageResponse)
def reset_password_endpoint(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    try:
        res = reset_password(db, payload.email, payload.reset_token, payload.new_password)
        return MessageResponse(message=res["message"])
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error