from typing import Any, Optional
from pydantic import PostgresDsn, field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Algo Visualizer API"
    API_V1_STR: str = "/api/v1"
    
    DATABASE_URL: str
    REDIS_URL: str = "redis://redis:6379/0"

    @field_validator("DATABASE_URL", mode="before")
    def assemble_db_connection(cls, v: Optional[str]) -> Any:
        if isinstance(v, str):
            return v
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username="postgres",
            password="postgres",
            host="db",
            path="algo_db",
        )

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
