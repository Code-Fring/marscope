"""
Tests for climate/weather endpoints.
"""

import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta


class TestClimateWeather:
    """Tests for weather endpoint."""

    async def test_weather_default_range(self, client):
        """Test weather with default 7-day range."""
        response = await client.get("/climate/weather?lat=0&lon=0")
        assert response.status_code == 200
        data = response.json()
        assert "observations" in data
        assert "count" in data
        assert data["lat"] == 0
        assert data["lon"] == 0

    async def test_weather_custom_range(self, client):
        """Test weather with custom date range."""
        start = (datetime.utcnow() - timedelta(days=3)).isoformat()
        end = datetime.utcnow().isoformat()
        response = await client.get(
            f"/climate/weather?lat=0&lon=0&start={start}&end={end}"
        )
        assert response.status_code == 200

    async def test_weather_source_filter(self, client):
        """Test filtering by source."""
        response = await client.get("/climate/weather?lat=0&lon=0&source=REMS")
        assert response.status_code == 200

    async def test_weather_invalid_lat(self, client):
        response = await client.get("/climate/weather?lat=100&lon=0")
        assert response.status_code == 422

    async def test_weather_invalid_date_range(self, client):
        start = datetime.utcnow().isoformat()
        end = (datetime.utcnow() - timedelta(days=1)).isoformat()
        response = await client.get(
            f"/climate/weather?lat=0&lon=0&start={start}&end={end}"
        )
        assert response.status_code == 400


class TestClimateNormals:
    """Tests for climate normals endpoint."""

    async def test_normals_equatorial(self, client):
        """Test climate normals at equator."""
        response = await client.get("/climate/normals?lat=0&lon=0")
        assert response.status_code == 200
        data = response.json()
        assert "monthly_mean_temp_k" in data
        assert len(data["monthly_mean_temp_k"]) == 12
        assert data["annual_mean_temp_k"] > 0

    async def test_normals_polar(self, client):
        response = await client.get("/climate/normals?lat=85&lon=0")
        assert response.status_code == 200
        data = response.json()
        assert data["annual_mean_temp_k"] < 200  # Polar is colder

    async def test_normals_polar_day_night(self, client):
        """Test polar day/night in solar illumination hours."""
        response = await client.get("/climate/normals?lat=85&lon=0")
        data = response.json()
        # At pole, summer has 24h daylight, winter 0h
        assert (
            0 in data["monthly_solar_illumination_hours"]
            or 24 in data["monthly_solar_illumination_hours"]
        )
