import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "SENTINEL")
    APP_ENV: str = os.getenv("APP_ENV", "development")
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")

    # Supabase credentials
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://avltzgkokyjfqcbgzsdi.supabase.co/rest/v1/")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/sentinel.db")

    # Providers
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    MAPS_API_KEY: str = os.getenv("MAPS_API_KEY", "")
    MODEL_IDENTIFIER: str = os.getenv("MODEL_IDENTIFIER", "gemini-1.5-flash")

    # Campus Baselines
    DEFAULT_TARIFF_INR_KWH: float = 8.50
    DEFAULT_EMISSION_FACTOR: float = 0.82
    DEFAULT_WATER_TARIFF_INR_L: float = 0.05

settings = Settings()
