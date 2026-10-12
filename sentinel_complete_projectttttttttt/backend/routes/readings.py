from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from backend.database import get_db
from backend.models import Reading
from backend.schemas import ReadingResponse, ReadingImportReport
from backend.services.ingestion_service import ingestion_service

router = APIRouter(tags=["Readings & Ingestion"])

@router.get("/api/v1/readings", response_model=List[ReadingResponse])
def get_readings(
    space_id: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    limit: int = Query(50, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    q = db.query(Reading)
    if space_id:
        q = q.filter(Reading.space_id == space_id)
    if resource_type:
        q = q.filter(Reading.resource_type == resource_type)
    if from_date:
        try:
            q = q.filter(Reading.timestamp >= datetime.fromisoformat(from_date))
        except Exception:
            pass
    if to_date:
        try:
            q = q.filter(Reading.timestamp <= datetime.fromisoformat(to_date))
        except Exception:
            pass

    return q.order_by(Reading.timestamp.desc()).offset(offset).limit(limit).all()

@router.post("/api/v1/readings/import", response_model=ReadingImportReport)
async def import_readings_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Enforce size and extension checks
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are accepted for telemetry import")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File size exceeds maximum allowable limit of 10MB")

    try:
        csv_text = content.decode("utf-8")
    except UnicodeDecodeError:
        csv_text = content.decode("latin-1")

    report = ingestion_service.process_csv_content(db, csv_text)
    return report
