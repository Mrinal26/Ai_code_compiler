from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Compiler Bot"
    debug: bool = True
    database_url: str
    ollama_model: str = "llama3.2"
    api_v1_prefix: str = "/api/v1"
    cors_origins: str = "*"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )

    @property
    def cors_origins_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]

        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
