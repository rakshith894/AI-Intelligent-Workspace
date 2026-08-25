from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_id
from app.api.permission import require_workspace_role
from app.core.database import get_db
from app.models.workspace_membership import WorkspaceMembership
from app.schemas.ai import (
    AutoAssignRequest,
    AutoAssignResponse,
    DailyStandupResponse,
    ExternalAIChatRequest,
    ExternalAIChatResponse,
    KnowledgeSearchRequest,
    KnowledgeSearchResponse,
    SprintAnalysisResponse,
    SprintRetrospectiveResponse,
    TaskBreakdownRequest,
    TaskBreakdownResponse,
)
from app.services.ai import (
    analyze_sprint_health,
    breakdown_task,
    chat_with_external_ai,
    generate_daily_standup,
    generate_sprint_retrospective,
    recommend_optimal_assignee,
    search_workspace_knowledge,
)

router = APIRouter(
    prefix="/api/v1/workspaces",
    tags=["AI Intelligence"],
)


@router.post(
    "/{workspace_id}/ai/chat",
    response_model=ExternalAIChatResponse,
    status_code=status.HTTP_200_OK,
)
def chat_ai(
    workspace_id: UUID,
    data: ExternalAIChatRequest,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin", "member")
    ),
):
    try:
        return chat_with_external_ai(
            db=db,
            workspace_id=str(workspace_id),
            data=data,
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


@router.post(
    "/{workspace_id}/ai/task-breakdown",
    response_model=TaskBreakdownResponse,
    status_code=status.HTTP_200_OK,
)
def get_task_breakdown(
    workspace_id: UUID,
    data: TaskBreakdownRequest,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin", "member")
    ),
):
    try:
        return breakdown_task(
            db=db,
            workspace_id=str(workspace_id),
            data=data,
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


@router.get(
    "/{workspace_id}/ai/sprint-analysis",
    response_model=SprintAnalysisResponse,
    status_code=status.HTTP_200_OK,
)
def get_sprint_analysis(
    workspace_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin", "member")
    ),
):
    try:
        return analyze_sprint_health(
            db=db,
            workspace_id=str(workspace_id),
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


@router.get(
    "/{workspace_id}/ai/daily-standup",
    response_model=DailyStandupResponse,
    status_code=status.HTTP_200_OK,
)
def get_daily_standup(
    workspace_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin", "member")
    ),
):
    try:
        return generate_daily_standup(
            db=db,
            workspace_id=str(workspace_id),
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


@router.get(
    "/{workspace_id}/ai/retrospective",
    response_model=SprintRetrospectiveResponse,
    status_code=status.HTTP_200_OK,
)
def get_sprint_retrospective(
    workspace_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin", "member")
    ),
):
    try:
        return generate_sprint_retrospective(
            db=db,
            workspace_id=str(workspace_id),
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


@router.post(
    "/{workspace_id}/ai/auto-assign",
    response_model=AutoAssignResponse,
    status_code=status.HTTP_200_OK,
)
def get_auto_assign_recommendation(
    workspace_id: UUID,
    data: AutoAssignRequest,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin", "member")
    ),
):
    try:
        return recommend_optimal_assignee(
            db=db,
            workspace_id=str(workspace_id),
            task_title=data.task_title,
            task_priority=data.task_priority,
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


@router.post(
    "/{workspace_id}/ai/knowledge-search",
    response_model=KnowledgeSearchResponse,
    status_code=status.HTTP_200_OK,
)
def query_knowledge_base(
    workspace_id: UUID,
    data: KnowledgeSearchRequest,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin", "member")
    ),
):
    try:
        return search_workspace_knowledge(
            db=db,
            workspace_id=str(workspace_id),
            query=data.query,
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error
