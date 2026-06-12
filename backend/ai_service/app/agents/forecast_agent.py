import time
from typing import Any

from app.agents.state import CampaignState
from app.services.forecast_service import ForecastService


async def forecast_node(state: CampaignState) -> dict[str, Any]:
    start = time.perf_counter()
    service = ForecastService()
    result = service.calculate(
        channel=state.get("channel", "email"),
        segment=state.get("segment", "Loyal"),
        campaign_type=state.get("campaign_type", "retention"),
        audience_size=state.get("audience_size", 100),
    )
    elapsed = int((time.perf_counter() - start) * 1000)
    confidence = 0.85
    trace = {
        "agent_name": "forecast",
        "input": {
            "channel": state.get("channel"),
            "segment": state.get("segment"),
            "campaign_type": state.get("campaign_type"),
            "audience_size": state.get("audience_size"),
        },
        "output": result,
        "confidence": confidence,
        "execution_time_ms": elapsed,
    }
    timeline = {
        "step_name": "forecast",
        "details": {
            "open_rate": result["open_rate"],
            "ctr": result["ctr"],
            "conversion": result["conversion"],
            "revenue": result["revenue"],
            "confidence": confidence,
        },
    }
    return {
        "open_rate": result["open_rate"],
        "ctr": result["ctr"],
        "conversion": result["conversion"],
        "revenue": result["revenue"],
        "forecast_confidence": confidence,
        "agent_trace": state.get("agent_trace", []) + [trace],
        "decision_timeline": state.get("decision_timeline", []) + [timeline],
    }
