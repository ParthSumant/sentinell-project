# SENTINEL — Autonomous Campus Resource Intelligence Platform

Developed for **CSI Student Chapter SVVV Indore** under **Problem Statement PS-04: Sustainable Tech Without Limits**.

SENTINEL is an end-to-end full-stack campus telemetry, anomaly detection, incident dispatch, and Excel data analytics platform.

---

## 🚀 Quick Start (Run Locally in 1 Command)

### Prerequisites
- Python 3.10+
- Node.js 18+ (only if you want to modify and rebuild the React frontend)

### 1. Install Backend Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start the Unified Server
```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

The unified server serves both the **FastAPI REST API** and the **production-built React Frontend** on a single port!

### 3. Open in Browser
- **Sentinel Landing Page**: [http://localhost:8000/](http://localhost:8000/)
- **Incident Reports Hub**: [http://localhost:8000/reports](http://localhost:8000/reports)
- **Excel & Telemetry Visualizer**: [http://localhost:8000/analytics](http://localhost:8000/analytics)
- **Executive Telemetry Dashboard**: [http://localhost:8000/dashboard](http://localhost:8000/dashboard)
- **Anomaly Detection Center**: [http://localhost:8000/anomalies](http://localhost:8000/anomalies)
- **Interactive OpenAPI Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🛠️ Frontend Development (Optional)
If you want to modify the React frontend:
```bash
cd frontend/sentinellll-main/sentinellll-main
npm install
npm run dev      # Runs dev server with hot-reloading on port 5173
npm run build    # Compiles production bundle directly into dist/
```

---

## 📁 Project Architecture
```text
mini/
├── backend/                  # FastAPI & ML Anomaly Detection Backend
│   ├── main.py               # Main application entry & SPA static server
│   ├── config.py             # Configuration & environment settings
│   ├── database.py           # SQLAlchemy session engine (SQLite / Supabase)
│   ├── models.py             # 7 database models
│   ├── schemas.py            # Pydantic request / response schemas
│   ├── pipeline/             # Data pipeline & IsolationForest trainer
│   ├── providers/            # Gemini AI, Maps & PostgREST providers
│   ├── routes/               # Modular REST API endpoints
│   └── services/             # Analytics, detection, actions & reports services
├── frontend/                 # React 19 + Vite + Tailwind + Recharts
│   └── sentinellll-main/
│       └── sentinellll-main/
│           ├── src/
│           │   ├── App.jsx           # Main router & Sentinel Landing page
│           │   ├── Dashboard.jsx     # Executive dashboard
│           │   ├── Reports.jsx       # Problem reporting & admin resolution
│           │   ├── Analytics.jsx     # Excel (.xlsx/.csv) graphical visualizer
│           │   ├── Anomalies.jsx     # ML anomaly feed & AI explanation
│           │   ├── BuildingDetails.jsx
│           │   ├── ResourceDetails.jsx
│           │   └── api.js            # Centralised API connector
│           ├── dist/                 # Production-built bundle served by backend
│           └── package.json
├── database.json             # Incident reports & loss metrics cache
├── sentinel.db               # SQLite database with seeded campus records
├── sentinel_anomaly_model.joblib # Serialised IsolationForest ML pipeline
├── requirements.txt
└── README.md
```

---

## 🔐 Admin Credentials for Testing
- **Username**: `admin`
- **Password**: `pass111`
*(Used to unlock resolution privileges on the Incident Reports Hub)*
