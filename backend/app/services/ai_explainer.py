from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any, Optional
from app.models.entities import Anomaly, AIAnalysis, SystemEvent
from app.providers.llm_provider import llm_provider

class AIExplainerService:
    """
    Orchestrates AI investigation for detected cloud anomalies.
    Fetches raw telemetry, triggers LLM provider, and persists the root cause breakdown.
    """

    async def investigate_anomaly(self, db: Session, anomaly_id: str, force_refresh: bool = False) -> AIAnalysis:
        anomaly = db.query(Anomaly).filter(Anomaly.id == anomaly_id).first()
        if not anomaly:
            raise ValueError(f"Anomaly with ID {anomaly_id} not found")

        # Return cached analysis if available and refresh not forced
        if anomaly.analysis and not force_refresh:
            return anomaly.analysis

        # Prepare payload for LLM
        payload = {
            "service": anomaly.service,
            "region": anomaly.region,
            "environment": anomaly.environment,
            "baseline_cost_inr": anomaly.baseline_cost_inr,
            "current_cost_inr": anomaly.current_cost_inr,
            "potential_impact_inr": anomaly.potential_impact_inr,
            "cost_increase_pct": anomaly.cost_increase_pct,
            "anomaly_score": anomaly.anomaly_score,
            "telemetry_data": anomaly.telemetry_data or {}
        }

        # Generate structured explanation
        analysis_data = await llm_provider.generate_explanation(payload)

        # Update or create AIAnalysis in database
        if anomaly.analysis:
            analysis = anomaly.analysis
            analysis.generated_at = datetime.utcnow()
            analysis.provider_used = analysis_data.get("provider_used", "AI FinOps Engine")
            analysis.summary = analysis_data.get("summary", "")
            analysis.probable_causes = analysis_data.get("probable_causes", [])
            analysis.evidence = analysis_data.get("evidence", {})
            analysis.confidence_score = float(analysis_data.get("confidence_score", 85.0))
            analysis.business_impact = analysis_data.get("business_impact", "")
            analysis.estimated_financial_loss = float(analysis_data.get("estimated_financial_loss_inr", anomaly.potential_impact_inr))
            analysis.recommended_actions = analysis_data.get("recommended_actions", [])
            analysis.remediation_code = analysis_data.get("remediation_code")
        else:
            analysis = AIAnalysis(
                anomaly_id=anomaly.id,
                generated_at=datetime.utcnow(),
                provider_used=analysis_data.get("provider_used", "AI FinOps Engine"),
                summary=analysis_data.get("summary", ""),
                probable_causes=analysis_data.get("probable_causes", []),
                evidence=analysis_data.get("evidence", {}),
                confidence_score=float(analysis_data.get("confidence_score", 85.0)),
                business_impact=analysis_data.get("business_impact", ""),
                estimated_financial_loss=float(analysis_data.get("estimated_financial_loss_inr", anomaly.potential_impact_inr)),
                recommended_actions=analysis_data.get("recommended_actions", []),
                remediation_code=analysis_data.get("remediation_code")
            )
            db.add(analysis)

        # Update anomaly status
        anomaly.status = "Investigated"
        anomaly.ai_confidence = analysis.confidence_score

        # Log system event
        event = SystemEvent(
            event_type="AI_ANALYSIS",
            service=anomaly.service,
            resource_id=anomaly.id,
            severity="INFO",
            message=f"AI Cost Investigator completed root cause analysis for {anomaly.id} ({anomaly.service})",
            metadata_json={"confidence": analysis.confidence_score, "provider": analysis.provider_used}
        )
        db.add(event)
        
        db.commit()
        db.refresh(analysis)
        return analysis

ai_explainer_service = AIExplainerService()
