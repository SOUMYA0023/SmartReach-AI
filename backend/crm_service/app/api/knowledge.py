from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from starlette.requests import Request
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from datetime import datetime

from app.config import settings
from app.database import get_session
from app.middleware.rate_limit import limiter
from app.models.knowledge import KnowledgeDocument
from app.security.audit_logger import AuditLogger
from app.security.prompt_guard import PromptGuardService

router = APIRouter(prefix="/knowledge", tags=["knowledge"])
prompt_guard = PromptGuardService()
audit = AuditLogger()


class KnowledgeCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    content: str = Field(..., min_length=10)


class KnowledgeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    category: str
    content: str
    created_at: datetime


class KnowledgeListResponse(BaseModel):
    items: list[KnowledgeResponse]
    total: int


@router.post("", response_model=KnowledgeResponse)
@limiter.limit("10/minute")
async def add_knowledge(
    request: Request,
    body: KnowledgeCreate,
    session: AsyncSession = Depends(get_session),
):
    """Add a knowledge document (triggers embedding via AI service)."""
    prompt_guard.validate(body.content)
    prompt_guard.validate(body.title)
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{settings.AI_SERVICE_URL}/knowledge",
            json=body.model_dump(),
        )
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        data = response.json()
    await audit.log(
        "KNOWLEDGE_DOCUMENT_ADDED",
        "knowledge",
        UUID(data["id"]) if data.get("id") else None,
        {"title": body.title, "category": body.category},
        session,
    )
    return KnowledgeResponse(**data)


@router.get("", response_model=KnowledgeListResponse)
@limiter.limit("60/minute")
async def list_knowledge(
    request: Request,
    category: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
):
    """List knowledge documents, optionally filtered by category."""
    stmt = select(KnowledgeDocument)
    if category:
        stmt = stmt.where(KnowledgeDocument.category == category)
    from sqlalchemy import func

    count_stmt = select(func.count()).select_from(KnowledgeDocument)
    if category:
        count_stmt = count_stmt.where(KnowledgeDocument.category == category)
    total = (await session.execute(count_stmt)).scalar_one()
    result = await session.execute(stmt.offset(skip).limit(limit))
    items = list(result.scalars().all())
    return KnowledgeListResponse(
        items=[KnowledgeResponse.model_validate(i) for i in items],
        total=total,
    )
