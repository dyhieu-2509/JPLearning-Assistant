from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI

from app.api.v1 import assessment_controller, planner_controller, tutor_controller
from app.config.settings import get_settings
from app.dependencies import get_neo4j_reader, get_qdrant_client


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Manage external resources for the AI service."""
    yield
    get_neo4j_reader().close()
    get_qdrant_client().close()


settings = get_settings()

app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)
app.include_router(tutor_controller.router)
app.include_router(planner_controller.router)
app.include_router(assessment_controller.router)


@app.get("/api/v1/health")
def health() -> dict[str, str]:
    """Return AI service liveness information."""
    return {"status": "ok", "service": "ai-service"}
