from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app.database import get_db
from app.models.entities import Recommendation
from app.services.recommendation_engine import recommendation_engine

router = APIRouter(prefix="/recommendations", tags=["Optimization Recommendations"])

@router.get("")
def list_recommendations(
    category: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    recommendations = recommendation_engine.generate_recommendations(db)
    
    query = db.query(Recommendation)
    if category and category != "All":
        query = query.filter(Recommendation.category == category)
    if priority and priority != "All":
        query = query.filter(Recommendation.priority == priority)
    if status and status != "All":
        query = query.filter(Recommendation.status == status)

    recs = query.all()
    return [
        {
            "id": r.id,
            "title": r.title,
            "service": r.service,
            "category": r.category,
            "priority": r.priority,
            "financial_saving_monthly_inr": r.financial_saving_monthly_inr,
            "carbon_reduction_pct": r.carbon_reduction_pct,
            "confidence": r.confidence,
            "reason": r.reason,
            "action_text": r.action_text,
            "status": r.status,
            "created_at": r.created_at.isoformat()
        }
        for r in recs
    ]

@router.post("/{rec_id}/apply")
def apply_recommendation(rec_id: str, db: Session = Depends(get_db)):
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    rec.status = "Applied"
    db.commit()
    return {"message": f"Recommendation {rec_id} applied successfully", "status": "Applied"}

@router.post("/{rec_id}/dismiss")
def dismiss_recommendation(rec_id: str, db: Session = Depends(get_db)):
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    rec.status = "Dismissed"
    db.commit()
    return {"message": f"Recommendation {rec_id} dismissed", "status": "Dismissed"}
