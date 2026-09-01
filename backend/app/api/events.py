from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app.database import get_db
from app.models.entities import SystemEvent

router = APIRouter(prefix="/events", tags=["Event Stream"])

@router.get("")
def list_events(
    event_type: Optional[str] = None,
    service: Optional[str] = None,
    limit: int = Query(50, description="Max events to return"),
    db: Session = Depends(get_db)
):
    query = db.query(SystemEvent)
    if event_type and event_type != "All":
        query = query.filter(SystemEvent.event_type == event_type)
    if service and service != "All":
        query = query.filter(SystemEvent.service == service)

    events = query.order_by(SystemEvent.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": e.id,
            "timestamp": e.timestamp.isoformat(),
            "event_type": e.event_type,
            "service": e.service,
            "resource_id": e.resource_id,
            "severity": e.severity,
            "message": e.message,
            "metadata_json": e.metadata_json or {}
        }
        for e in events
    ]
