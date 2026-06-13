from langgraph.graph import END, StateGraph

from app.agents.audience_agent import audience_node
from app.agents.channel_agent import channel_node
from app.agents.content_agent import content_node
from app.agents.forecast_agent import forecast_node
from app.agents.planner_agent import planner_node
from app.agents.state import CampaignState
from app.database import async_session_factory
from app.rag.embedder import GeminiEmbedder
from app.rag.rag_service import RAGService


async def rag_retrieval_node(state: CampaignState) -> dict:
    query = f"{state.get('campaign_type', '')} {state.get('goal', '')} {state.get('objective', '')}"
    async with async_session_factory() as session:
        embedder = GeminiEmbedder()
        rag = RAGService(session, embedder)
        context = await rag.build_context(query, top_k=5)
    return {
        "rag_context": context,
        "decision_timeline": state.get("decision_timeline", [])
        + [
            {
                "step_name": "rag_retrieval",
                "details": {"query": query, "context_length": len(context)},
            }
        ],
    }


def build_campaign_graph():
    graph = StateGraph(CampaignState)

    graph.add_node("planner_agent", planner_node)
    graph.add_node("rag_retrieval", rag_retrieval_node)
    graph.add_node("audience_agent", audience_node)
    graph.add_node("channel_agent", channel_node)
    graph.add_node("content_agent", content_node)
    graph.add_node("forecast_agent", forecast_node)

    graph.set_entry_point("planner_agent")
    graph.add_edge("planner_agent", "rag_retrieval")
    graph.add_edge("rag_retrieval", "audience_agent")
    graph.add_edge("audience_agent", "channel_agent")
    graph.add_edge("channel_agent", "content_agent")
    graph.add_edge("content_agent", "forecast_agent")
    graph.add_edge("forecast_agent", END)

    return graph.compile()
