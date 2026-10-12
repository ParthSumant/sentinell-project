import os
import json
import random
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel

router = APIRouter(tags=["Landing Page & Reports"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DB_FILE = os.path.join(BASE_DIR, "database.json")

def load_db() -> Dict[str, Any]:
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print("Error loading database.json:", e)
    default_db = {
        "settings": {
            "tariffKwh": 8.50,
            "carbonKwh": 0.82,
            "waterLitre": 0.05
        },
        "reports": [],
        "telemetryZones": [
            {"id": "cs-lab", "name": "CS Computer Lab 2", "baselineKw": 2.1, "currentKw": 2.1, "status": "optimal"},
            {"id": "hostel", "name": "Hostel Block B", "baselineFlow": 3.2, "currentFlow": 3.2, "status": "optimal"},
            {"id": "academic", "name": "Main Academic Wing", "baselineKw": 5.4, "currentKw": 5.4, "status": "optimal"},
            {"id": "library", "name": "Central Library", "baselineKw": 3.5, "currentKw": 3.5, "status": "optimal"}
        ]
    }
    save_db(default_db)
    return default_db

def save_db(data: Dict[str, Any]):
    try:
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print("Error saving database.json:", e)

class AdminLoginRequest(BaseModel):
    username: str
    password: str

class ReportCreateRequest(BaseModel):
    author: Optional[str] = "Anonymous Student"
    userRole: Optional[str] = "student"
    zone: Optional[str] = "General Campus"
    resource: Optional[str] = "Electricity"
    severity: Optional[str] = "WARNING"
    notes: Optional[str] = "No description provided."

class ReportStatusUpdate(BaseModel):
    status: Optional[str] = "SOLVED"
    resolvedBy: Optional[str] = "admin"
    resolutionNotes: Optional[str] = "Verified and marked solved by Facilities Admin."

@router.post("/api/auth/admin-login")
async def admin_login(req: AdminLoginRequest):
    if req.username == "admin" and req.password == "pass111":
        return {
            "success": True,
            "role": "admin",
            "name": "Administrator",
            "token": f"adm_session_{int(datetime.now().timestamp() * 1000)}"
        }
    raise HTTPException(
        status_code=401,
        detail="Invalid credentials. Username must be 'admin' and password 'pass111'."
    )

@router.get("/api/reports")
async def get_reports(author: Optional[str] = Query(None)):
    db = load_db()
    reports = db.get("reports", [])
    if author and author.lower() != "admin":
        reports = [r for r in reports if r.get("author", "").lower() == author.lower()]
    return {"success": True, "reports": reports}

@router.post("/api/reports", status_code=201)
async def create_report(req: ReportCreateRequest):
    db = load_db()
    est_loss = 55.0 if req.resource == "Water" else (108.0 if req.severity == "CRITICAL" else 34.0)
    new_report = {
        "id": f"REP-{random.randint(1000, 9999)}",
        "author": req.author or "Anonymous Student",
        "userRole": req.userRole or "student",
        "zone": req.zone or "General Campus",
        "resource": req.resource or "Electricity",
        "severity": req.severity or "WARNING",
        "notes": req.notes or "No description provided.",
        "status": "PENDING",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "solvedAt": None,
        "resolvedBy": None,
        "resolutionNotes": None,
        "estimatedLossPerHour": est_loss,
        "lossAvertedTotal": 0
    }
    db.setdefault("reports", []).insert(0, new_report)
    save_db(db)
    return {"success": True, "report": new_report}

@router.patch("/api/reports/{report_id}/status")
async def update_report_status(report_id: str, req: ReportStatusUpdate):
    db = load_db()
    reports = db.get("reports", [])
    report = next((r for r in reports if r.get("id") == report_id), None)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report["status"] = req.status or "SOLVED"
    if report["status"] == "SOLVED":
        report["solvedAt"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        report["resolvedBy"] = req.resolvedBy or "admin"
        report["resolutionNotes"] = req.resolutionNotes or "Verified and marked solved by Facilities Admin."
        report["lossAvertedTotal"] = round(float(report.get("estimatedLossPerHour", 50)) * 4.5)
    else:
        report["solvedAt"] = None
        report["resolvedBy"] = None
        report["lossAvertedTotal"] = 0

    save_db(db)
    return {"success": True, "report": report}

@router.get("/api/admin/loss-analytics")
async def get_loss_analytics():
    db = load_db()
    reports = db.get("reports", [])
    pending_reports = [r for r in reports if r.get("status") == "PENDING"]
    solved_reports = [r for r in reports if r.get("status") == "SOLVED"]

    sustained_loss_per_hour = sum(float(r.get("estimatedLossPerHour", 0)) for r in pending_reports)
    total_loss_averted = sum(float(r.get("lossAvertedTotal", 0)) for r in solved_reports)

    electricity_pending = len([r for r in pending_reports if r.get("resource") == "Electricity"])
    water_pending = len([r for r in pending_reports if r.get("resource") == "Water"])
    tariff = db.get("settings", {}).get("tariffKwh", 8.50)

    return {
        "success": True,
        "metrics": {
            "totalReports": len(reports),
            "pendingCount": len(pending_reports),
            "solvedCount": len(solved_reports),
            "sustainedLossPerHour": round(sustained_loss_per_hour, 2),
            "estimatedDailySustainedLoss": round(sustained_loss_per_hour * 24, 2),
            "totalLossAverted": round(total_loss_averted, 2),
            "electricityPending": electricity_pending,
            "waterPending": water_pending,
            "activeTariff": tariff
        }
    }
