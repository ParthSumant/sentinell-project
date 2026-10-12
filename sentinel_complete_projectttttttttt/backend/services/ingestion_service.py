import io
import csv
import uuid
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.models import Reading, Space

VALID_RESOURCES = {"electricity", "water", "waste"}
VALID_UNITS = {"kwh", "kl", "l", "kg", "ton"}

class IngestionService:
    """
    Validates, sanitizes, and persists incoming telemetry CSV data.
    Row-level validation reports rejected rows without failing whole batches.
    """

    def process_csv_content(self, db: Session, csv_text: str) -> Dict[str, Any]:
        import_id = f"IMP-{uuid.uuid4().hex[:8].upper()}"
        accepted = []
        rejected = []

        reader = csv.DictReader(io.StringIO(csv_text))
        
        # Validate header columns
        required_headers = {"space_id", "timestamp", "resource_type", "usage"}
        fieldnames = {h.strip().lower() for h in (reader.fieldnames or [])}
        
        if not required_headers.issubset(fieldnames):
            return {
                "import_id": import_id,
                "accepted_count": 0,
                "rejected_count": 0,
                "row_errors": [{"row": 0, "error": f"Missing required headers. Must include: {required_headers}"}]
            }

        existing_space_ids = {s.id for s in db.query(Space.id).all()}

        for row_idx, row in enumerate(reader, start=1):
            try:
                space_id = row.get("space_id", "").strip()
                ts_str = row.get("timestamp", "").strip()
                res_type = row.get("resource_type", "").strip().lower()
                usage_str = row.get("usage", "").strip()
                unit = row.get("unit", "kWh").strip()

                if not space_id:
                    raise ValueError("space_id cannot be empty")

                # Validate resource
                if res_type not in VALID_RESOURCES:
                    raise ValueError(f"Invalid resource_type: '{res_type}'. Must be one of {VALID_RESOURCES}")

                # Validate usage
                usage_val = float(usage_str)
                if usage_val < 0:
                    raise ValueError("usage value cannot be negative")

                # Parse date
                try:
                    ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                except Exception:
                    ts = datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S")

                # Create reading
                reading_id = f"RDG-{uuid.uuid4().hex[:10].upper()}"
                new_reading = Reading(
                    id=reading_id,
                    space_id=space_id,
                    timestamp=ts,
                    resource_type=res_type,
                    usage=usage_val,
                    unit=unit,
                    source="csv_upload",
                    quality_status="verified"
                )
                accepted.append(new_reading)

            except Exception as e:
                rejected.append({
                    "row": row_idx,
                    "error": str(e),
                    "data": row
                })

        # Bulk save accepted rows
        if accepted:
            db.bulk_save_objects(accepted)
            db.commit()

        return {
            "import_id": import_id,
            "accepted_count": len(accepted),
            "rejected_count": len(rejected),
            "row_errors": rejected[:50]  # Cap error list to 50 for performance
        }

ingestion_service = IngestionService()
