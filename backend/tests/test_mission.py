"""
Tests for mission planning endpoints.
"""

import pytest
from httpx import AsyncClient


class TestMissionAnalyzeSite:
    """Tests for site analysis endpoint."""

    async def test_analyze_site_olympus_mons(self, client):
        """Analyze Olympus Mons as landing site."""
        response = await client.post(
            "/mission/analyze-site", json={"lat": 18.65, "lon": 226.2, "radius_km": 50}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["lat"] == 18.65
        assert data["lon"] == 226.2
        assert "score" in data
        assert 0 <= data["score"] <= 100
        assert "slope_stats" in data
        assert "geology" in data
        assert "water_access" in data
        assert "solar_potential" in data
        assert "hazards" in data
        assert "score_breakdown" in data
        assert "assumptions" in data
        assert "uncertainties" in data
        assert "data_sources" in data

    async def test_analyze_site_gale_crater(self, client):
        response = await client.post(
            "/mission/analyze-site", json={"lat": -4.5, "lon": 137.4, "radius_km": 50}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["lat"] == -4.5
        assert data["lon"] == 137.4

    async def test_analyze_site_invalid_lat(self, client):
        response = await client.post(
            "/mission/analyze-site", json={"lat": 100, "lon": 0}
        )
        assert response.status_code == 422

    async def test_analyze_site_negative_lon_normalized(self, client):
        response = await client.post(
            "/mission/analyze-site", json={"lat": 0, "lon": -90}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["lon"] == 270  # Normalized to 0-360


class TestMissionCandidates:
    """Tests for candidate listing."""

    async def test_candidates_default_region(self, client):
        response = await client.get("/mission/candidates?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 10

    async def test_candidates_region_filter(self, client):
        response = await client.get(
            "/mission/candidates?min_lat=-10&max_lat=10&min_lon=130&max_lon=150&limit=5"
        )
        assert response.status_code == 200
        data = response.json()
        for site in data:
            assert -10 <= site["lat"] <= 10
            assert 130 <= site["lon"] <= 150

    async def test_candidates_min_score(self, client):
        response = await client.get("/mission/candidates?min_score=70&limit=5")
        assert response.status_code == 200
        data = response.json()
        for site in data:
            assert site["score"] >= 70
