from fastapi import FastAPI

from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.api.routes.me import router as me_router
from app.api.routes.workspace import router as workspace_router
from app.core.config import settings


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered intelligent workspace API",
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(me_router)
app.include_router(workspace_router)


@app.get("/")
async def root():
    return {
        "message": f"{settings.app_name} API is running!",
        "environment": settings.environment,
    }