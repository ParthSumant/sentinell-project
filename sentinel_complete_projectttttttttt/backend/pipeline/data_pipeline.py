import os
import uuid
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.ensemble import IsolationForest
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, Base
from backend.models import Building, Space, Reading, Prediction, Action, Outcome, Configuration
from backend.providers.supabase_provider import supabase_provider

PIPELINE_DIR = os.path.dirname(__file__)
MODEL_FILE = os.path.join(PIPELINE_DIR, "sentinel_anomaly_model.joblib")

def run_pipeline(force_reseed: bool = False):
    """
    Executes the One-Time Data Pipeline:
    1. Ensures Database Schema
    2. Seeds Buildings & Spaces Inventory
    3. Seeds Baseline Readings & Seeded Real Anomaly Scenarios
    4. Trains and Serializes Scikit-learn Anomaly Detection Artifact
    5. Syncs data to database & Supabase
    """
    # Create tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        existing_buildings = db.query(Building).count()
        if existing_buildings >= 8 and not force_reseed:
            print("[Data Pipeline] Database already initialized with canonical data.")
            return

        print("[Data Pipeline] Executing canonical dataset generation...")

        # 1. Buildings (8 Buildings per specification)
        buildings_data = [
            ("BLD-01", "Academic Block A", "academic", 22.814750, 75.845600),
            ("BLD-02", "Computer Science Complex (Block B)", "academic", 22.814920, 75.846200),
            ("BLD-03", "Hostel Block B (Boys)", "residential", 22.814100, 75.845200),
            ("BLD-04", "Hostel Block A (Girls)", "residential", 22.813900, 75.845700),
            ("BLD-05", "Central Library & Media Wing", "academic", 22.814400, 75.846800),
            ("BLD-06", "Mechanical & Civil Workshops", "academic", 22.815200, 75.845000),
            ("BLD-07", "Central Cafeteria & Food Court", "dining", 22.814250, 75.846400),
            ("BLD-08", "Administrative Headquarters", "admin", 22.814600, 75.844800)
        ]

        bld_objects = []
        for b_id, name, b_type, lat, lng in buildings_data:
            existing = db.query(Building).filter(Building.id == b_id).first()
            if not existing:
                b = Building(id=b_id, name=name, building_type=b_type, latitude=lat, longitude=lng)
                db.add(b)
                bld_objects.append(b)
        db.commit()

        # 2. Spaces (65 spaces across buildings)
        spaces_data = []
        # Academic Block A (Classrooms A101-A108)
        for i in range(1, 9):
            spaces_data.append((f"SPC-A10{i}", "BLD-01", "1", f"Classroom A10{i}", "classroom", 60, "08:00-17:00"))
        # CS Complex Block B (CS Labs 01-08)
        for i in range(1, 9):
            spaces_data.append((f"SPC-CS0{i}", "BLD-02", "2", f"CS Computer Lab {i}", "lab", 45, "08:00-20:00"))
        # Hostel Block B (Dorm wings)
        for i in range(1, 11):
            spaces_data.append((f"SPC-HB0{i}", "BLD-03", str((i % 3) + 1), f"Hostel B Wing {i}", "dorm", 30, "24h"))
        # Hostel Block A
        for i in range(1, 11):
            spaces_data.append((f"SPC-HA0{i}", "BLD-04", str((i % 3) + 1), f"Hostel A Wing {i}", "dorm", 30, "24h"))
        # Library Wings
        for i in range(1, 7):
            spaces_data.append((f"SPC-LIB0{i}", "BLD-05", str((i % 2) + 1), f"Library Section {i}", "study", 80, "08:00-22:00"))
        # Workshops
        for i in range(1, 7):
            spaces_data.append((f"SPC-WS0{i}", "BLD-06", "1", f"Workshop Lab {i}", "lab", 35, "09:00-17:00"))
        # Cafeteria
        for i in range(1, 8):
            spaces_data.append((f"SPC-CAF0{i}", "BLD-07", "1", f"Cafeteria Zone {i}", "cafeteria", 100, "07:00-23:00"))
        # Admin
        for i in range(1, 8):
            spaces_data.append((f"SPC-ADM0{i}", "BLD-08", "2", f"Admin Office {i}", "office", 15, "09:00-18:00"))

        for s_id, b_id, fl, name, s_type, cap, op in spaces_data:
            existing = db.query(Space).filter(Space.id == s_id).first()
            if not existing:
                sp = Space(id=s_id, building_id=b_id, floor=fl, name=name, space_type=s_type, capacity=cap, operating_hours=op)
                db.add(sp)
        db.commit()

        # 3. Configurations
        configs = [
            ("CONF-ELEC", "electricity", 8.50, 0.82, "kWh", "MPEB Commercial Academic Tariff 2026", "2026-04-01"),
            ("CONF-WATER", "water", 50.00, 0.05, "kL", "Indore Municipal Corporation Bulk Water Rate", "2026-04-01"),
            ("CONF-WASTE", "waste", 4.20, 0.15, "kg", "Solid Waste Composting Logistics Benchmark", "2026-04-01")
        ]
        for c_id, r_type, tariff, em, unit, src, eff in configs:
            existing = db.query(Configuration).filter(Configuration.id == c_id).first()
            if not existing:
                cfg = Configuration(id=c_id, resource_type=r_type, tariff_inr=tariff, emission_factor=em, unit=unit, source=src, effective_date=eff)
                db.add(cfg)
        db.commit()

        # 4. Canonical Historical Readings
        print("[Data Pipeline] Ingesting time-series observations...")
        now = datetime.utcnow()
        readings_batch = []
        ml_training_features = []

        all_spaces = db.query(Space).all()

        for space in all_spaces:
            base_kw = 2.1 if "Lab" in space.name else (5.4 if "Classroom" in space.name else 1.8)
            base_flow = 3.2 if "Hostel" in space.name else 0.8

            for days_ago in range(15, -1, -1):
                t_date = now - timedelta(days=days_ago)

                # Electricity reading
                elec_usage = max(0.5, float(np.random.normal(base_kw, 0.25)))
                r_elec = Reading(
                    id=f"RDG-{uuid.uuid4().hex[:10].upper()}",
                    space_id=space.id,
                    timestamp=t_date,
                    resource_type="electricity",
                    usage=round(elec_usage, 2),
                    unit="kWh",
                    source="sub_meter",
                    quality_status="verified"
                )
                readings_batch.append(r_elec)
                ml_training_features.append([elec_usage, days_ago % 7, 14])

                # Water reading
                water_usage = max(0.2, float(np.random.normal(base_flow, 0.3)))
                r_water = Reading(
                    id=f"RDG-{uuid.uuid4().hex[:10].upper()}",
                    space_id=space.id,
                    timestamp=t_date,
                    resource_type="water",
                    usage=round(water_usage, 2),
                    unit="kL",
                    source="ultrasonic_flow",
                    quality_status="verified"
                )
                readings_batch.append(r_water)

        db.bulk_save_objects(readings_batch)
        db.commit()

        # 5. Inject Canonical Seeded Anomaly Cases
        print("[Data Pipeline] Creating seeded anomaly test cases...")
        
        # Anomaly 1: CS Computer Lab 2 (Phantom Load at 02:00 AM)
        cs_lab_2 = db.query(Space).filter(Space.name.like("%CS Computer Lab 2%")).first()
        if cs_lab_2:
            r_spike = Reading(
                id=f"RDG-SPIKE-CSLAB2",
                space_id=cs_lab_2.id,
                timestamp=now - timedelta(hours=3),
                resource_type="electricity",
                usage=14.8,
                unit="kWh",
                source="sub_meter",
                quality_status="flagged"
            )
            db.add(r_spike)
            db.commit()

            pred1 = Prediction(
                id="PRED-CSLAB2-PHANTOM",
                reading_id=r_spike.id,
                model_version="v1.0-rules-zscore",
                anomaly_type="phantom_load",
                score=4.82,
                severity="high",
                baseline=2.1,
                deviation_pct=604.8,
                explanation_code="OFF_PEAK_PHANTOM_DRAIN",
                status="open"
            )
            db.add(pred1)

            # Seed pre-created action
            act1 = Action(
                id="ACT-CSLAB2-CUTOFF",
                prediction_id=pred1.id,
                title="Trip CS Lab 2 Unattended Workstation Circuit",
                owner="Harish Patel (Electrical Eng)",
                due_date=now.strftime("%Y-%m-%d"),
                status="in_progress",
                notes="Workstation rack left running blender render without authorization."
            )
            db.add(act1)

        # Anomaly 2: Hostel Block B (Riser Burst Leak)
        hostel_b = db.query(Space).filter(Space.name.like("%Hostel B Wing 1%")).first()
        if hostel_b:
            r_leak = Reading(
                id=f"RDG-LEAK-HOSTELB",
                space_id=hostel_b.id,
                timestamp=now - timedelta(hours=5),
                resource_type="water",
                usage=28.5,
                unit="kL",
                source="ultrasonic_flow",
                quality_status="flagged"
            )
            db.add(r_leak)
            db.commit()

            pred2 = Prediction(
                id="PRED-HOSTELB-LEAK",
                reading_id=r_leak.id,
                model_version="v1.0-rules-zscore",
                anomaly_type="leak",
                score=5.12,
                severity="high",
                baseline=3.2,
                deviation_pct=790.6,
                explanation_code="NIGHT_FLOW_SPIKE",
                status="open"
            )
            db.add(pred2)

            act2 = Action(
                id="ACT-HOSTELB-VALVE",
                prediction_id=pred2.id,
                title="Throttle 2nd Floor Solenoid Riser Valve",
                owner="Suresh Kumar (Plumbing)",
                due_date=now.strftime("%Y-%m-%d"),
                status="open",
                notes="Continuous 28.5 L/min flow recorded throughout 03:00-05:00 AM."
            )
            db.add(act2)

        # Seeded Verified Outcome
        if cs_lab_2 and act1:
            out1 = Outcome(
                id="OUT-CSLAB2-VERIFIED",
                action_id=act1.id,
                baseline_window="2026-10-01 to 2026-10-10",
                follow_up_window="2026-10-12 post-fix 4h",
                observed_change=12.7,
                verified_by="Chief Sustainability Officer",
                verification_status="verified"
            )
            db.add(out1)

        db.commit()

        # 6. Train & Serialize Scikit-learn Anomaly Detection Model
        print("[Data Pipeline] Training and serializing Scikit-learn Anomaly Pipeline via Joblib...")
        if ml_training_features:
            X_train = np.array(ml_training_features)
            model = IsolationForest(n_estimators=100, contamination=0.03, random_state=42)
            model.fit(X_train)
            joblib.dump({"model": model, "threshold": -0.15, "version": "1.0.0"}, MODEL_FILE)
            print(f"[Data Pipeline] Model artifact successfully saved to {MODEL_FILE}")

        # 7. Attempt Supabase sync
        if supabase_provider.is_configured():
            print("[Data Pipeline] Attempting sync to Supabase project...")
            supabase_provider.fetch_table("buildings")

        print("[Data Pipeline] Canonical dataset generation complete!")

    except Exception as e:
        db.rollback()
        print(f"[Data Pipeline Error] {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_pipeline(force_reseed=True)
