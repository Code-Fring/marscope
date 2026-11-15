"""
Tests for scientific library endpoints.
"""

import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock


class TestLibrarySearch:
    """Tests for library search endpoint."""

    async def test_search_ntrs(self, client):
        """Test search with NTRS (mocked)."""
        with patch("app.routers.library.search_ntrs", new_callable=AsyncMock) as mock:
            mock.return_value = [
                {
                    "id": "NTRS:123",
                    "title": "Mars Geology",
                    "authors": ["Smith, J."],
                    "category": "planetary_science",
                    "source": "NTRS",
                    "url": "https://ntrs.nasa.gov/citations/123",
                }
            ]
            response = await client.get("/library/search?q=mars+geology&page_size=5")
            assert response.status_code == 200
            data = response.json()
            assert "resources" in data
            assert data["total"] >= 0

    async def test_search_openalex(self, client):
        """Test search with OpenAlex (mocked)."""
        with patch(
            "app.routers.library.search_openalex", new_callable=AsyncMock
        ) as mock:
            mock.return_value = [
                {
                    "id": "OPENALEX:123",
                    "title": "Mars Climate",
                    "authors": ["Jones, A."],
                    "category": "planetary_science",
                    "source": "OpenAlex",
                    "citation_count": 42,
                }
            ]
            response = await client.get("/library/search?q=mars+climate&page_size=5")
            assert response.status_code == 200

    async def test_search_zenodo(self, client):
        """Test search with Zenodo (mocked)."""
        with patch("app.routers.library.search_zenodo", new_callable=AsyncMock) as mock:
            mock.return_value = [
                {
                    "id": "ZENODO:123",
                    "title": "Mars Dataset",
                    "category": "dataset",
                    "source": "Zenodo",
                    "doi": "10.5281/zenodo.123",
                }
            ]
            response = await client.get("/library/search?q=mars+dataset&page_size=5")
            assert response.status_code == 200

    async def test_search_combined(self, client):
        """Test combined search across all sources."""
        with (
            patch("app.routers.library.search_ntrs", new_callable=AsyncMock) as mock1,
            patch(
                "app.routers.library.search_openalex", new_callable=AsyncMock
            ) as mock2,
            patch("app.routers.library.search_zenodo", new_callable=AsyncMock) as mock3,
        ):
            mock1.return_value = [{"id": "NTRS:1", "title": "A", "source": "NTRS"}]
            mock2.return_value = [
                {"id": "OPENALEX:1", "title": "B", "source": "OpenAlex"}
            ]
            mock3.return_value = [{"id": "ZENODO:1", "title": "C", "source": "Zenodo"}]

            response = await client.get("/library/search?q=mars&page_size=10")
            assert response.status_code == 200
            data = response.json()
            assert data["total"] >= 3

    async def test_search_category_filter(self, client):
        with (
            patch("app.routers.library.search_ntrs", new_callable=AsyncMock) as mock1,
            patch(
                "app.routers.library.search_openalex", new_callable=AsyncMock
            ) as mock2,
            patch("app.routers.library.search_zenodo", new_callable=AsyncMock) as mock3,
        ):
            mock1.return_value = [
                {
                    "id": "NTRS:1",
                    "title": "A",
                    "category": "planetary_science",
                    "source": "NTRS",
                }
            ]
            mock2.return_value = [
                {
                    "id": "OPENALEX:1",
                    "title": "B",
                    "category": "human_spaceflight",
                    "source": "OpenAlex",
                }
            ]
            mock3.return_value = [
                {
                    "id": "ZENODO:1",
                    "title": "C",
                    "category": "dataset",
                    "source": "Zenodo",
                }
            ]

            response = await client.get(
                "/library/search?q=mars&category=planetary_science&page_size=10"
            )
            assert response.status_code == 200
            data = response.json()
            for r in data["resources"]:
                assert r["category"] == "planetary_science"

    async def test_search_source_filter(self, client):
        with (
            patch("app.routers.library.search_ntrs", new_callable=AsyncMock) as mock1,
            patch(
                "app.routers.library.search_openalex", new_callable=AsyncMock
            ) as mock2,
            patch("app.routers.library.search_zenodo", new_callable=AsyncMock) as mock3,
        ):
            mock1.return_value = [{"id": "NTRS:1", "title": "A", "source": "NTRS"}]
            mock2.return_value = [
                {"id": "OPENALEX:1", "title": "B", "source": "OpenAlex"}
            ]
            mock3.return_value = [{"id": "ZENODO:1", "title": "C", "source": "Zenodo"}]

            response = await client.get(
                "/library/search?q=mars&source=NTRS&page_size=10"
            )
            assert response.status_code == 200
            data = response.json()
            for r in data["resources"]:
                assert r["source"] == "NTRS"

    async def test_search_pagination(self, client):
        with (
            patch("app.routers.library.search_ntrs", new_callable=AsyncMock) as mock1,
            patch(
                "app.routers.library.search_openalex", new_callable=AsyncMock
            ) as mock2,
            patch("app.routers.library.search_zenodo", new_callable=AsyncMock) as mock3,
        ):
            mock1.return_value = [
                {"id": f"NTRS:{i}", "title": f"Paper {i}", "source": "NTRS"}
                for i in range(10)
            ]
            mock2.return_value = []
            mock3.return_value = []

            response = await client.get("/library/search?q=mars&page=1&page_size=3")
            assert response.status_code == 200
            data = response.json()
            assert len(data["resources"]) == 3
            assert data["page"] == 1
            assert data["page_size"] == 3
            assert data["total"] >= 10

            response = await client.get("/library/search?q=mars&page=2&page_size=3")
            assert response.status_code == 200
            data = response.json()
            assert len(data["resources"]) == 3
            assert data["page"] == 2


class TestLibraryCategoriesSources:
    """Tests for categories and sources endpoints."""

    async def test_categories(self, client):
        response = await client.get("/library/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert "planetary_science" in data
        assert "human_spaceflight" in data
        assert "life_support" in data

    async def test_sources(self, client):
        response = await client.get("/library/sources")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert "NTRS" in data
        assert "OpenAlex" in data
        assert "Zenodo" in data
