from typing import Dict, Any, Tuple, List
from shapely.geometry import shape, Point, Polygon
from app.utils.geo_helpers import haversine_distance_meters, is_point_in_polygon

class GISService:
    @staticmethod
    def validate_location(
        lat: float,
        lon: float,
        parcel_geometry: Dict[str, Any],
        centroid_geometry: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Performs Point-in-Polygon check and Haversine distance from centroid.
        """
        pip_matched, boundary_dist = is_point_in_polygon(lat, lon, parcel_geometry)
        
        # Calculate Haversine distance from centroid
        centroid_coords = centroid_geometry.get("coordinates", [0, 0])
        centroid_lon, centroid_lat = centroid_coords[0], centroid_coords[1]
        
        dist_meters = haversine_distance_meters(lat, lon, centroid_lat, centroid_lon)
        dist_km = round(dist_meters / 1000.0, 2)

        return {
            "pip_matched": pip_matched,
            "boundary_distance_meters": boundary_dist,
            "haversine_distance_meters": dist_meters,
            "haversine_distance_km": dist_km,
            "centroid": {"lat": centroid_lat, "lon": centroid_lon}
        }

    @staticmethod
    def intersects(geom1: Dict[str, Any], geom2: Dict[str, Any]) -> bool:
        s1 = shape(geom1)
        s2 = shape(geom2)
        return s1.intersects(s2)

gis_service = GISService()
