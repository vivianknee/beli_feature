from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str
    beli_base_url: str = "https://api.beli.app"
    secret_key: str
    whisper_model: str = "base"

    class Config:
        env_file = ".env"


settings = Settings()
