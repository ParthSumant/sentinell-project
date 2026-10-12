import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from typing import Optional, List
from backend.models import Action, Prediction, Outcome
from backend.schemas import ActionCreate, ActionUpdate, OutcomeCreate

class ActionsService:
    def create_action(self, db: Session, payload: ActionCreate) -> Action:
        action_id = f"ACT-{uuid.uuid4().hex[:8].upper()}"
        new_action = Action(
            id=action_id,
            prediction_id=payload.prediction_id,
            title=payload.title,
            owner=payload.owner or "Facilities Coordinator",
            due_date=payload.due_date,
            status=payload.status or "open",
            notes=payload.notes
        )
        db.add(new_action)

        # Update prediction status if linked
        if payload.prediction_id:
            pred = db.query(Prediction).filter(Prediction.id == payload.prediction_id).first()
            if pred:
                pred.status = "in_progress"

        db.commit()
        db.refresh(new_action)
        return new_action

    def update_action(self, db: Session, action_id: str, payload: ActionUpdate) -> Optional[Action]:
        action = db.query(Action).filter(Action.id == action_id).first()
        if not action:
            return None

        if payload.title is not None:
            action.title = payload.title
        if payload.owner is not None:
            action.owner = payload.owner
        if payload.due_date is not None:
            action.due_date = payload.due_date
        if payload.status is not None:
            action.status = payload.status
            # If resolved, update corresponding prediction
            if action.status == "resolved" and action.prediction_id:
                pred = db.query(Prediction).filter(Prediction.id == action.prediction_id).first()
                if pred:
                    pred.status = "resolved"
        if payload.notes is not None:
            action.notes = payload.notes

        action.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(action)
        return action

    def list_actions(self, db: Session, status: Optional[str] = None) -> List[Action]:
        q = db.query(Action)
        if status:
            q = q.filter(Action.status == status)
        return q.order_by(Action.created_at.desc()).all()

class OutcomesService:
    def record_outcome(self, db: Session, payload: OutcomeCreate) -> Outcome:
        outcome_id = f"OUT-{uuid.uuid4().hex[:8].upper()}"
        outcome = Outcome(
            id=outcome_id,
            action_id=payload.action_id,
            baseline_window=payload.baseline_window or "prior_7_days",
            follow_up_window=payload.follow_up_window or "post_fix_24h",
            observed_change=payload.observed_change,
            verified_by=payload.verified_by or "Lead Facilities Auditor",
            verification_status=payload.verification_status or "verified"
        )
        db.add(outcome)

        # Mark action as resolved if not already
        action = db.query(Action).filter(Action.id == payload.action_id).first()
        if action:
            action.status = "resolved"
            if action.prediction_id:
                pred = db.query(Prediction).filter(Prediction.id == action.prediction_id).first()
                if pred:
                    pred.status = "resolved"

        db.commit()
        db.refresh(outcome)
        return outcome

actions_service = ActionsService()
outcomes_service = OutcomesService()
