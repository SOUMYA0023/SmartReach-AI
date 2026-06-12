import time
from typing import Any

from pydantic import BaseModel, Field

from app.agents.llm_client import call_gemini
from app.agents.state import CampaignState

PLANNER_PROMPT = """
You are a marketing campaign planner.
Given the marketer's goal, identify the campaign type and objective.

Goal: {goal}

Respond ONLY with valid JSON:
{{
  "campaign_type": "winback|loyalty|upsell|cross_sell|retention",
  "objective": "<one sentence>",
  "confidence": 0.0-1.0
}}
"""


class PlannerOutput(BaseModel):
    campaign_type: str
    objective: str
    confidence: float = Field(ge=0.0, le=1.0)


async def planner_node(state: CampaignState) -> dict[str, Any]:
    start = time.perf_counter()
    try:
        prompt = PLANNER_PROMPT.format(goal=state["goal"])
        result = await call_gemini(prompt, PlannerOutput)
        elapsed = int((time.perf_counter() - start) * 1000)
        trace = {
            "agent_name": "planner",
            "input": {"goal": state["goal"]},
            "output": result.model_dump(),
            "confidence": result.confidence,
            "execution_time_ms": elapsed,
        }
        timeline = {
            "step_name": "planner",
            "details": {
                "campaign_type": result.campaign_type,
                "objective": result.objective,
                "confidence": result.confidence,
            },
        }
        return {
            "campaign_type": result.campaign_type,
            "objective": result.objective,
            "planner_confidence": result.confidence,
            "agent_trace": state.get("agent_trace", []) + [trace],
            "decision_timeline": state.get("decision_timeline", []) + [timeline],
        }
    except Exception as e:
        return {"errors": state.get("errors", []) + [f"planner: {str(e)}"]}
