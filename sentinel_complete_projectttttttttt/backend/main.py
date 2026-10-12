import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.config import settings
from backend.database import engine, Base
from backend.routes.overview import router as overview_router
from backend.routes.buildings import router as buildings_router
from backend.routes.readings import router as readings_router
from backend.routes.anomalies import router as anomalies_router
from backend.routes.ai import router as ai_router
from backend.routes.actions import router as actions_router
from backend.routes.impact import router as impact_router
from backend.routes.landing_api import router as landing_api_router
from backend.pipeline.data_pipeline import run_pipeline

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database schema & seed pipeline
    print(f"[{settings.APP_NAME}] Initializing database tables and models...")
    Base.metadata.create_all(bind=engine)
    run_pipeline(force_reseed=False)
    print(f"[{settings.APP_NAME}] FastAPI Backend initialized successfully.")
    yield
    print(f"[{settings.APP_NAME}] Shutdown complete.")

app = FastAPI(
    title=f"{settings.APP_NAME} Sustainability API",
    description="Autonomous Resource Intelligence & Anomaly Telemetry Engine for SVVV Indore",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include All Routers
app.include_router(landing_api_router)
app.include_router(overview_router)
app.include_router(buildings_router)
app.include_router(readings_router)
app.include_router(anomalies_router)
app.include_router(ai_router)
app.include_router(actions_router)
app.include_router(impact_router)

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
REACT_DIST = os.path.join(BASE_DIR, "frontend", "sentinellll-main", "sentinellll-main", "dist")
REACT_ASSETS = os.path.join(REACT_DIST, "assets")

if os.path.exists(REACT_ASSETS):
    app.mount("/assets", StaticFiles(directory=REACT_ASSETS), name="assets")

# Root Route: Serves Sentinel React Frontend exclusively
@app.get("/")
async def serve_root():
    react_index = os.path.join(REACT_DIST, "index.html")
    if os.path.exists(react_index):
        return FileResponse(react_index)
    return {"message": "Sentinel frontend build not found. Run npm run build in frontend directory."}

# SPA Route Handler: Serves Sentinel React App on all non-API paths
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Pass through system and API endpoints
    if full_path.startswith("api/") or full_path.startswith("health") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
        return {"error": "Not found"}

    # Check for direct static asset match in React dist
    dist_file = os.path.join(REACT_DIST, full_path)
    if os.path.isfile(dist_file):
        return FileResponse(dist_file)

    # All client-side routes (/dashboard, /reports, /analytics, /anomalies, /building, etc.) serve React index.html
    react_index = os.path.join(REACT_DIST, "index.html")
    if os.path.exists(react_index):
        return FileResponse(react_index)

    return {"message": f"{settings.APP_NAME} API active"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
