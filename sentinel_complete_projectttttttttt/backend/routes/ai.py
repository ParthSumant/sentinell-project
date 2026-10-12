from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.schemas import AIExplainRequest, AIExplainResponse
from backend.services.detection_service import detection_service
from backend.providers.gemini_provider import gemini_provider

router = APIRouter(tags=["AI Explanations"])

@router.post("/api/v1/ai/explain", response_model=AIExplainResponse)
def explain_anomaly_with_ai(
    payload: AIExplainRequest,
    db: Session = Depends(get_db)
):
    # Load anomaly and context from database (Section 5 pattern)
    detail = detection_service.get_anomaly_detail(db, payload.anomaly_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Referenced anomaly does not exist in database")

    # Call Gemini adapter
    explanation = gemini_provider.generate_explanation(
        context=detail,
        user_question=payload.question or "Explain this alert and suggest next checks."
    )

    return explanation
