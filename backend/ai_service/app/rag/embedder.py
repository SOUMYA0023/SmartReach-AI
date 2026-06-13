import asyncio

import google.generativeai as genai

from app.config import settings


class GeminiEmbedder:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)

    async def embed(self, text: str, task_type: str = "retrieval_document") -> list[float]:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: genai.embed_content(
                model="models/gemini-embedding-2",
                content=text,
                task_type=task_type,
                output_dimensionality=768,
            ),
        )
        return result["embedding"]
