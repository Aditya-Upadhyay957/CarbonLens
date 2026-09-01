from fastapi import APIRouter
from app.config import settings
from app.models.schemas import SettingsUpdateRequest

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("")
def get_current_settings():
    return {
        "app_name": settings.APP_NAME,
        "app_version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "llm_provider": settings.LLM_PROVIDER,
        "has_openai_key": bool(settings.OPENAI_API_KEY),
        "has_anthropic_key": bool(settings.ANTHROPIC_API_KEY),
        "cloud_provider": settings.CLOUD_PROVIDER,
        "aws_region": settings.AWS_REGION,
        "carbon_provider": settings.CARBON_PROVIDER,
        "has_carbon_key": bool(settings.CARBON_API_KEY),
        "simulation_mode": settings.SIMULATION_MODE,
        "default_currency": settings.DEFAULT_CURRENCY,
        "usd_to_inr_rate": settings.USD_TO_INR_RATE
    }

@router.post("")
def update_settings(payload: SettingsUpdateRequest):
    if payload.llm_provider is not None:
        settings.LLM_PROVIDER = payload.llm_provider
    if payload.openai_api_key is not None:
        settings.OPENAI_API_KEY = payload.openai_api_key
    if payload.anthropic_api_key is not None:
        settings.ANTHROPIC_API_KEY = payload.anthropic_api_key
    if payload.carbon_provider is not None:
        settings.CARBON_PROVIDER = payload.carbon_provider
    if payload.carbon_api_key is not None:
        settings.CARBON_API_KEY = payload.carbon_api_key
    if payload.simulation_mode is not None:
        settings.SIMULATION_MODE = payload.simulation_mode
    if payload.default_currency is not None:
        settings.DEFAULT_CURRENCY = payload.default_currency

    return {
        "message": "Settings updated successfully",
        "current_settings": {
            "llm_provider": settings.LLM_PROVIDER,
            "carbon_provider": settings.CARBON_PROVIDER,
            "simulation_mode": settings.SIMULATION_MODE,
            "default_currency": settings.DEFAULT_CURRENCY
        }
    }
