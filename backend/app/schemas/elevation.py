"""
Pydantic schemas for elevation endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional


class ElevationResponse(BaseModel):
    elevation: float = Field(..., description="Elevation in metres")
    source: str = Field(default="MGS MOLA DEM 463m", description="Data source")
    resolution: str = Field(default="463 m/pixel", description="Spatial resolution")
    accuracy: str = Field(
        default="±3 m vertical, ~100 m horizontal", description="Stated accuracy"
    )
    method: str = Field(
        default="bilinear interpolation", description="Interpolation method"
    )


class ProfilePoint(BaseModel):
    lat: float = Field(..., description="Planetocentric latitude")
    lon: float = Field(..., description="East-positive longitude (0-360)")
    elev: float = Field(..., description="Elevation in metres")
    dist: float = Field(..., description="Distance from start in metres")


class ProfileResponse(BaseModel):
    points: list[ProfilePoint]
    totalDistance: float = Field(..., description="Total distance in metres")
    cumulativeAscent: float = Field(..., description="Cumulative ascent in metres")
    cumulativeDescent: float = Field(..., description="Cumulative descent in metres")
    maxSlope: float = Field(..., description="Maximum slope in degrees")
    minElevation: float = Field(..., description="Minimum elevation in metres")
    maxElevation: float = Field(..., description="Maximum elevation in metres")
    source: str = Field(default="MGS MOLA DEM 463m")
    resolution: str = Field(default="463 m/pixel")
    method: str = Field(default="bilinear interpolation along great-circle")


class SlopeResponse(BaseModel):
    slope: float = Field(..., description="Slope in degrees")
    aspect: float = Field(..., description="Aspect in degrees from north (clockwise)")
    source: str = Field(default="MGS MOLA DEM 463m")
    resolution: str = Field(default="463 m/pixel")
    method: str = Field(default="Horn's method (3x3 neighborhood)")


class RouteSegment(BaseModel):
    start: dict = Field(..., description="Start waypoint {lat, lon}")
    end: dict = Field(..., description="End waypoint {lat, lon}")
    distance: float = Field(..., description="Segment distance in metres")
    ascent: float = Field(..., description="Cumulative ascent in metres")
    descent: float = Field(..., description="Cumulative descent in metres")
    maxSlope: float = Field(..., description="Maximum slope in degrees")


class RouteResponse(BaseModel):
    waypoints: list[dict] = Field(..., description="List of waypoints {lat, lon}")
    totalDistance: float = Field(..., description="Total route distance in metres")
    cumulativeAscent: float = Field(..., description="Total ascent in metres")
    cumulativeDescent: float = Field(..., description="Total descent in metres")
    maxSlope: float = Field(..., description="Maximum slope along route in degrees")
    segments: list[dict] = Field(..., description="Per-segment metrics")
    source: str = Field(default="MGS MOLA DEM 463m")
    resolution: str = Field(default="463 m/pixel")
    caveat: str = Field(
        default="Candidate route only - no hazard/rock/trafficability/illumination/comms data",
        description="Important limitations",
    )


class HealthResponse(BaseModel):
    status: str
    mola_cog_loaded: bool
