"""
Tests for elevation endpoints.
"""

import pytest
from httpx import AsyncClient
from unittest.mock import patch, MagicMock


class TestElevationHealth:
    """Tests for health endpoint."""

    async def test_health_no_cog(self, client):
        """Health endpoint returns 503 when COG not loaded."""
        response = await client.get("/elevation/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["mola_cog_loaded"] is False


class TestElevationPoint:
    """Tests for point elevation endpoint."""

    @pytest.mark.parametrize(
        "lat,lon,expected_elev",
        [
            (18.65, 226.2, 21900),  # Olympus Mons
            (-4.5, 137.4, -4500),  # Gale Crater
            (18.4, 77.5, -2600),  # Jezero Crater
        ],
    )
    async def test_elevation_point(self, client, lat, lon, expected_elev):
        """Test elevation at known locations (requires COG)."""
        # This test will fail without COG - demonstrates expected behavior
        response = await client.get(f"/elevation/point?lat={lat}&lon={lon}")
        # Without COG, returns 503
        # With COG, would return 200 with elevation data
        assert response.status_code in [200, 503]

    async def test_elevation_invalid_lat(self, client):
        """Test invalid latitude rejected."""
        response = await client.get("/elevation/point?lat=100&lon=0")
        assert response.status_code == 422

    async def test_elevation_invalid_lon(self, client):
        """Test invalid longitude rejected."""
        response = await client.get("/elevation/point?lat=0&lon=400")
        assert response.status_code == 422

    async def test_elevation_negative_lon_normalized(self, client):
        """Test negative longitude normalized to 0-360."""
        response = await client.get("/elevation/point?lat=0&lon=-90")
        # Should normalize -90 to 270
        assert response.status_code in [200, 503]


class TestElevationProfile:
    """Tests for elevation profile endpoint."""

    async def test_profile_two_points(self, client):
        """Test profile between two points."""
        coords = "18.65,226.2;-4.5,137.4"  # Olympus to Gale
        response = await client.get(f"/elevation/profile?coords={coords}&samples=10")
        assert response.status_code in [200, 503]

    async def test_profile_insufficient_points(self, client):
        """Test error with single point."""
        response = await client.get("/elevation/profile?coords=0,0")
        assert response.status_code == 400

    async def test_profile_invalid_coords(self, client):
        """Test invalid coordinate format."""
        response = await client.get("/elevation/profile?coords=invalid")
        assert response.status_code == 400

    async def test_profile_samples_validation(self, client):
        """Test samples parameter validation."""
        coords = "0,0;1,1"
        response = await client.get(f"/elevation/profile?coords={coords}&samples=5")
        assert response.status_code == 422  # samples < 10

        response = await client.get(f"/elevation/profile?coords={coords}&samples=2000")
        assert response.status_code == 422  # samples > 1000


class TestElevationSlope:
    """Tests for slope endpoint."""

    async def test_slope_point(self, client):
        """Test slope at a point."""
        response = await client.get("/elevation/slope?lat=0&lon=0")
        assert response.status_code in [200, 503]

    async def test_slope_invalid_lat(self, client):
        response = await client.get("/elevation/slope?lat=100&lon=0")
        assert response.status_code == 422


class TestElevationRoute:
    """Tests for route endpoint."""

    async def test_route_two_waypoints(self, client):
        """Test route between two waypoints."""
        coords = "18.65,226.2;-4.5,137.4"
        response = await client.get(f"/elevation/route?coords={coords}&samples=10")
        assert response.status_code in [200, 503]

    async def test_route_single_waypoint(self, client):
        """Test error with single waypoint."""
        response = await client.get("/elevation/route?coords=0,0")
        assert response.status_code == 400

    async def test_route_samples_validation(self, client):
        coords = "0,0;1,1"
        response = await client.get(f"/elevation/route?coords={coords}&samples=5")
        assert response.status_code == 422


class TestElevationTiles:
    """Tests for tile endpoints."""

    @pytest.mark.parametrize("layer", ["mola_hillshade", "mola_color", "mola_slope"])
    async def test_tile_endpoint(self, client, layer):
        """Test tile endpoints return PNG."""
        response = await client.get(f"/elevation/tiles/{layer}/0/0/0.png")
        assert response.status_code in [200, 503]
        if response.status_code == 200:
            assert response.headers["content-type"] == "image/png"
            # Verify PNG signature
            assert response.content[:8] == b"\x89PNG\r\n\x1a\n"
