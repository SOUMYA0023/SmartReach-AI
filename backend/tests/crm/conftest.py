import os
import sys
from pathlib import Path

CRM_ROOT = Path(__file__).resolve().parent.parent.parent / "crm_service"
sys.path.insert(0, str(CRM_ROOT))

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://smartreach:password@localhost:5432/smartreach_test")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/1")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
