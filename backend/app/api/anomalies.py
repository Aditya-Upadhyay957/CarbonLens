from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app.database import get_db
from app.models.entities import Anomaly
from app.models.schemas import AnomalyResponse
from app.services.ai_explainer import ai_explainer_service

router = APIRouter(prefix="/anomalies", tags=["Anomaly Detection"])

@router.get("", response_model=List[Dict[str, Any]])
def list_anomalies(
    severity: Optional[str] = None,
    service: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Anomaly)
    if severity and severity != "All":
        query = query.filter(Anomaly.severity == severity)
    if service and service != "All":
        query = query.filter(Anomaly.service == service)
    if status and status != "All":
        query = query.filter(Anomaly.status == status)

    anomalies = query.order_by(Anomaly.detected_at.desc()).all()
    
    result = []
    for a in anomalies:
        result.append({
            "id": a.id,
            "title": a.title,
            "service": a.service,
            "environment": a.environment,
            "region": a.region,
            "severity": a.severity,
            "detected_at": a.detected_at.isoformat(),
            "anomaly_score": a.anomaly_score,
            "cost_increase_pct": a.cost_increase_pct,
            "baseline_cost_inr": a.baseline_cost_inr,
            "current_cost_inr": a.current_cost_inr,
            "potential_impact_inr": a.potential_impact_inr,
            "probable_cause": a.probable_cause,
            "ai_confidence": a.ai_confidence,
            "status": a.status,
            "telemetry_data": a.telemetry_data or {},
            "has_ai_analysis": a.analysis is not None
        })
    return result

@router.get("/{anomaly_id}")
def get_anomaly_detail(anomaly_id: str, db: Session = Depends(get_db)):
    anomaly = db.query(Anomaly).filter(Anomaly.id == anomaly_id).first()
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")

    return {
        "id": anomaly.id,
        "title": anomaly.title,
        "service": anomaly.service,
        "environment": anomaly.environment,
        "region": anomaly.region,
        "severity": anomaly.severity,
        "detected_at": anomaly.detected_at.isoformat(),
        "anomaly_score": anomaly.anomaly_score,
        "cost_increase_pct": anomaly.cost_increase_pct,
        "baseline_cost_inr": anomaly.baseline_cost_inr,
        "current_cost_inr": anomaly.current_cost_inr,
        "potential_impact_inr": anomaly.potential_impact_inr,
        "probable_cause": anomaly.probable_cause,
        "ai_confidence": anomaly.ai_confidence,
        "status": anomaly.status,
        "telemetry_data": anomaly.telemetry_data or {},
        "analysis": {
            "summary": anomaly.analysis.summary,
            "probable_causes": anomaly.analysis.probable_causes,
            "evidence": anomaly.analysis.evidence,
            "confidence_score": anomaly.analysis.confidence_score,
            "business_impact": anomaly.analysis.business_impact,
            "estimated_financial_loss": anomaly.analysis.estimated_financial_loss,
            "recommended_actions": anomaly.analysis.recommended_actions,
            "remediation_code": anomaly.analysis.remediation_code,
            "provider_used": anomaly.analysis.provider_used
        } if anomaly.analysis else None
    }

@router.post("/{anomaly_id}/explain")
async def explain_anomaly(
    anomaly_id: str,
    force_refresh: bool = False,
    db: Session = Depends(get_db)
):
    try:
        analysis = await ai_explainer_service.investigate_anomaly(db, anomaly_id, force_refresh)
        return {
            "anomaly_id": analysis.anomaly_id,
            "generated_at": analysis.generated_at.isoformat(),
            "provider_used": analysis.provider_used,
            "summary": analysis.summary,
            "probable_causes": analysis.probable_causes,
            "evidence": analysis.evidence,
            "confidence_score": analysis.confidence_score,
            "business_impact": analysis.business_impact,
            "estimated_financial_loss_inr": analysis.estimated_financial_loss,
            "recommended_actions": analysis.recommended_actions,
            "remediation_code": analysis.remediation_code
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Investigation failed: {str(e)}")
