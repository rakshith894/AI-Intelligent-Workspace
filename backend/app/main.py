from fastapi import FastAPI

from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.core.config import settings


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered intelligent workspace API",
)

app.include_router(health_router)
app.include_router(auth_router)


@app.get("/")
async def root():
    return {
        "message": f"{settings.app_name} API is running!",
        "environment": settings.environment,
    }