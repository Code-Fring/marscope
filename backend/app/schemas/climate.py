"""
Pydantic schemas for climate/weather endpoints.
"""

from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List


class WeatherObservation(BaseModel):
    timestamp: datetime = Field(..., description="Observation timestamp (UTC)")
    lat: float = Field(..., ge=-90, le=90, description="Planetocentric latitude")
    lon: float = Field(..., ge=-180, le=180, description="Longitude (±180)")
    temperature_k: float = Field(..., description="Temperature in Kelvin")
    pressure_pa: float = Field(..., description="Atmospheric pressure in Pascals")
    wind_speed_ms: Optional[float] = Field(None, description="Wind speed in m/s")
    wind_direction_deg: Optional[float] = Field(
        None, ge=0, le=360, description="Wind direction (degrees from north)"
    )
    dust_opacity: Optional[float] = Field(None, description="Dust opacity (tau)")
    relative_humidity: Optional[float] = Field(
        None, ge=0, le=100, description="Relative humidity %"
    )
    source: str = Field(..., description="Data source (REMS, MEDA, MARCI, MCS, etc.)")
    instrument: str = Field(..., description="Instrument name")
    confidence: Optional[str] = Field(None, description="Data quality/confidence")


class ClimateNormals(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    monthly_mean_temp_k: List[float] = Field(
        ..., min_length=12, max_length=12, description="Mean temperature per month (K)"
    )
    monthly_min_temp_k: List[float] = Field(..., min_length=12, max_length=12)
    monthly_max_temp_k: List[float] = Field(..., min_length=12, max_length=12)
    monthly_mean_pressure_pa: List[float] = Field(..., min_length=12, max_length=12)
    monthly_dust_storm_probability: List[float] = Field(
        ...,
        min_length=12,
        max_length=12,
        description="Dust storm probability per month (0-1)",
    )
    monthly_solar_illumination_hours: List[float] = Field(
        ...,
        min_length=12,
        max_length=12,
        description="Mean daily solar illumination hours",
    )
    annual_mean_temp_k: float
    annual_temp_range_k: float
    annual_mean_pressure_pa: float
    data_period: str = Field(
        ..., description="Period covered by normals (e.g., 'MY 28-34')"
    )
    source: str
    reference: Optional[str] = None


class DustStormEvent(BaseModel):
    start_date: datetime
    end_date: datetime
    lat_min: float
    lat_max: float
    lon_min: float
    lon_max: float
    peak_opacity: float
    classification: str = Field(..., description="Local, regional, or global")
    source: str
    reference: Optional[str] = None


class SolarIllumination(BaseModel):
    lat: float
    lon: float
    date: datetime
    sunrise: Optional[datetime] = None
    sunset: Optional[datetime] = None
    daylight_hours: float = Field(..., description="Hours of daylight")
    solar_zenith_angle_noon: float = Field(
        ..., description="Solar zenith angle at local noon (degrees)"
    )
    solar_azimuth_noon: float = Field(
        ..., description="Solar azimuth at local noon (degrees)"
    )
    max_elevation_angle: float = Field(
        ..., description="Maximum solar elevation angle (degrees)"
    )
    polar_day: bool = False
    polar_night: bool = False


class WeatherResponse(BaseModel):
    observations: List[WeatherObservation]
    count: int
    lat: float
    lon: float
    start_date: datetime
    end_date: datetime
    sources: List[str]
    caveat: str = "Weather data from surface instruments and orbital observations. Interpolated values are estimates."
