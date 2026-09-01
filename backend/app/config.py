import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "CarbonLens"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "production"
    API_PREFIX: str = "/api"
    
    # Database
    DATABASE_URL: str = "sqlite:///./carbonlens.db"
    
    # LLM Settings
    LLM_PROVIDER: str = "mock"  # "openai", "anthropic", "mock"
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    # Cloud Provider Simulation
    CLOUD_PROVIDER: str = "AWS"  # "AWS", "GCP", "AZURE"
    AWS_REGION: str = "ap-south-1"
    SIMULATION_MODE: bool = True
    
    # Carbon Provider
    CARBON_PROVIDER: str = "simulated"  # "co2signal", "electricitymaps", "simulated"
    CARBON_API_KEY: str = ""
    
    # Currency
    DEFAULT_CURRENCY: str = "INR"  # "INR" or "USD"
    USD_TO_INR_RATE: float = 83.5

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
