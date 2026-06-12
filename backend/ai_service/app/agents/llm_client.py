import json
import re
from typing import Type, TypeVar

import google.generativeai as genai
from pydantic import BaseModel

from app.config import settings

T = TypeVar("T", bound=BaseModel)

genai.configure(api_key=settings.GEMINI_API_KEY)


def _extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\n?", "", text)
        text = re.sub(r"\n?```$", "", text)
    return json.loads(text)


async def call_gemini(prompt: str, response_model: Type[T]) -> T:
    model = genai.GenerativeModel(settings.GEMINI_MODEL)
    response = await model.generate_content_async(prompt)
    raw = response.text or "{}"
    data = _extract_json(raw)
    return response_model.model_validate(data)
