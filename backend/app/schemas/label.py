from pydantic import BaseModel, Field


class LabelCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    color: str = Field(default="blue", max_length=20)


class LabelResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    color: str


class TaskLabelResponse(BaseModel):
    task_id: str
    label_id: str