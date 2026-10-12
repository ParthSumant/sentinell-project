from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class Building(Base):
    __tablename__ = "buildings"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    building_type = Column(String(50), default="academic")  # academic, residential, dining, admin
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    spaces = relationship("Space", back_populates="building", cascade="all, delete-orphan")

class Space(Base):
    __tablename__ = "spaces"

    id = Column(String(50), primary_key=True, index=True)
    building_id = Column(String(50), ForeignKey("buildings.id"), nullable=False, index=True)
    floor = Column(String(20), default="1")
    name = Column(String(100), nullable=False)
    space_type = Column(String(50), default="classroom")  # classroom, lab, dorm, office, cafeteria
    capacity = Column(Integer, default=40)
    operating_hours = Column(String(50), default="08:00-18:00")

    building = relationship("Building", back_populates="spaces")
    readings = relationship("Reading", back_populates="space", cascade="all, delete-orphan")

class Reading(Base):
    __tablename__ = "readings"

    id = Column(String(50), primary_key=True, index=True)
    space_id = Column(String(50), ForeignKey("spaces.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    resource_type = Column(String(30), nullable=False, index=True)  # electricity, water, waste
    usage = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)  # kWh, kL, kg
    source = Column(String(50), default="smart_meter")
    quality_status = Column(String(30), default="verified")  # verified, estimated, flagged

    space = relationship("Space", back_populates="readings")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(String(50), primary_key=True, index=True)
    reading_id = Column(String(50), ForeignKey("readings.id"), nullable=True, index=True)
    model_version = Column(String(50), default="v1.0-rules-zscore")
    anomaly_type = Column(String(50), nullable=False)  # phantom_load, leak, off_peak_draw, overload
    score = Column(Float, default=0.0)
    severity = Column(String(20), default="needs_review")  # high, needs_review, resolved
    baseline = Column(Float, default=0.0)
    deviation_pct = Column(Float, default=0.0)
    explanation_code = Column(String(100), default="Z_SCORE_EXCEEDED")
    status = Column(String(30), default="open")  # open, in_progress, resolved, false_positive

    actions = relationship("Action", back_populates="prediction", cascade="all, delete-orphan")

class Action(Base):
    __tablename__ = "actions"

    id = Column(String(50), primary_key=True, index=True)
    prediction_id = Column(String(50), ForeignKey("predictions.id"), nullable=True, index=True)
    title = Column(String(150), nullable=False)
    owner = Column(String(100), default="Facilities Coordinator")
    due_date = Column(String(30), nullable=True)
    status = Column(String(30), default="open")  # open, in_progress, resolved
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    prediction = relationship("Prediction", back_populates="actions")
    outcomes = relationship("Outcome", back_populates="action", cascade="all, delete-orphan")

class Outcome(Base):
    __tablename__ = "outcomes"

    id = Column(String(50), primary_key=True, index=True)
    action_id = Column(String(50), ForeignKey("actions.id"), nullable=False, index=True)
    baseline_window = Column(String(50), default="prior_7_days")
    follow_up_window = Column(String(50), default="post_fix_24h")
    observed_change = Column(Float, default=0.0)  # delta reduction
    verified_by = Column(String(100), default="Senior Energy Engineer")
    verification_status = Column(String(30), default="verified")  # verified, pending_audit

    action = relationship("Action", back_populates="outcomes")

class Configuration(Base):
    __tablename__ = "configurations"

    id = Column(String(50), primary_key=True, index=True)
    resource_type = Column(String(30), nullable=False)  # electricity, water, waste
    tariff_inr = Column(Float, default=8.50)
    emission_factor = Column(Float, default=0.82)
    unit = Column(String(20), default="kWh")
    source = Column(String(100), default="MPEB Industrial Tariff Schedule 2026")
    effective_date = Column(String(30), default="2026-04-01")
