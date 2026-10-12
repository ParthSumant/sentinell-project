from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from typing import Optional
from backend.database import get_db
from backend.schemas import ImpactSummaryResponse
from backend.services.impact_service import impact_service, reports_service

router = APIRouter(tags=["Impact & Reports"])

@router.get("/api/v1/impact/summary", response_model=ImpactSummaryResponse)
def get_impact_summary(
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    db: Session = Depends(get_db)
):
    return impact_service.get_impact_summary(db, from_date=from_date, to_date=to_date)

@router.get("/api/v1/export/summary.csv")
def export_summary_csv(db: Session = Depends(get_db)):
    csv_content = reports_service.export_summary_csv(db)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sentinel_anomalies_summary.csv"}
    )
