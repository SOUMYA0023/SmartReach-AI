from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CommunicationEventPayload(BaseModel):
    communication_id: UUID
    event_type: str
    timestamp: datetime


class WebhookAcceptedResponse(BaseModel):
    status: str
    message: str
