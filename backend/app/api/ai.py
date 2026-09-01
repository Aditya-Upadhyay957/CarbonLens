from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schemas import AIInvestigationRequest
from app.services.ai_explainer import ai_explainer_service

router = APIRouter(prefix="/ai", tags=["AI Cost Investigator"])

@router.post("/investigate")
async def investigate_anomaly_endpoint(request: AIInvestigationRequest, db: Session = Depends(get_db)):
    try:
        analysis = await ai_explainer_service.investigate_anomaly(
            db, request.anomaly_id, force_refresh=request.force_refresh or False
        )
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
        raise HTTPException(status_code=500, detail=str(e))
