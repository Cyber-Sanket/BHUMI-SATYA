import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Always place sqlite database at backend/bhumi_satya.db
BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BACKEND_DIR / "bhumi_satya.db"

class Settings(BaseSettings):
    PROJECT_NAME: str = "BHUMI-SATYA"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "BHUMI_SATYA_SECRET_KEY_DEV_ONLY_FALLBACK")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database URL using absolute path
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{DEFAULT_DB_PATH.as_posix()}"
    )
    
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "*")
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

if settings.ENVIRONMENT.lower() in ("production", "prod") and settings.SECRET_KEY == "BHUMI_SATYA_SECRET_KEY_DEV_ONLY_FALLBACK":
    raise ValueError("CRITICAL SECURITY ERROR: SECRET_KEY environment variable MUST be explicitly configured in production mode!")

