import re

from fastapi import HTTPException

INJECTION_PATTERNS = [
    r"ignore (previous|above|all) instructions",
    r"reveal (your|the) (prompt|system|instructions)",
    r"show (me|us) (your|the) system (message|prompt)",
    r"disregard",
    r"you are now",
    r"act as",
    r"jailbreak",
    r"DAN mode",
]


class PromptGuardService:
    def __init__(self):
        self._patterns = [re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS]

    def validate(self, text: str) -> bool:
        """Returns True if safe. Raises HTTPException 400 if injection detected."""
        for pattern in self._patterns:
            if pattern.search(text):
                raise HTTPException(
                    status_code=400,
                    detail="Potential prompt injection detected. Please revise your input.",
                )
        return True
