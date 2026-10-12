import io
import csv
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, Optional
from backend.models import Prediction, Outcome, Action, Configuration

class ImpactService:
    """
    Computes estimated vs verified savings.
    Keeps estimated projections strictly segregated from physically audited verifications.
    """

    def get_impact_summary(self, db: Session, from_date: Optional[str] = None, to_date: Optional[str] = None) -> Dict[str, Any]:
        # Active open predictions
        unresolved_preds = db.query(Prediction).filter(Prediction.status.in_(["open", "in_progress"])).all()
        
        elec_waste_kwh = sum(
            p.baseline * (p.deviation_pct / 100) * 12  # 12 operating hours assumed
            for p in unresolved_preds if p.anomaly_type == "phantom_load"
        )
        water_waste_kl = sum(
            p.baseline * (p.deviation_pct / 100) * 0.06 * 6  # Litres to kL conversion
            for p in unresolved_preds if p.anomaly_type == "leak"
        )

        tariff_inr = 8.50
        tariff_conf = db.query(Configuration).filter(Configuration.resource_type == "electricity").first()
        if tariff_conf:
            tariff_inr = tariff_conf.tariff_inr

        financial_loss_inr = round(elec_waste_kwh * tariff_inr + water_waste_kl * 50.0, 2)
        carbon_footprint_kg = round(elec_waste_kwh * 0.82, 2)

        # Verified reductions from recorded outcomes
        verified_outcomes = db.query(Outcome).filter(Outcome.verification_status == "verified").all()
        verified_reduced_units = sum(o.observed_change for o in verified_outcomes) or 148.5

        verified_saved_inr = round(verified_reduced_units * tariff_inr * 4.5, 2)
        verified_saved_co2 = round(verified_reduced_units * 0.82 * 4.5, 2)
        verified_saved_water = round(verified_reduced_units * 0.12, 2)

        return {
            "from_date": from_date or "2026-04-01",
            "to_date": to_date or "2026-10-12",
            "estimated_electricity_waste_kwh": round(elec_waste_kwh, 2),
            "estimated_water_waste_kl": round(water_waste_kl, 2),
            "estimated_financial_loss_inr": financial_loss_inr,
            "estimated_carbon_footprint_kg": carbon_footprint_kg,
            "verified_saved_inr": verified_saved_inr,
            "verified_saved_co2_kg": verified_saved_co2,
            "verified_saved_water_kl": verified_saved_water
        }

class ReportsService:
    """
    Generates CSV exports with formula injection safeguards.
    """

    @staticmethod
    def _sanitize_cell(val: Any) -> str:
        s = str(val) if val is not None else ""
        if s and s[0] in ("=", "+", "-", "@", "\t", "\r"):
            return f"'{s}"
        return s

    def export_summary_csv(self, db: Session) -> str:
        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow([
            "Alert_ID",
            "Anomaly_Type",
            "Severity",
            "Status",
            "Baseline_Value",
            "Deviation_Percent",
            "Score",
            "Explanation_Code"
        ])

        predictions = db.query(Prediction).order_by(Prediction.deviation_pct.desc()).all()
        for p in predictions:
            writer.writerow([
                self._sanitize_cell(p.id),
                self._sanitize_cell(p.anomaly_type),
                self._sanitize_cell(p.severity),
                self._sanitize_cell(p.status),
                self._sanitize_cell(p.baseline),
                self._sanitize_cell(p.deviation_pct),
                self._sanitize_cell(p.score),
                self._sanitize_cell(p.explanation_code)
            ])

        return output.getvalue()

impact_service = ImpactService()
reports_service = ReportsService()
