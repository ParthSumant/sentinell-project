from typing import Dict, Any, List
from backend.config import settings

class MapsProvider:
    """
    Adapter for Google Maps & Spatial Campus Visualizer.
    Coordinates based on SVVV (Shri Vaishnav Vidyapeeth Vishwavidyalaya, Indore).
    Provides geographic markers, bounding boxes, and non-map schematic fallback data.
    """

    CAMPUS_CENTER = {
        "lat": 22.814502,
        "lng": 75.845942,
        "zoom": 17,
        "campus_name": "Shri Vaishnav Vidyapeeth Vishwavidyalaya, Indore"
    }

    BUILDING_COORDINATES = {
        "BLD-01": {"name": "Academic Block A", "lat": 22.814750, "lng": 75.845600, "type": "academic"},
        "BLD-02": {"name": "Computer Science Complex (Block B)", "lat": 22.814920, "lng": 75.846200, "type": "academic"},
        "BLD-03": {"name": "Hostel Block B (Boys)", "lat": 22.814100, "lng": 75.845200, "type": "residential"},
        "BLD-04": {"name": "Hostel Block A (Girls)", "lat": 22.813900, "lng": 75.845700, "type": "residential"},
        "BLD-05": {"name": "Central Library & Media Wing", "lat": 22.814400, "lng": 75.846800, "type": "academic"},
        "BLD-06": {"name": "Mechanical & Civil Workshops", "lat": 22.815200, "lng": 75.845000, "type": "academic"},
        "BLD-07": {"name": "Central Cafeteria & Food Court", "lat": 22.814250, "lng": 75.846400, "type": "dining"},
        "BLD-08": {"name": "Administrative Headquarters", "lat": 22.814600, "lng": 75.844800, "type": "admin"}
    }

    def get_map_config(self) -> Dict[str, Any]:
        return {
            "api_key_configured": bool(settings.MAPS_API_KEY),
            "campus_center": self.CAMPUS_CENTER,
            "buildings": self.BUILDING_COORDINATES,
            "embed_url": (
                "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3677.6749909249033!"
                "2d75.84594247589945!3d22.81450202356236!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!"
                "4f13.1!3m3!1m2!1s0x39630268593a8d1f%3A0x8e833486c95333f2!"
                "Shri%20Vaishnav%20Vidyapeeth%20Vishwavidyalaya!5e0!3m2!1sen!2sin!4v1710000000000!5m2!1sen!2sin"
            )
        }

maps_provider = MapsProvider()
