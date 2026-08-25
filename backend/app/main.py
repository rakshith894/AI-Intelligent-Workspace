
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.api.routes.me import router as me_router
from app.api.routes.workspace import router as workspace_router
from app.api.routes.members import router as members_router

from app.api.routes.invitation import (
    router as invitation_router,
    accept_router,
)

from app.api.routes.project import router as project_router
from app.api.routes.task import router as task_router
from app.api.routes.task_comments import (
    router as task_comment_router,
)
from app.api.routes.labels import router as label_router
from app.api.routes.analytics import router as analytics_router
from app.api.routes.workload import router as workload_router

from app.api.routes.notifications import (
    router as notification_router,
)

from app.api.routes.comments import (
    router as comments_router,
)

from app.api.routes.notification_preferences import (
    router as notification_preferences_router,
)
from app.api.routes.ai import router as ai_router
from app.api.routes.attachment import router as attachment_router
from app.api.routes.github import router as github_router

from app.core.config import settings

# Register event handlers
import app.events.handlers


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered intelligent workspace API",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(me_router)

app.include_router(workspace_router)
app.include_router(members_router)

app.include_router(invitation_router)
app.include_router(accept_router)

app.include_router(project_router)
app.include_router(task_router)

app.include_router(task_comment_router)
app.include_router(label_router)
app.include_router(analytics_router)
app.include_router(workload_router)

app.include_router(notification_router)
app.include_router(notification_preferences_router)

app.include_router(comments_router)
app.include_router(ai_router)
app.include_router(attachment_router)
app.include_router(github_router)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
async def root():
    return {
        "message": f"{settings.app_name} API is running!",
        "environment": settings.environment,
    }
