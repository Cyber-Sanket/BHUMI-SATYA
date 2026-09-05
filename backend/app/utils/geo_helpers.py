import math
from typing import Dict, Any, Tuple
from shapely.geometry import shape, Point, Polygon, MultiPolygon

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance in meters between two points
    on the earth (specified in decimal degrees)
    """
    R = 6371000.0  # Radius of earth in meters

    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)

    a = (math.sin(d_lat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2.0) ** 2)

    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance = R * c
    return round(distance, 2)

def is_point_in_polygon(lat: float, lon: float, geojson_geometry: Dict[str, Any]) -> Tuple[bool, float]:
    """
    Check if point (lat, lon) is inside the given GeoJSON Polygon/MultiPolygon.
    Returns (pip_matched: bool, distance_from_boundary_meters: float)
    """
    point = Point(lon, lat)
    geom_shape = shape(geojson_geometry)

    pip_matched = geom_shape.contains(point) or geom_shape.touches(point)
    
    if pip_matched:
        return True, 0.0
    else:
        # Approximate distance to boundary in meters
        centroid = geom_shape.centroid
        dist_meters = haversine_distance_meters(lat, lon, centroid.y, centroid.x)
        return False, dist_meters

def calculate_centroid(geojson_polygon: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate GeoJSON Point centroid [lon, lat] from a GeoJSON Polygon
    """
    geom_shape = shape(geojson_polygon)
    centroid = geom_shape.centroid
    return {
        "type": "Point",
        "coordinates": [round(centroid.x, 7), round(centroid.y, 7)]
    }
