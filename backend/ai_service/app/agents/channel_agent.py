import time
from typing import Any

from pydantic import BaseModel, Field

from app.agents.llm_client import call_gemini
from app.agents.state import CampaignState

CHANNEL_PROMPT = """
You are a channel strategy expert for D2C brands.
Select the best communication channel for this campaign.

Segment: {segment}
Campaign Type: {campaign_type}
RAG Context:
{rag_context}

Channels: whatsapp, email, sms, rcs

Respond ONLY with valid JSON:
{{
  "channel": "<channel>",
  "reasoning": "<why this channel>",
  "confidence": 0.0-1.0
}}
"""


class ChannelOutput(BaseModel):
    channel: str
    reasoning: str
    confidence: float = Field(ge=0.0, le=1.0)


async def channel_node(state: CampaignState) -> dict[str, Any]:
    start = time.perf_counter()
    try:
        prompt = CHANNEL_PROMPT.format(
            segment=state.get("segment", "Loyal"),
            campaign_type=state.get("campaign_type", "retention"),
            rag_context=state.get("rag_context", ""),
        )
        result = await call_gemini(prompt, ChannelOutput)
        elapsed = int((time.perf_counter() - start) * 1000)
        trace = {
            "agent_name": "channel",
            "input": {"segment": state.get("segment"), "campaign_type": state.get("campaign_type")},
            "output": result.model_dump(),
            "confidence": result.confidence,
            "execution_time_ms": elapsed,
        }
        timeline = {
            "step_name": "channel",
            "details": {
                "channel": result.channel,
                "reasoning": result.reasoning,
                "confidence": result.confidence,
            },
        }
        return {
            "channel": result.channel.lower(),
            "channel_confidence": result.confidence,
            "agent_trace": state.get("agent_trace", []) + [trace],
            "decision_timeline": state.get("decision_timeline", []) + [timeline],
        }
    except Exception as e:
        return {"errors": state.get("errors", []) + [f"channel: {str(e)}"]}
