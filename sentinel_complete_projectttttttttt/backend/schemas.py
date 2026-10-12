from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Buildings
class BuildingBase(BaseModel):
    id: str
    name: str
    building_type: Optional[str] = "academic"
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class BuildingResponse(BuildingBase):
    class Config:
        from_attributes = True

# Spaces
class SpaceBase(BaseModel):
    id: str
    building_id: str
    floor: Optional[str] = "1"
    name: str
    space_type: Optional[str] = "classroom"
    capacity: Optional[int] = 40
    operating_hours: Optional[str] = "08:00-18:00"

class SpaceResponse(SpaceBase):
    class Config:
        from_attributes = True

# Readings
class ReadingBase(BaseModel):
    id: str
    space_id: str
    timestamp: datetime
    resource_type: str
    usage: float
    unit: str
    source: Optional[str] = "smart_meter"
    quality_status: Optional[str] = "verified"

class ReadingResponse(ReadingBase):
    class Config:
        from_attributes = True

class ReadingImportReport(BaseModel):
    import_id: str
    accepted_count: int
    rejected_count: int
    row_errors: List[Dict[str, Any]] = []

# Predictions / Anomalies
class AnomalyResponse(BaseModel):
    id: str
    reading_id: Optional[str] = None
    model_version: str
    anomaly_type: str
    score: float
    severity: str
    baseline: float
    deviation_pct: float
    explanation_code: str
    status: str
    space_name: Optional[str] = None
    building_name: Optional[str] = None
    resource_type: Optional[str] = None
    actual_value: Optional[float] = None
    unit: Optional[str] = None

    model_config = {"protected_namespaces": (), "from_attributes": True}

class AnomalyRunResponse(BaseModel):
    job_id: str
    processed_observations: int
    new_anomalies_detected: int

# Actions
class ActionCreate(BaseModel):
    prediction_id: Optional[str] = None
    title: str
    owner: Optional[str] = "Facilities Coordinator"
    due_date: Optional[str] = None
    status: Optional[str] = "open"
    notes: Optional[str] = None

class ActionUpdate(BaseModel):
    title: Optional[str] = None
    owner: Optional[str] = None
    due_date: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class ActionResponse(BaseModel):
    id: str
    prediction_id: Optional[str]
    title: str
    owner: str
    due_date: Optional[str]
    status: str
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Outcomes
class OutcomeCreate(BaseModel):
    action_id: str
    baseline_window: Optional[str] = "prior_7_days"
    follow_up_window: Optional[str] = "post_fix_24h"
    observed_change: float
    verified_by: Optional[str] = "Facilities Lead"
    verification_status: Optional[str] = "verified"

class OutcomeResponse(BaseModel):
    id: str
    action_id: str
    baseline_window: str
    follow_up_window: str
    observed_change: float
    verified_by: str
    verification_status: str

    class Config:
        from_attributes = True

# Configuration
class ConfigResponse(BaseModel):
    id: str
    resource_type: str
    tariff_inr: float
    emission_factor: float
    unit: str
    source: str
    effective_date: str

    class Config:
        from_attributes = True

# AI Explanations
class EvidenceItem(BaseModel):
    label: str
    value: Any
    unit: str

class AIExplainRequest(BaseModel):
    anomaly_id: str
    question: Optional[str] = "Explain this alert and suggest next checks."

class AIExplainResponse(BaseModel):
    summary: str
    evidence: List[EvidenceItem]
    suggested_checks: List[str]
    priority_rationale: Optional[str] = None
    caveat: str

# Overview & KPIs
class KPISummary(BaseModel):
    value: float
    unit: str
    trend_pct: float
    description: str

class OverviewResponse(BaseModel):
    campus_name: str
    selected_period: str
    last_import_time: str
    is_demo_data: bool
    open_alerts_count: int
    electricity_kpi: KPISummary
    water_kpi: KPISummary
    waste_kpi: KPISummary
    estimated_cost_inr: float
    cost_disclaimer: str
    action_progress: Dict[str, int]
    ai_insight: Dict[str, Any]

# Impact Summary
class ImpactSummaryResponse(BaseModel):
    from_date: Optional[str]
    to_date: Optional[str]
    estimated_electricity_waste_kwh: float
    estimated_water_waste_kl: float
    estimated_financial_loss_inr: float
    estimated_carbon_footprint_kg: float
    verified_saved_inr: float
    verified_saved_co2_kg: float
    verified_saved_water_kl: float
