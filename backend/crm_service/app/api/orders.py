from fastapi import APIRouter, Depends, File, UploadFile
from starlette.requests import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.middleware.rate_limit import limiter
from app.schemas.order import OrderUploadResponse
from app.services.customer_service import CustomerService

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/upload", response_model=OrderUploadResponse)
@limiter.limit("3/minute")
async def upload_orders(
    request: Request,
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
):
    """Bulk upload orders from CSV file."""
    content = await file.read()
    service = CustomerService(session)
    result = await service.upload_orders_csv(content)
    return OrderUploadResponse(**result)
