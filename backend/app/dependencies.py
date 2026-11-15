"""
Shared FastAPI dependencies for MARSCOPE Backend.
"""

from typing import Annotated, Optional
from fastapi import Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import settings


# Global COG reader (initialized in lifespan)
cog_reader = None


def set_cog_reader(reader):
    """Set the global COG reader instance."""
    global cog_reader
    cog_reader = reader


def get_cog_reader():
    """Get the COG reader, raising 503 if not available."""
    if cog_reader is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MOLA COG not loaded. Backend may be starting up or COG file missing.",
        )
    return cog_reader


# Type aliases for dependency injection
COGReaderDep = Annotated[object, Depends(get_cog_reader)]


# Optional API key authentication (for future use)
security = HTTPBearer(auto_error=False)


async def get_api_key(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
) -> Optional[str]:
    """Extract API key from Authorization header if present."""
    if credentials and credentials.credentials:
        return credentials.credentials
    return None


# Query parameter validators
def validate_latitude(
    lat: float = Query(..., ge=-90, le=90, description="Planetocentric latitude"),
) -> float:
    return lat


def validate_longitude(
    lon: float = Query(
        ..., ge=-180, le=360, description="East-positive longitude 0-360"
    ),
) -> float:
    if lon < 0:
        lon += 360
    return lon


def validate_samples(
    samples: int = Query(100, ge=10, le=1000, description="Number of sample points"),
) -> int:
    return samples


# Mars constants
MARS_RADIUS = 3_396_190  # metres
MOLA_RESOLUTION = 463.0835744  # m/pixel at equator
MOLA_WIDTH_PX = 46_080
MOLA_HEIGHT_PX = 23_040
