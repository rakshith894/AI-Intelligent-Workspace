from datetime import datetime

from pydantic import BaseModel, EmailStr


class InvitationCreate(BaseModel):
    email: EmailStr


class InvitationResponse(BaseModel):
    id: str
    workspace_id: str
    email: EmailStr
    token: str
    expires_at: datetime


class InvitationAcceptResponse(BaseModel):
    message: str
    workspace_id: str
    role: str