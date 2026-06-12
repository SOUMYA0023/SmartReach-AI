from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_model import KnowledgeDocument
from app.rag.embedder import GeminiEmbedder


class RAGService:
    def __init__(self, session: AsyncSession, embedder: GeminiEmbedder):
        self.session = session
        self.embedder = embedder

    async def embed_document(self, content: str) -> list[float]:
        """Embed a single text string."""
        return await self.embedder.embed(content, task_type="retrieval_document")

    async def store_document(self, title: str, category: str, content: str) -> KnowledgeDocument:
        """Embed and persist a knowledge document."""
        embedding = await self.embed_document(content)
        doc = KnowledgeDocument(title=title, category=category, content=content, embedding=embedding)
        self.session.add(doc)
        await self.session.flush()
        await self.session.refresh(doc)
        return doc

    async def retrieve_documents(
        self, query: str, top_k: int = 5, category_filter: Optional[str] = None
    ) -> list[KnowledgeDocument]:
        """
        1. Embed the query using task_type="retrieval_query"
        2. Run pgvector cosine similarity search
        3. Optionally filter by category before similarity ranking.
        """
        query_embedding = await self.embedder.embed(query, task_type="retrieval_query")
        distance = KnowledgeDocument.embedding.cosine_distance(query_embedding)

        stmt = select(KnowledgeDocument).where(KnowledgeDocument.embedding.isnot(None))
        if category_filter:
            stmt = stmt.where(KnowledgeDocument.category == category_filter)
        stmt = stmt.order_by(distance).limit(top_k)

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def build_context(self, query: str, top_k: int = 5) -> str:
        """Retrieve top_k documents and format them into a numbered context block."""
        docs = await self.retrieve_documents(query, top_k=top_k)
        if not docs:
            return "No marketing intelligence documents found."
        blocks = []
        for i, doc in enumerate(docs, 1):
            blocks.append(
                f"[{i}] CATEGORY: {doc.category.upper()}\n"
                f"Title: {doc.title}\n"
                f"Content: {doc.content}"
            )
        return "\n\n".join(blocks)

    async def is_empty(self) -> bool:
        result = await self.session.execute(select(func.count()).select_from(KnowledgeDocument))
        return result.scalar_one() == 0
