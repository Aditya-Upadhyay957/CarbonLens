from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app.database import get_db
from app.models.entities import CloudResource

router = APIRouter(prefix="/resources", tags=["Cloud Resources"])

@router.get("")
def list_resources(
    service: Optional[str] = None,
    environment: Optional[str] = None,
    region: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(CloudResource)

    if service and service != "All":
        query = query.filter(CloudResource.service == service)
    if environment and environment != "All":
        query = query.filter(CloudResource.environment == environment)
    if region and region != "All":
        query = query.filter(CloudResource.region == region)
    if status and status != "All":
        query = query.filter(CloudResource.status == status)
    if search:
        s = f"%{search}%"
        query = query.filter((CloudResource.name.ilike(s)) | (CloudResource.id.ilike(s)))

    resources = query.all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "service": r.service,
            "provider": r.provider,
            "region": r.region,
            "environment": r.environment,
            "status": r.status,
            "hourly_cost_inr": r.hourly_cost_inr,
            "daily_cost_inr": r.daily_cost_inr,
            "utilization_percent": r.utilization_percent,
            "carbon_rating": r.carbon_rating,
            "risk_level": r.risk_level,
            "instance_type": r.instance_type,
            "tags": r.tags or {}
        }
        for r in resources
    ]

@router.get("/{resource_id}")
def get_resource_detail(resource_id: str, db: Session = Depends(get_db)):
    resource = db.query(CloudResource).filter(CloudResource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return {
        "id": resource.id,
        "name": resource.name,
        "service": resource.service,
        "provider": resource.provider,
        "region": resource.region,
        "environment": resource.environment,
        "status": resource.status,
        "hourly_cost_inr": resource.hourly_cost_inr,
        "daily_cost_inr": resource.daily_cost_inr,
        "utilization_percent": resource.utilization_percent,
        "carbon_rating": resource.carbon_rating,
        "risk_level": resource.risk_level,
        "instance_type": resource.instance_type,
        "tags": resource.tags or {}
    }
