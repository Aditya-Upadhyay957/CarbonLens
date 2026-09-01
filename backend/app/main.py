from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.services.simulation_engine import simulation_engine

# Import API routers
from app.api.dashboard import router as dashboard_router
from app.api.cost import router as cost_router
from app.api.anomalies import router as anomalies_router
from app.api.ai import router as ai_router
from app.api.carbon import router as carbon_router
from app.api.scheduler import router as scheduler_router
from app.api.recommendations import router as recommendations_router
from app.api.resources import router as resources_router
from app.api.events import router as events_router
from app.api.reports import router as reports_router
from app.api.simulation import router as simulation_router
from app.api.settings import router as settings_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed demo data
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        simulation_engine.seed_initial_database(db)
    finally:
        db.close()
    yield
    # Shutdown

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="CarbonLens - AI-Powered Cloud Cost & Carbon Intelligence Engine",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
api_prefix = settings.API_PREFIX
app.include_router(dashboard_router, prefix=api_prefix)
app.include_router(cost_router, prefix=api_prefix)
app.include_router(anomalies_router, prefix=api_prefix)
app.include_router(ai_router, prefix=api_prefix)
app.include_router(carbon_router, prefix=api_prefix)
app.include_router(scheduler_router, prefix=api_prefix)
app.include_router(recommendations_router, prefix=api_prefix)
app.include_router(resources_router, prefix=api_prefix)
app.include_router(events_router, prefix=api_prefix)
app.include_router(reports_router, prefix=api_prefix)
app.include_router(simulation_router, prefix=api_prefix)
app.include_router(settings_router, prefix=api_prefix)

@app.get("/api/health")
def health_check():
    return {
        "status": "operational",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "simulation_mode": settings.SIMULATION_MODE,
        "llm_provider": settings.LLM_PROVIDER
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
