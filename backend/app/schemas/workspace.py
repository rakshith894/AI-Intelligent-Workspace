from pydantic import BaseModel, Field


class WorkspaceCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=255,
    )


class WorkspaceUpdate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=255,
    )


class WorkspaceResponse(BaseModel):
    id: str
    name: str
    slug: str
    owner_id: str