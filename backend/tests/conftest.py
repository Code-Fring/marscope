"""
Test configuration and fixtures for MARSCOPE Backend.
"""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from fastapi import FastAPI

from app.main import create_app
from app.config import Settings


# Override settings for testing
class TestSettings(Settings):
    mola_cog_path: str = "/nonexistent/path.tif"
    nasa_api_key: str = "test_key"
    debug: bool = True


@pytest_asyncio.fixture
async def app():
    """Create test app with test settings."""
    from app.config import settings

    # Monkey-patch settings for testing
    original_mola_path = settings.mola_cog_path
    settings.mola_cog_path = "/nonexistent/path.tif"

    app = create_app()
    yield app

    # Restore
    settings.mola_cog_path = original_mola_path


@pytest_asyncio.fixture
async def client(app: FastAPI):
    """Async test client."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest_asyncio.fixture
async def mock_cog_reader():
    """Mock COG reader for testing."""
    from unittest.mock import MagicMock

    mock = MagicMock()
    mock.point.return_value = [1000.0]
    return mock


# Test data
VALID_MARS_COORDS = [
    (18.65, 226.2),  # Olympus Mons
    (-4.5, 137.4),  # Gale Crater
    (18.4, 77.5),  # Jezero Crater
    (-7.0, 285.0),  # Valles Marineris
    (-42.0, 70.0),  # Hellas Basin
]

MOCK_ELEVATIONS = {
    (18.65, 226.2): 21900,  # Olympus Mons
    (-4.5, 137.4): -4500,  # Gale Crater
    (18.4, 77.5): -2600,  # Jezero Crater
    (-7.0, 285.0): -6000,  # Valles Marineris
    (-42.0, 70.0): -7500,  # Hellas Basin
}
