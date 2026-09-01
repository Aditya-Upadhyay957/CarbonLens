from fastapi import APIRouter, Depends, Response, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.entities import FinOpsReport
from app.models.schemas import ReportGenerateRequest
from app.services.report_engine import report_engine

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("")
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(FinOpsReport).order_by(FinOpsReport.generated_at.desc()).all()
    if not reports:
        # Seed default monthly report
        default_report = report_engine.generate_report(db, "Monthly FinOps", 30)
        reports = [default_report]

    return [
        {
            "id": r.id,
            "title": r.title,
            "report_type": r.report_type,
            "period_start": r.period_start.isoformat(),
            "period_end": r.period_end.isoformat(),
            "generated_at": r.generated_at.isoformat(),
            "total_spend_inr": r.total_spend_inr,
            "total_carbon_kg": r.total_carbon_kg,
            "identified_savings_inr": r.identified_savings_inr,
            "anomaly_count": r.anomaly_count,
            "executive_summary": r.executive_summary,
            "raw_data_summary": r.raw_data_summary or {}
        }
        for r in reports
    ]

@router.post("/generate")
def generate_new_report(request: ReportGenerateRequest, db: Session = Depends(get_db)):
    report = report_engine.generate_report(db, request.report_type, request.date_range_days)
    return {
        "id": report.id,
        "title": report.title,
        "report_type": report.report_type,
        "period_start": report.period_start.isoformat(),
        "period_end": report.period_end.isoformat(),
        "generated_at": report.generated_at.isoformat(),
        "total_spend_inr": report.total_spend_inr,
        "total_carbon_kg": report.total_carbon_kg,
        "identified_savings_inr": report.identified_savings_inr,
        "anomaly_count": report.anomaly_count,
        "executive_summary": report.executive_summary,
        "raw_data_summary": report.raw_data_summary or {}
    }

@router.get("/export/csv")
def export_csv(
    entity: str = Query("billing", description="'billing', 'resources', 'anomalies', 'recommendations'"),
    db: Session = Depends(get_db)
):
    csv_content = report_engine.export_csv_data(db, entity)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=carbonlens_{entity}_export.csv"}
    )
