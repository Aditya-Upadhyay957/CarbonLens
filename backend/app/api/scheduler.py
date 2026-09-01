from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.entities import ScheduledJob
from app.models.schemas import JobScheduleRequest, WhatIfRequest
from app.services.scheduler_engine import scheduler_engine

router = APIRouter(prefix="/scheduler", tags=["Smart Scheduler & Simulator"])

@router.get("/jobs")
def get_scheduled_jobs(db: Session = Depends(get_db)):
    jobs = db.query(ScheduledJob).all()
    return [
        {
            "id": j.id,
            "name": j.name,
            "job_type": j.job_type,
            "duration_hours": j.duration_hours,
            "compute_units": j.compute_units,
            "current_schedule_hour": j.current_schedule_hour,
            "recommended_schedule_hour": j.recommended_schedule_hour,
            "preferred_region": j.preferred_region,
            "optimization_goal": j.optimization_goal,
            "current_cost_inr": j.current_cost_inr,
            "recommended_cost_inr": j.recommended_cost_inr,
            "cost_savings_inr": j.cost_savings_inr,
            "cost_savings_pct": j.cost_savings_pct,
            "current_carbon_gco2": j.current_carbon_gco2,
            "recommended_carbon_gco2": j.recommended_carbon_gco2,
            "carbon_reduction_pct": j.carbon_reduction_pct,
            "status": j.status
        }
        for j in jobs
    ]

@router.post("/optimize")
def optimize_job(request: JobScheduleRequest, db: Session = Depends(get_db)):
    result = scheduler_engine.optimize_job_schedule(
        job_name=request.job_name,
        job_type=request.job_type,
        duration_hours=request.duration_hours,
        compute_units=request.compute_units,
        current_hour=request.current_schedule_hour,
        deadline_hour=request.deadline_hour,
        region=request.preferred_region,
        optimization_goal=request.optimization_goal
    )
    return result

@router.post("/what-if")
def calculate_what_if(request: WhatIfRequest):
    result = scheduler_engine.compute_what_if_scenario(
        workload_type=request.workload_type,
        current_hour=request.current_hour,
        target_hour=request.target_hour,
        duration_hours=request.duration_hours,
        compute_units=request.compute_units,
        region=request.region
    )
    return result
