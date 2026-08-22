from pydantic import BaseModel, EmailStr


class MembershipResponse(BaseModel):
    id: str
    user_id: str
    email: EmailStr
    full_name: str
    role: str