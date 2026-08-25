from datetime import datetime
from pydantic import BaseModel, Field


class GitHubConnectRequest(BaseModel):
    github_username: str = Field(min_length=1, max_length=255)
    access_token: str | None = None


class GitHubStatusResponse(BaseModel):
    is_connected: bool
    github_username: str | None = None
    connected_at: datetime | None = None
    profile_url: str | None = None
    avatar_url: str | None = None
