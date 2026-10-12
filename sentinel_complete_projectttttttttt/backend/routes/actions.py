from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.database import get_db
from backend.schemas import ActionCreate, ActionUpdate, ActionResponse, OutcomeCreate, OutcomeResponse
from backend.services.actions_service import actions_service, outcomes_service

router = APIRouter(tags=["Actions & Outcomes"])

@router.get("/api/v1/actions", response_model=List[ActionResponse])
def get_actions(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return actions_service.list_actions(db, status=status)

@router.post("/api/v1/actions", response_model=ActionResponse, status_code=201)
def create_action(
    payload: ActionCreate,
    db: Session = Depends(get_db)
):
    return actions_service.create_action(db, payload)

@router.patch("/api/v1/actions/{action_id}", response_model=ActionResponse)
def update_action(
    action_id: str,
    payload: ActionUpdate,
    db: Session = Depends(get_db)
):
    action = actions_service.update_action(db, action_id, payload)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    return action

@router.post("/api/v1/actions/{action_id}/outcomes", response_model=OutcomeResponse, status_code=201)
def record_action_outcome(
    action_id: str,
    payload: OutcomeCreate,
    db: Session = Depends(get_db)
):
    payload.action_id = action_id
    return outcomes_service.record_outcome(db, payload)
