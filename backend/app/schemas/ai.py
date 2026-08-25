from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


class TaskBreakdownRequest(BaseModel):
    title: str
    description: str | None = None
    priority: str | None = None


class SubtaskSuggestion(BaseModel):
    title: str
    estimated_hours: float = 1.0


class TaskBreakdownResponse(BaseModel):
    suggested_description: str
    suggested_priority: str
    suggested_tags: list[str]
    subtasks: list[SubtaskSuggestion]


class SprintAnalysisResponse(BaseModel):
    health_score: int
    health_status: str
    total_tasks: int
    completed_tasks: int
    overdue_tasks: int
    predicted_blockers: list[str]
    recommendations: list[str]


class DailyStandupResponse(BaseModel):
    generated_at: datetime
    workspace_name: str
    completed_recent: list[str]
    in_progress_today: list[str]
    blockers_and_risks: list[str]
    summary_markdown: str


class SprintRetrospectiveResponse(BaseModel):
    generated_at: datetime
    workspace_name: str
    what_went_well: list[str]
    what_could_be_improved: list[str]
    action_items: list[str]
    velocity_summary: dict[str, Any]
    summary_markdown: str


class AutoAssignRequest(BaseModel):
    task_title: str
    task_priority: str = "medium"


class AutoAssignResponse(BaseModel):
    recommended_user_id: str | None
    recommended_name: str | None
    current_active_tasks: int
    reason: str


class KnowledgeDocCreate(BaseModel):
    title: str
    content: str
    tags: list[str] = Field(default_factory=list)


class KnowledgeDocResponse(BaseModel):
    id: str
    workspace_id: str
    title: str
    content: str
    tags: list[str]
    created_at: datetime


class KnowledgeSearchRequest(BaseModel):
    query: str


class KnowledgeSearchResponse(BaseModel):
    results: list[dict[str, Any]]
    answer: str


class ChatMessageItem(BaseModel):
    role: str
    content: str


class ExternalAIChatRequest(BaseModel):
    prompt: str
    provider: str | None = "openai"  # openai, groq, openrouter, custom
    api_key: str | None = None
    model: str | None = None
    endpoint: str | None = None
    history: list[ChatMessageItem] = Field(default_factory=list)
    file_name: str | None = None
    file_type: str | None = None
    file_data: str | None = None  # Base64 string for photo/file upload



class ExternalAIChatResponse(BaseModel):
    reply: str
    model_used: str
    provider: str
    suggested_action: dict[str, str] | None = None
