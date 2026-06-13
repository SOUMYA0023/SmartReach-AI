import time
from typing import Any

from pydantic import BaseModel, Field

from app.agents.llm_client import call_gemini
from app.agents.state import CampaignState

AUDIENCE_PROMPT = """
You are a customer segmentation expert.
Given the campaign type and customer data summary, select the most appropriate RFM segment.

Campaign Type: {campaign_type}
Customer Data: {customer_data_summary}

Segments available: VIP, Loyal, Potential Loyalist, At Risk, Dormant, New

Respond ONLY with valid JSON:
{{
  "segment": "<segment name>",
  "reasoning": "<why this segment>",
  "audience_size_estimate": <int>,
  "filters": {{"field": "segment", "operator": "eq", "value": "<segment>"}},
  "confidence": 0.0-1.0
}}
"""


class AudienceOutput(BaseModel):
    segment: str
    reasoning: str
    audience_size_estimate: int
    filters: dict
    confidence: float = Field(ge=0.0, le=1.0)


async def audience_node(state: CampaignState) -> dict[str, Any]:
    start = time.perf_counter()
    try:
        prompt = AUDIENCE_PROMPT.format(
            campaign_type=state.get("campaign_type", "retention"),
            customer_data_summary=state.get("customer_data_summary", {}),
        )
        result = await call_gemini(prompt, AudienceOutput)
        elapsed = int((time.perf_counter() - start) * 1000)
        trace = {
            "agent_name": "audience",
            "input": {"campaign_type": state.get("campaign_type"), "customer_data_summary": state.get("customer_data_summary")},
            "output": result.model_dump(),
            "confidence": result.confidence,
            "execution_time_ms": elapsed,
        }
        timeline = {
            "step_name": "audience",
            "details": {
                "segment": result.segment,
                "reasoning": result.reasoning,
                "audience_size_estimate": result.audience_size_estimate,
                "confidence": result.confidence,
            },
        }
        return {
            "segment": result.segment,
            "audience_size": result.audience_size_estimate,
            "audience_filters": result.filters,
            "audience_confidence": result.confidence,
            "agent_trace": state.get("agent_trace", []) + [trace],
            "decision_timeline": state.get("decision_timeline", []) + [timeline],
        }
    except Exception as e:
        return {
            "segment": state.get("segment") or "Loyal",
            "audience_size": state.get("audience_size") or 100,
            "audience_filters": state.get("audience_filters") or {"field": "segment", "operator": "eq", "value": "Loyal"},
            "audience_confidence": 0.0,
            "errors": state.get("errors", []) + [f"audience: {str(e)}"],
        }
