import json
from pathlib import Path
from typing import List, Union

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "AI Intelligent Workspace"
    app_version: str = "0.1.0"
    environment: str = "development"

    database_url: str
    secret_key: str
    access_token_expire_minutes: int = 30000000

    # CORS — comma-separated origins or JSON array in env var ALLOWED_ORIGINS
    allowed_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost",
        "http://localhost:80",
        "http://127.0.0.1",
        "https://my-aii-intelligent-app.vercel.app",
    ]

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v_trimmed = v.strip()
            if v_trimmed.startswith("[") and v_trimmed.endswith("]"):
                try:
                    parsed = json.loads(v_trimmed)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if item]
                except Exception:
                    pass
            return [origin.strip() for origin in v_trimmed.split(",") if origin.strip()]
        elif isinstance(v, list):
            return [str(item).strip() for item in v if item]
        return v

    # SMTP / Gmail Settings
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = "rrakshith349@gmail.com"
    smtp_password: str = "fevc bpis ukjr ucqs"
    emails_enabled: bool = True
    frontend_url: str = "https://my-aii-intelligent-app.vercel.app"

    # Resend API (disabled by default so Gmail SMTP can send to ANY recipient email)
    resend_api_key: str = ""
    resend_from_email: str = ""
    resend_from_domain: str = "resend.dev"

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()