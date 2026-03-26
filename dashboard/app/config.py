from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    dashboard_password: str = "changeme"
    jwt_secret: str = "change-this-to-a-long-random-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_days: int = 30

    tailscale_client_id: str = ""
    tailscale_client_secret: str = ""
    tailscale_tailnet: str = "-"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
