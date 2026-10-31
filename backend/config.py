import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_PATH = Path(os.getenv("DB_PATH", str(BASE_DIR / "database" / "subscription_management.db")))
SCHEMA_PATH = BASE_DIR / "database" / "schema" / "01_init_schema.sql"
SEED_SQL_PATH = BASE_DIR / "database" / "seed_data" / "01_seed_initial_data.sql"
STATIC_DIR = BASE_DIR / "frontend"

# Environment configurations with secure defaults
PORT = int(os.getenv("PORT", 5000))
HOST = os.getenv("HOST", "127.0.0.1")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-only-secret-change-before-deployment")
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_MINUTES = 60 * 24  # 24 hours
PASSWORD_RESET_EXPIRES_MINUTES = 60

COMPANY_NAME = "Brightloop Software"
DEFAULT_CURRENCY = "USD"
