from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.database import get_db
from backend.models import Building, Space
from backend.schemas import BuildingResponse, SpaceResponse
from backend.providers.maps_provider import maps_provider

router = APIRouter(tags=["Buildings & Spaces"])

@router.get("/api/v1/buildings", response_model=List[BuildingResponse])
def get_buildings(db: Session = Depends(get_db)):
    buildings = db.query(Building).all()
    # Enrich with maps provider coordinates if missing
    for b in buildings:
        if (b.latitude is None or b.longitude is None) and b.id in maps_provider.BUILDING_COORDINATES:
            coords = maps_provider.BUILDING_COORDINATES[b.id]
            b.latitude = coords["lat"]
            b.longitude = coords["lng"]
    return buildings

@router.get("/api/v1/spaces", response_model=List[SpaceResponse])
def get_spaces(
    building_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(Space)
    if building_id:
        q = q.filter(Space.building_id == building_id)
    return q.all()
