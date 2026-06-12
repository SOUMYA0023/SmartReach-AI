from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI

from app.api.ai_workspace import knowledge_router, router as ai_router
from app.config import settings
from app.rag.seed_knowledge import seed_if_empty

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ]
)
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        result = await seed_if_empty()
        logger.info("knowledge_seed", **result)
    except Exception as e:
        logger.warning("knowledge_seed_skipped", error=str(e))
    yield


app = FastAPI(
    title="SmartReach AI — AI Service",
    description="Multi-agent LangGraph campaign generation with RAG",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(ai_router)
app.include_router(knowledge_router)


@app.get("/health")
async def health():
    return {"status": "healthy", "service": settings.SERVICE_NAME}
