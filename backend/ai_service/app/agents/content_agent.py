import time
from typing import Any, Optional

from pydantic import BaseModel, Field

from app.agents.llm_client import call_gemini
from app.agents.state import CampaignState

CONTENT_PROMPT = """
You are a D2C marketing copywriter.
Write a personalised campaign message.

Campaign Type: {campaign_type}
Audience Segment: {segment}
Channel: {channel}
Objective: {objective}

Marketing Intelligence (RAG context):
{rag_context}

Rules:
- WhatsApp/SMS: under 160 chars, conversational, single CTA
- Email: subject line + 2-3 sentence body, value-first
- RCS: rich text with emoji, single action button label included

Respond ONLY with valid JSON:
{{
  "subject": "<email subject or null>",
  "message": "<campaign message>",
  "cta": "<call to action text>",
  "confidence": 0.0-1.0
}}
"""


class ContentOutput(BaseModel):
    subject: Optional[str] = None
    message: str
    cta: str
    confidence: float = Field(ge=0.0, le=1.0)


async def content_node(state: CampaignState) -> dict[str, Any]:
    start = time.perf_counter()
    rag_context = state.get("rag_context") or "No RAG context available."
    try:
        prompt = CONTENT_PROMPT.format(
            campaign_type=state.get("campaign_type", "retention"),
            segment=state.get("segment", "Loyal"),
            channel=state.get("channel", "email"),
            objective=state.get("objective", state.get("goal", "")),
            rag_context=rag_context,
        )
        result = await call_gemini(prompt, ContentOutput)
        elapsed = int((time.perf_counter() - start) * 1000)
        trace = {
            "agent_name": "content",
            "input": {
                "campaign_type": state.get("campaign_type"),
                "segment": state.get("segment"),
                "channel": state.get("channel"),
                "rag_context_included": bool(rag_context),
            },
            "output": result.model_dump(),
            "confidence": result.confidence,
            "execution_time_ms": elapsed,
        }
        timeline = {
            "step_name": "content",
            "details": {
                "message_preview": result.message[:100],
                "cta": result.cta,
                "confidence": result.confidence,
            },
        }
        return {
            "message": result.message,
            "subject": result.subject,
            "cta": result.cta,
            "message_confidence": result.confidence,
            "agent_trace": state.get("agent_trace", []) + [trace],
            "decision_timeline": state.get("decision_timeline", []) + [timeline],
        }
    except Exception as e:
        return {"errors": state.get("errors", []) + [f"content: {str(e)}"]}
