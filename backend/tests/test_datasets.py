"""
Tests for dataset catalog endpoints.
"""

import pytest
from httpx import AsyncClient


class TestDatasetCatalog:
    """Tests for dataset catalog endpoints."""

    async def test_list_all_datasets(self, client):
        response = await client.get("/datasets")
        assert response.status_code == 200
        data = response.json()
        assert "datasets" in data
        assert "total" in data
        assert "integrated_count" in data
        assert "investigated_count" in data
        assert data["total"] > 0

    async def test_list_integrated_only(self, client):
        response = await client.get("/datasets?integrated_only=true")
        assert response.status_code == 200
        data = response.json()
        for d in data["datasets"]:
            assert d["is_integrated"] is True

    async def test_filter_by_source(self, client):
        response = await client.get("/datasets?source=NASA")
        assert response.status_code == 200
        data = response.json()
        for d in data["datasets"]:
            assert "nasa" in d["source"].lower()

    async def test_filter_by_mission(self, client):
        response = await client.get("/datasets?mission=MRO")
        assert response.status_code == 200
        data = response.json()
        for d in data["datasets"]:
            assert "mro" in d["mission"].lower()

    async def test_filter_by_tags(self, client):
        response = await client.get("/datasets?tags=elevation,global")
        assert response.status_code == 200
        data = response.json()
        for d in data["datasets"]:
            assert any(t in ["elevation", "global"] for t in d["tags"])

    async def test_pagination(self, client):
        response = await client.get("/datasets?limit=5&offset=0")
        assert response.status_code == 200
        data = response.json()
        assert len(data["datasets"]) <= 5

        response = await client.get("/datasets?limit=5&offset=5")
        assert response.status_code == 200

    async def test_get_integrated(self, client):
        response = await client.get("/datasets/integrated")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for d in data:
            assert d["is_integrated"] is True

    async def test_get_by_source(self, client):
        response = await client.get("/datasets/by-source/NASA")
        assert response.status_code == 200
        data = response.json()
        for d in data:
            assert d["source"] == "NASA"

    async def test_get_by_mission(self, client):
        response = await client.get("/datasets/by-mission/MRO")
        assert response.status_code == 200
        data = response.json()
        for d in data:
            assert "mro" in d["mission"].lower()


class TestDatasetDetail:
    """Tests for individual dataset details."""

    async def test_get_mola(self, client):
        response = await client.get("/datasets/mola_dem_463m")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "mola_dem_463m"
        assert data["name"] == "MGS MOLA DEM 463m"
        assert data["is_integrated"] is True
        assert data["license"] == "CC0 (Public Domain)"
        assert data["spatial_resolution_m"] == 463.08

    async def test_get_hirise(self, client):
        response = await client.get("/datasets/hirise_dtm")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "hirise_dtm"
        assert data["spatial_resolution_m"] == 0.25

    async def test_get_iau(self, client):
        response = await client.get("/datasets/iau_gazetteer")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "iau_gazetteer"
        assert data["is_integrated"] is True

    async def test_get_nonexistent(self, client):
        response = await client.get("/datasets/nonexistent_dataset")
        assert response.status_code == 404

    async def test_get_by_source_endpoint(self, client):
        response = await client.get("/datasets/by-source/NASA/USGS")
        assert response.status_code == 200
        data = response.json()
        for d in data:
            assert "nasa" in d["source"].lower() or "usgs" in d["source"].lower()

    async def test_get_by_mission_endpoint(self, client):
        response = await client.get("/datasets/by-mission/Mars Reconnaissance Orbiter")
        assert response.status_code == 200
        data = response.json()
        for d in data:
            assert (
                "reconnaissance" in d["mission"].lower()
                or "mro" in d["mission"].lower()
            )
