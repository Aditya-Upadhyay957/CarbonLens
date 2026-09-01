from fastapi import APIRouter, Query
from app.services.carbon_engine import carbon_engine

router = APIRouter(prefix="/carbon", tags=["Carbon Intelligence"])

@router.get("/summary")
async def get_carbon_summary(region: str = Query("ap-south-1", description="Target region code")):
    return await carbon_engine.get_carbon_intelligence_summary(region)

@router.get("/regions")
async def get_regional_grid_comparison():
    summary = await carbon_engine.get_carbon_intelligence_summary("ap-south-1")
    return summary["regional_comparison"]
