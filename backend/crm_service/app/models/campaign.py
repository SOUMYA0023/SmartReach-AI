import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, String, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    goal: Mapped[str] = mapped_column(String(1000), nullable=False)
    channel: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="DRAFT", index=True)
    message: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True)
    campaign_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    segment: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    predicted_open_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    predicted_ctr: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    predicted_conversion: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    predicted_revenue: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    audiences: Mapped[list["CampaignAudience"]] = relationship(
        "CampaignAudience", back_populates="campaign", cascade="all, delete-orphan"
    )


class CampaignAudience(Base):
    __tablename__ = "campaign_audiences"
    __table_args__ = (UniqueConstraint("campaign_id", "customer_id", name="uq_campaign_customer"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True
    )

    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="audiences")
