from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from starlette.requests import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.middleware.rate_limit import limiter
from app.schemas.customer import CustomerDetailResponse, CustomerListResponse, CustomerResponse, CustomerUploadResponse
from app.services.customer_service import CustomerService

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post("/upload", response_model=CustomerUploadResponse)
@limiter.limit("3/minute")
async def upload_customers(
    request: Request,
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
):
    """Bulk upload customers from CSV file."""
    content = await file.read()
    service = CustomerService(session)
    result = await service.upload_csv(content)
    return CustomerUploadResponse(**result)


@router.get("", response_model=CustomerListResponse)
@limiter.limit("60/minute")
async def list_customers(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    segment: Optional[str] = None,
    city: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
):
    """List customers with optional segment and city filters."""
    service = CustomerService(session)
    customers, total = await service.list_customers(skip=skip, limit=limit, segment=segment, city=city)
    return CustomerListResponse(
        items=[CustomerResponse.model_validate(c) for c in customers],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/{customer_id}", response_model=CustomerDetailResponse)
@limiter.limit("60/minute")
async def get_customer(
    request: Request,
    customer_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """Get customer details with order history."""
    service = CustomerService(session)
    customer = await service.get_customer(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return CustomerDetailResponse.model_validate(customer)
