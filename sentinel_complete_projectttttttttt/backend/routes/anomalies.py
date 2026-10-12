from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.database import get_db
from backend.schemas import AnomalyResponse, AnomalyRunResponse
from backend.services.detection_service import detection_service

router = APIRouter(tags=["Anomalies & Detection"])

@router.post("/api/v1/anomalies/run", response_model=AnomalyRunResponse)
def run_anomaly_detection(db: Session = Depends(get_db)):
    result = detection_service.run_detection(db)
    return result

@router.get("/api/v1/anomalies", response_model=List[AnomalyResponse])
def get_anomalies(
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    building_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return detection_service.list_anomalies(
        db,
        severity=severity,
        status=status,
        building_id=building_id
    )

@router.get("/api/v1/anomalies/{anomaly_id}")
def get_anomaly_detail(anomaly_id: str, db: Session = Depends(get_db)):
    detail = detection_service.get_anomaly_detail(db, anomaly_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Anomaly alert not found")
    return detail
