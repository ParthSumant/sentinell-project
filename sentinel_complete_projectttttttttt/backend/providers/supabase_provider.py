import requests
import logging
from typing import List, Dict, Any, Optional
from backend.config import settings

logger = logging.getLogger(__name__)

class SupabaseProvider:
    """
    Direct REST Provider for Supabase PostgreSQL.
    Communicates with PostgREST endpoints at SUPABASE_URL with SUPABASE_KEY.
    """

    def __init__(self):
        self.url = settings.SUPABASE_URL.rstrip("/")
        self.key = settings.SUPABASE_KEY
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    def is_configured(self) -> bool:
        return bool(self.url and self.key)

    def fetch_table(self, table_name: str, select: str = "*", limit: int = 100) -> List[Dict[str, Any]]:
        if not self.is_configured():
            return []
        try:
            res = requests.get(
                f"{self.url}/{table_name}?select={select}&limit={limit}",
                headers=self.headers,
                timeout=5
            )
            if res.status_code == 200:
                return res.json()
        except Exception as e:
            logger.warning(f"Failed to fetch from Supabase table '{table_name}': {e}")
        return []

    def insert_records(self, table_name: str, records: List[Dict[str, Any]]) -> bool:
        if not self.is_configured():
            return False
        try:
            res = requests.post(
                f"{self.url}/{table_name}",
                headers=self.headers,
                json=records,
                timeout=8
            )
            return res.status_code in [200, 201]
        except Exception as e:
            logger.warning(f"Failed to insert into Supabase table '{table_name}': {e}")
            return False

supabase_provider = SupabaseProvider()
