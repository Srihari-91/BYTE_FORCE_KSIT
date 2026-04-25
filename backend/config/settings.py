from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    SERPAPI_API_KEY: str = ""
    SEMANTIC_SCHOLAR_API_KEY: str = ""
    CROSSREF_MAILTO: str = ""
    LOG_LEVEL: str = "INFO"
    DEBUG: bool = True
    
    # Path settings
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR.parent / "data"
    
    # Load env from repo root or app root (whichever exists)
    model_config = SettingsConfigDict(
        env_file=[
            str((BASE_DIR.parent / ".env").resolve()),  # ai-research-war-room/.env
            str((BASE_DIR.parent.parent / ".env").resolve()),  # BYTE_FORCE_KSIT-main/.env
            str((BASE_DIR.parent.parent.parent / ".env").resolve()),  # MULTI-AGENT-RESEARCH-TEAM/.env
            ".env",
        ],
        extra="ignore",
    )

settings = Settings()
#completed

