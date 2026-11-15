"""
Climate and weather endpoints for MARSCOPE Backend.
Integrates REMS (Curiosity), MEDA (Perseverance), MARCI (MRO), MCS (MRO), TES (MGS) data.
"""

from datetime import datetime, timedelta
from typing import Annotated, Optional
import random

from fastapi import APIRouter, HTTPException, Query, Depends

from app.dependencies import validate_latitude, validate_longitude
from app.schemas.climate import (
    WeatherObservation,
    WeatherResponse,
    ClimateNormals,
    DustStormEvent,
    SolarIllumination,
)

router = APIRouter(prefix="/climate", tags=["climate"])


# Mock data generators (replace with real data integration)
def generate_mock_weather(
    lat: float, lon: float, start: datetime, end: datetime
) -> list[WeatherObservation]:
    """Generate realistic mock weather observations for demonstration."""
    observations = []
    current = start
    sol = int((current - datetime(2012, 8, 6)).days)  # Curiosity landing sol 0

    while current <= end:
        # Simulate REMS-like data (Gale Crater) or MEDA-like (Jezero)
        base_temp = 210 + 20 * math.sin(
            2 * math.pi * (current.timetuple().tm_yday / 668.6)
        )  # Seasonal
        daily_variation = 50 * math.sin(2 * math.pi * (current.hour / 24))
        temp = base_temp + daily_variation + random.uniform(-5, 5)

        pressure = (
            700
            + 100 * math.sin(2 * math.pi * (current.timetuple().tm_yday / 668.6))
            + random.uniform(-20, 20)
        )

        obs = WeatherObservation(
            timestamp=current,
            lat=lat,
            lon=lon,
            temperature_k=round(temp, 1),
            pressure_pa=round(pressure, 1),
            wind_speed_ms=round(random.uniform(0, 15), 1),
            wind_direction_deg=round(random.uniform(0, 360), 1)
            if random.random() > 0.3
            else None,
            dust_opacity=round(random.uniform(0.1, 1.5), 2),
            relative_humidity=round(random.uniform(0, 5), 1),
            source="REMS" if lat < 0 else "MEDA",
            instrument="REMS" if lat < 0 else "MEDA",
            confidence="high",
        )
        observations.append(obs)
        current += timedelta(hours=1)

    return observations


def get_climate_normals(lat: float, lon: float) -> ClimateNormals:
    """Get climate normals for a location (mock data based on published Mars climate atlases)."""
    # Simplified: equatorial vs polar norms
    is_polar = abs(lat) > 60
    is_equatorial = abs(lat) < 15

    if is_polar:
        monthly_mean = [150, 155, 160, 165, 170, 175, 170, 165, 160, 155, 150, 145]
        monthly_pressure = [600, 610, 620, 630, 640, 650, 640, 630, 620, 610, 600, 590]
        dust_prob = [0.1, 0.1, 0.15, 0.2, 0.3, 0.4, 0.3, 0.2, 0.15, 0.1, 0.05, 0.05]
        solar_hours = [0, 1, 3, 6, 12, 24, 24, 12, 6, 3, 1, 0]  # Polar day/night
    elif is_equatorial:
        monthly_mean = [210, 212, 214, 216, 218, 220, 218, 216, 214, 212, 210, 208]
        monthly_pressure = [750, 755, 760, 765, 770, 775, 770, 765, 760, 755, 750, 745]
        dust_prob = [0.05, 0.05, 0.1, 0.2, 0.3, 0.4, 0.35, 0.25, 0.15, 0.1, 0.05, 0.05]
        solar_hours = [12] * 12
    else:
        monthly_mean = [190, 195, 200, 205, 210, 215, 210, 205, 200, 195, 190, 185]
        monthly_pressure = [700, 710, 720, 730, 740, 750, 740, 730, 720, 710, 700, 690]
        dust_prob = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0.15, 0.1, 0.05]
        solar_hours = [10, 11, 12, 12, 12, 12, 12, 12, 12, 11, 10, 9]

    return ClimateNormals(
        lat=lat,
        lon=lon,
        monthly_mean_temp_k=monthly_mean,
        monthly_min_temp_k=[t - 20 for t in monthly_mean],
        monthly_max_temp_k=[t + 20 for t in monthly_mean],
        monthly_mean_pressure_pa=monthly_pressure,
        monthly_dust_storm_probability=dust_prob,
        monthly_solar_illumination_hours=solar_hours,
        annual_mean_temp_k=round(sum(monthly_mean) / 12, 1),
        annual_temp_range_k=max(monthly_mean) - min(monthly_mean),
        annual_mean_pressure_pa=round(sum(monthly_pressure) / 12, 1),
        data_period="MY 28-34 (Mars Years 28-34, approx. 2007-2020 Earth)",
        source="Derived from MGS TES, MRO MCS, MRO MARCI, REMS, MEDA observations",
        reference="Mars Climate Database v6.1; Forget et al. 2022",
    )


def get_dust_storms(
    lat: float, lon: float, season: Optional[str] = None
) -> list[DustStormEvent]:
    """Return known dust storm events for a region/season (mock)."""
    # In reality, query MARCI daily maps or MCS dust opacity records
    return [
        DustStormEvent(
            start_date=datetime(2018, 5, 30),
            end_date=datetime(2018, 9, 15),
            lat_min=-60,
            lat_max=60,
            lon_min=-180,
            lon_max=180,
            peak_opacity=10.8,
            classification="global",
            source="MARCI/MRO",
            reference="Guzewich et al. 2019, JGR Planets",
        ),
        DustStormEvent(
            start_date=datetime(2007, 6, 15),
            end_date=datetime(2007, 7, 20),
            lat_min=-30,
            lat_max=30,
            lon_min=120,
            lon_max=240,
            peak_opacity=4.2,
            classification="regional",
            source="MARCI/MRO",
            reference="Wang & Richardson 2015, Icarus",
        ),
    ]


def calculate_solar_illumination(
    lat: float, lon: float, date: datetime
) -> SolarIllumination:
    """Calculate solar illumination for a location and date (simplified)."""
    # Solar longitude (Ls) approximation
    mars_year_start = datetime(2021, 2, 7)  # MY 36 start
    days_since = (date - mars_year_start).days
    ls = (days_since * 360 / 668.6) % 360  # Solar longitude

    # Obliquity ~25.19°
    obliquity = 25.19
    lat_rad = math.radians(lat)

    # Declination
    dec_rad = math.radians(obliquity) * math.sin(math.radians(ls))

    # Hour angle at sunrise/sunset
    cos_h = -math.tan(lat_rad) * math.tan(dec_rad)

    if cos_h <= -1:
        # Polar day
        return SolarIllumination(
            lat=lat,
            lon=lon,
            date=date,
            sunrise=None,
            sunset=None,
            daylight_hours=24.0,
            solar_zenith_angle_noon=abs(lat - math.degrees(dec_rad)),
            solar_azimuth_noon=0.0,
            max_elevation_angle=90 - abs(lat - math.degrees(dec_rad)),
            polar_day=True,
        )
    elif cos_h >= 1:
        # Polar night
        return SolarIllumination(
            lat=lat,
            lon=lon,
            date=date,
            sunrise=None,
            sunset=None,
            daylight_hours=0.0,
            solar_zenith_angle_noon=180,
            solar_azimuth_noon=0.0,
            max_elevation_angle=0,
            polar_night=True,
        )

    hour_angle = math.degrees(math.acos(cos_h))
    daylight = (
        2 * hour_angle / 15
    )  # Mars hours (24h 39m sol, but using 24h for simplicity)

    # Solar elevation at noon
    noon_elev = 90 - abs(lat - math.degrees(dec_rad))

    return SolarIllumination(
        lat=lat,
        lon=lon,
        date=date,
        sunrise=date.replace(hour=12) - timedelta(hours=daylight / 2),
        sunset=date.replace(hour=12) + timedelta(hours=daylight / 2),
        daylight_hours=round(daylight, 1),
        solar_zenith_angle_noon=round(90 - noon_elev, 1),
        solar_azimuth_noon=0.0,
        max_elevation_angle=round(noon_elev, 1),
    )


import math
from app.schemas.climate import DustStormEvent


@router.get("/weather", response_model=WeatherResponse)
async def get_weather(
    lat: Annotated[float, Depends(validate_latitude)],
    lon: Annotated[float, Depends(validate_longitude)],
    start: Optional[datetime] = Query(None, description="Start date (UTC)"),
    end: Optional[datetime] = Query(None, description="End date (UTC)"),
    source: Optional[str] = Query(
        None, description="Filter by source: REMS, MEDA, MARCI, MCS"
    ),
):
    """Get weather observations for a location and time range."""
    if start is None:
        start = datetime.utcnow() - timedelta(days=7)
    if end is None:
        end = datetime.utcnow()

    if start > end:
        raise HTTPException(
            status_code=400, detail="Start date must be before end date"
        )

    # In production, query actual databases (PDS, NASA APIs)
    observations = generate_mock_weather(lat, lon, start, end)

    if source:
        observations = [obs for obs in observations if obs.source == source]

    return WeatherResponse(
        observations=observations,
        count=len(observations),
        lat=lat,
        lon=lon,
        start_date=start,
        end_date=end,
        sources=list(set(obs.source for obs in observations)),
    )


@router.get("/normals", response_model=ClimateNormals)
async def get_normals(
    lat: Annotated[float, Depends(validate_latitude)],
    lon: Annotated[float, Depends(validate_longitude)],
):
    """Get climate normals (30-Mars-year averages) for a location."""
    return get_climate_normals(lat, lon)


@router.get("/dust-storms", response_model=list)
async def get_dust_storms(
    lat: Annotated[float, Depends(validate_latitude)],
    lon: Annotated[float, Depends(validate_longitude)],
    season: Optional[str] = Query(
        None, description="Season filter: spring, summer, autumn, winter"
    ),
):
    """Get dust storm events for a region."""
    storms = get_dust_storms(lat, lon, season)
    return storms


@router.get("/solar-illumination", response_model=SolarIllumination)
async def get_solar_illumination(
    lat: Annotated[float, Depends(validate_latitude)],
    lon: Annotated[float, Depends(validate_longitude)],
    date: Optional[datetime] = Query(None, description="Date (UTC)"),
):
    """Calculate solar illumination for a location and date."""
    if date is None:
        date = datetime.utcnow()
    return calculate_solar_illumination(lat, lon, date)
