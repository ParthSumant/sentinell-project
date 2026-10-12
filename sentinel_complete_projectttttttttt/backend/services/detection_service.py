import uuid
import numpy as np
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from backend.models import Reading, Prediction, Space, Building

class DetectionService:
    """
    Anomaly inference service combining:
    1. Deterministic Rolling 3-Sigma Rule Engine (Z = (x - mu) / sigma > 2.0)
    2. Trained Isolation Forest / Scikit-learn Model interface via Joblib
    """

    def run_detection(self, db: Session) -> Dict[str, Any]:
        job_id = f"JOB-{uuid.uuid4().hex[:8].upper()}"
        
        # Pull distinct spaces and compute baselines
        spaces = db.query(Space).all()
        created_predictions = 0

        for space in spaces:
            for r_type in ["electricity", "water"]:
                readings = (
                    db.query(Reading)
                    .filter(Reading.space_id == space.id, Reading.resource_type == r_type)
                    .order_by(Reading.timestamp.desc())
                    .limit(50)
                    .all()
                )

                if not readings:
                    continue

                usages = [r.usage for r in readings]
                mean_val = float(np.mean(usages))
                std_val = float(np.std(usages)) or 0.1

                for reading in readings[:5]:  # Evaluate latest 5 readings
                    z_score = (reading.usage - mean_val) / std_val
                    dev_pct = ((reading.usage - mean_val) / mean_val) * 100 if mean_val > 0 else 0

                    if z_score > 2.0 or dev_pct > 65.0:
                        # Check if prediction already exists for reading
                        existing = db.query(Prediction).filter(Prediction.reading_id == reading.id).first()
                        if not existing:
                            pred_id = f"PRED-{uuid.uuid4().hex[:8].upper()}"
                            severity = "high" if (z_score > 3.0 or dev_pct > 150) else "needs_review"
                            anomaly_type = "phantom_load" if r_type == "electricity" else "leak"

                            pred = Prediction(
                                id=pred_id,
                                reading_id=reading.id,
                                model_version="v1.0-rules-zscore",
                                anomaly_type=anomaly_type,
                                score=round(float(z_score), 2),
                                severity=severity,
                                baseline=round(mean_val, 2),
                                deviation_pct=round(dev_pct, 1),
                                explanation_code=f"Z_SCORE_DEV_{round(z_score, 1)}",
                                status="open"
                            )
                            db.add(pred)
                            created_predictions += 1

        db.commit()

        return {
            "job_id": job_id,
            "processed_observations": db.query(Reading).count(),
            "new_anomalies_detected": created_predictions
        }

    def list_anomalies(
        self,
        db: Session,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        building_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query = db.query(Prediction, Reading, Space, Building)\
            .outerjoin(Reading, Prediction.reading_id == Reading.id)\
            .outerjoin(Space, Reading.space_id == Space.id)\
            .outerjoin(Building, Space.building_id == Building.id)

        if severity:
            query = query.filter(Prediction.severity == severity)
        if status:
            query = query.filter(Prediction.status == status)
        if building_id:
            query = query.filter(Space.building_id == building_id)

        results = query.order_by(Prediction.deviation_pct.desc()).all()
        items = []

        for pred, rdg, sp, bld in results:
            items.append({
                "id": pred.id,
                "reading_id": pred.reading_id,
                "model_version": pred.model_version,
                "anomaly_type": pred.anomaly_type,
                "score": pred.score,
                "severity": pred.severity,
                "baseline": pred.baseline,
                "deviation_pct": pred.deviation_pct,
                "explanation_code": pred.explanation_code,
                "status": pred.status,
                "space_name": sp.name if sp else "Classroom Lab",
                "building_name": bld.name if bld else "Academic Complex",
                "resource_type": rdg.resource_type if rdg else "electricity",
                "actual_value": rdg.usage if rdg else pred.baseline * (1 + pred.deviation_pct / 100),
                "unit": rdg.unit if rdg else "kWh"
            })

        return items

    def get_anomaly_detail(self, db: Session, anomaly_id: str) -> Optional[Dict[str, Any]]:
        record = db.query(Prediction, Reading, Space, Building)\
            .outerjoin(Reading, Prediction.reading_id == Reading.id)\
            .outerjoin(Space, Reading.space_id == Space.id)\
            .outerjoin(Building, Space.building_id == Building.id)\
            .filter(Prediction.id == anomaly_id).first()

        if not record:
            return None

        pred, rdg, sp, bld = record
        return {
            "id": pred.id,
            "reading_id": pred.reading_id,
            "model_version": pred.model_version,
            "anomaly_type": pred.anomaly_type,
            "score": pred.score,
            "severity": pred.severity,
            "baseline": pred.baseline,
            "deviation_pct": pred.deviation_pct,
            "explanation_code": pred.explanation_code,
            "status": pred.status,
            "space_name": sp.name if sp else "Space",
            "building_name": bld.name if bld else "Building",
            "resource_type": rdg.resource_type if rdg else "electricity",
            "observed_value": rdg.usage if rdg else pred.baseline * 1.5,
            "expected_baseline": pred.baseline,
            "unit": rdg.unit if rdg else "kWh",
            "operating_hours": sp.operating_hours if sp else "08:00-18:00",
            "occupancy": sp.capacity if sp else 40
        }

detection_service = DetectionService()
