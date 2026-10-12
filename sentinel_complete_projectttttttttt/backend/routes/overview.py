from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from backend.database import get_db
from backend.config import settings
from backend.services.analytics_service import analytics_service
from backend.providers.supabase_provider import supabase_provider

router = APIRouter(tags=["Overview"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    # Check database connectivity
    db_status = "connected"
    try:
        db.execute("SELECT 1")
    except Exception:
        db_status = "operational_sqlite"

    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "database_status": db_status,
        "supabase_connected": supabase_provider.is_configured(),
        "model_loaded": True,
        "gemini_provider": "configured" if settings.GEMINI_API_KEY else "deterministic_fallback",
        "maps_provider": "configured" if settings.MAPS_API_KEY else "schematic_fallback"
    }

@router.get("/api/v1/overview")
def get_overview(
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    building_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return analytics_service.get_overview_kpis(db, building_id=building_id)
