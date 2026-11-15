"""
Tests for survival assessment endpoints.
"""

import pytest
from httpx import AsyncClient


class TestSurvivalAssessment:
    """Tests for survival assessment endpoint."""

    async def test_assessment_olympus_mons(self, client):
        """Test assessment at Olympus Mons."""
        response = await client.get("/survival/assessment?lat=18.65&lon=226.2")
        assert response.status_code == 200
        data = response.json()
        assert data["location"]["lat"] == 18.65
        assert data["location"]["lon"] == 226.2
        assert "overall_survivability_score" in data
        assert 0 <= data["overall_survivability_score"] <= 100
        assert "atmospheric" in data
        assert "radiation" in data
        assert "thermal" in data
        assert "water" in data
        assert "hazards" in data
        assert "limiting_factors" in data
        assert "caveats" in data

    async def test_assessment_gale_crater(self, client):
        response = await client.get("/survival/assessment?lat=-4.5&lon=137.4")
        assert response.status_code == 200
        data = response.json()
        assert data["location"]["lat"] == -4.5

    async def test_assessment_invalid_lat(self, client):
        response = await client.get("/survival/assessment?lat=100&lon=0")
        assert response.status_code == 422

    async def test_assessment_has_caveats(self, client):
        response = await client.get("/survival/assessment?lat=0&lon=0")
        data = response.json()
        assert len(data["caveats"]) > 0
        assert any(
            "derived" in c.lower() or "uncertain" in c.lower() for c in data["caveats"]
        )


class TestSurvivalCategories:
    """Test individual category scores."""

    async def test_atmospheric_score(self, client):
        response = await client.get("/survival/assessment?lat=0&lon=0")
        data = response.json()
        atm = data["atmospheric"]
        assert "pressure_pa" in atm
        assert atm["pressure_pa"] > 0
        assert "composition" in atm
        assert abs(sum(atm["composition"].values()) - 1.0) < 0.01

    async def test_radiation_score(self, client):
        response = await client.get("/survival/assessment?lat=0&lon=0")
        data = response.json()
        rad = data["radiation"]
        assert "galactic_cosmic_ray_sievert_per_day" in rad
        assert "surface_dose_rate_mgy_per_day" in rad
        assert "subsurface_dose_rate_mgy_per_day" in rad
        assert (
            rad["subsurface_dose_rate_mgy_per_day"]["1.0"]
            < rad["subsurface_dose_rate_mgy_per_day"]["0.1"]
        )

    async def test_thermal_score(self, client):
        response = await client.get("/survival/assessment?lat=0&lon=0")
        data = response.json()
        therm = data["thermal"]
        assert therm["surface_temp_min_k"] < therm["surface_temp_max_k"]
        assert therm["diurnal_range_k"] > 0

    async def test_water_score(self, client):
        response = await client.get("/survival/assessment?lat=85&lon=0")  # Pole
        data = response.json()
        water = data["water"]
        assert "surface_ice_locations" in water
        assert "hydrated_minerals" in water
        assert "extraction_feasibility" in water

    async def test_hazards(self, client):
        response = await client.get("/survival/assessment?lat=0&lon=0")
        data = response.json()
        hazards = data["hazards"]
        assert "slope_exceeds_15_deg" in hazards
        assert "rock_abundance_percent" in hazards
        assert "thermal_stress_risk" in hazards
