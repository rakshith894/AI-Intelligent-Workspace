from fastapi import FastAPI

from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.api.routes.me import router as me_router
from app.api.routes.workspace import router as workspace_router
from app.core.config import settings
from app.api.routes.members import router as members_router
from app.api.routes.invitation import router as invitation_router
from app.api.routes.invitation import (
    router as invitation_router,
    accept_router,
)
from app.api.routes.project import router as project_router
from app.api.routes.task import router as task_router
from app.api.routes.task_comments import router as task_comment_router
from app.api.routes.labels import router as label_router

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered intelligent workspace API",
)
app.include_router(task_comment_router)
app.include_router(label_router)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(me_router)
app.include_router(workspace_router)
app.include_router(members_router)
app.include_router(invitation_router)
app.include_router(accept_router)
app.include_router(project_router)
app.include_router(task_router)
@app.get("/")
async def root():
    return {
        "message": f"{settings.app_name} API is running!",
        "environment": settings.environment,
    }