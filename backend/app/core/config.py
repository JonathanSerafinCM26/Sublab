from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # App
    env: str = "development"
    port: int = 8000
    debug: bool = True
    
    # Database
    database_url: str = "postgresql://sublab:sublab@db:5432/sublab"
    
    # API Keys
    openrouter_api_key: str = ""
    fish_audio_api_key: str = ""
    
    # Paths
    weights_path: str = "/app/weights"
    voices_path: str = "/app/voices"
    audio_cache_path: str = "/app/audio_cache"
    
    # Kokoro TTS
    kokoro_model_path: Optional[str] = None
    kokoro_voices_path: Optional[str] = None
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
