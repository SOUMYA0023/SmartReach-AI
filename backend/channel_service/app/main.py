from uuid import UUID

from fastapi import FastAPI
from pydantic import BaseModel

from app.config import settings
from app.workers.delivery_tasks import simulate_delivery

app = FastAPI(
    title="SmartReach AI — Channel Service",
    description="Channel simulator for WhatsApp, Email, SMS, and RCS",
    version="1.0.0",
)


class SendRequest(BaseModel):
    communication_id: UUID
    campaign_id: UUID
    customer_id: UUID
    channel: str
    message: str
    recipient: str


class SendResponse(BaseModel):
    accepted: bool
    communication_id: UUID


@app.post("/send", response_model=SendResponse)
async def send(request: SendRequest):
    """Accept communication dispatch and simulate delivery asynchronously."""
    simulate_delivery.delay(str(request.communication_id), request.channel)
    return SendResponse(accepted=True, communication_id=request.communication_id)


@app.get("/health")
async def health():
    return {"status": "healthy", "service": settings.SERVICE_NAME}
