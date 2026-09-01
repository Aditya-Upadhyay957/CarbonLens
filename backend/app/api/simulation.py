from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app.models.schemas import DemoScenarioRequest
from app.services.simulation_engine import simulation_engine

router = APIRouter(prefix="/simulation", tags=["Live Simulation & Scenarios"])

@router.post("/cost-spike")
def simulate_cost_spike(
    service: str = Query("EC2", description="Target service (EC2, Lambda, SageMaker, RDS)"),
    db: Session = Depends(get_db)
):
    result = simulation_engine.simulate_cost_spike_event(db, service)
    return result

@router.post("/trigger-scenario")
def trigger_scenario_endpoint(
    request: DemoScenarioRequest,
    db: Session = Depends(get_db)
):
    result = simulation_engine.trigger_scenario(db, request.scenario_id)
    return result

@router.post("/reset")
def reset_demo_data(db: Session = Depends(get_db)):
    # Re-seed fresh baseline
    simulation_engine.seed_initial_database(db)
    return {"message": "Demo data refreshed successfully"}
