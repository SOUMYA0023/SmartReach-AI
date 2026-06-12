from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api import analytics, campaigns, customers, knowledge, orders, webhooks
from app.config import settings
from app.middleware.logging import RequestLoggingMiddleware
from app.middleware.rate_limit import limiter


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="SmartReach AI — CRM Service",
    description="CRM, analytics, and campaign management for SmartReach AI",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestLoggingMiddleware)

app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(campaigns.router)
app.include_router(analytics.router)
app.include_router(webhooks.router)
app.include_router(knowledge.router)


@app.get("/health")
async def health():
    return {"status": "healthy", "service": settings.SERVICE_NAME}
