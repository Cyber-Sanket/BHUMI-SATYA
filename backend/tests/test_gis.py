import pytest
from app.utils.geo_helpers import haversine_distance_meters, is_point_in_polygon

def test_haversine_distance():
    # Nagpur center (21.1458, 79.0882) to same point
    dist_zero = haversine_distance_meters(21.1458, 79.0882, 21.1458, 79.0882)
    assert dist_zero == 0.0

    # Nagpur (21.1458, 79.0882) to Wardha (~56.9 km south-west)
    dist_wardha = haversine_distance_meters(21.1458, 79.0882, 20.6850, 78.8500)
    assert 50000 <= dist_wardha <= 60000

def test_point_in_polygon_inside():
    polygon_geojson = {
        "type": "Polygon",
        "coordinates": [[
            [79.080, 21.140],
            [79.090, 21.140],
            [79.090, 21.150],
            [79.080, 21.150],
            [79.080, 21.140]
        ]]
    }
    # Point strictly inside
    pip_matched, dist = is_point_in_polygon(21.145, 79.085, polygon_geojson)
    assert pip_matched is True
    assert dist == 0.0

def test_point_in_polygon_outside_51km():
    polygon_geojson = {
        "type": "Polygon",
        "coordinates": [[
            [79.080, 21.140],
            [79.090, 21.140],
            [79.090, 21.150],
            [79.080, 21.150],
            [79.080, 21.140]
        ]]
    }
    # Point ~51 km outside
    pip_matched, dist = is_point_in_polygon(20.6850, 78.8500, polygon_geojson)
    assert pip_matched is False
    assert dist > 40000.0
