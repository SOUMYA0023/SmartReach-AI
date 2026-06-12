import sys
from pathlib import Path

AI_ROOT = Path(__file__).resolve().parent.parent.parent / "ai_service"
sys.path.insert(0, str(AI_ROOT))
