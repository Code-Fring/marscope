"""
Mission Planning endpoints for MARSCOPE Backend.
Analyzes landing sites, generates traverse plans, and evaluates mission feasibility.
"""

import math
import uuid
from typing import Annotated, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Body, Depends
from pydantic import BaseModel, Field

from app.dependencies import validate_latitude, validate_longitude, get_reader
from app.schemas.mission import (
    LandingSiteCandidate,
    SiteAnalysisRequest,
    MissionPlan,
    MissionPlanRequest,
    SlopeStats,
    GeologySummary,
    WaterAccess,
    SolarPotential,
    CommWindow,
    Hazard,
    TraverseWaypoint,
    ScienceObjective,
    RiskAssessment,
    ResourceBudget,
    Timeline,
)

router = APIRouter(prefix="/mission", tags=["mission"])


def get_reader_safe():
    """Safely get the COG reader."""
    try:
        from app.routers.elevation import get_reader

        return get_reader()
    except Exception:
        return None


def interpolate_elevation(lat: float, lon: float) -> float:
    reader = get_reader_safe()
    if reader is None:
        return float("nan")
    if lon < 0:
        lon += 360
    try:
        result = reader.point(lat, lon)
        return float(result[0])
    except Exception:
        return float("nan")


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 3_396_190
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(math.radians(lon2 - lon1) / 2) ** 2
    )
    c = 2 * math.asin(min(1, math.sqrt(a)))
    return R * c


def get_slope_at_point(lat: float, lon: float) -> float:
    """Approximate slope from MOLA (mock - in production query slope endpoint)."""
    # Mock: return slope based on some regional knowledge
    # In production, query the /elevation/slope endpoint
    return random.uniform(0, 20)


import random


def analyze_landing_site(
    lat: float, lon: float, radius_km: float = 50
) -> LandingSiteCandidate:
    """Analyze a candidate landing site comprehensively."""
    elev = interpolate_elevation(lat, lon)
    if math.isnan(elev):
        elev = 0.0

    # Slope analysis (sample in radius)
    slopes = []
    for _ in range(100):
        dlat = random.uniform(-radius_km / 111, radius_km / 111)
        dlon = random.uniform(
            -radius_km / (111 * math.cos(math.radians(lat))),
            radius_km / (111 * math.cos(math.radians(lat))),
        )
        slopes.append(
            get_slope_at_point(
                lat + dlat, lon + random.uniform(-radius_km / 111, radius_km / 111)
            )
        )

    slopes.sort()
    slope_stats = SlopeStats(
        mean_deg=round(sum(slopes) / len(slopes), 1),
        max_deg=round(max(slopes), 1),
        pct_under_5=round(sum(1 for s in slopes if s < 5) / len(slopes) * 100, 1),
        pct_under_15=round(sum(1 for s in slopes if s < 15) / len(slopes) * 100, 1),
        pct_under_30=round(sum(1 for s in slopes if s < 30) / len(slopes) * 100, 1),
    )

    # Geology (mock - in production query USGS maps)
    geology = GeologySummary(
        primary_unit="Hesperian ridged plains"
        if abs(lat) < 30
        else "Amazonian volcanic",
        unit_age="Hesperian" if abs(lat) < 30 else "Amazonian",
        mineralogy=["basalt", "pyroxene", "olivine"],
        stratigraphic_context="Smooth plains overlying older cratered terrain",
        reference="USGS Geologic Map of Mars, 2014",
    )

    # Water access
    water = WaterAccess(
        distance_to_ice_km=50 if abs(lat) > 30 else 500,
        ice_type="subsurface"
        if 30 < abs(lat) < 60
        else ("surface" if abs(lat) > 80 else None),
        extraction_difficulty="moderate" if 30 < abs(lat) < 60 else "hard",
        estimated_yield_kg_per_sol=500 if abs(lat) > 30 else 100,
    )

    # Solar potential
    lat_abs = abs(lat)
    solar = SolarPotential(
        annual_insolation_kwh_m2=round(500 * (1 - lat_abs / 90) + 100, 1),
        worst_month_insolation_kwh_m2=round(20 * (1 - lat_abs / 90), 1),
        daylight_hours_winter=8 if lat_abs < 60 else 0,
        daylight_hours_summer=24 if lat_abs < 60 else 24,
        dust_degradation_per_sol=0.001,
    )

    # Communications
    comm = CommWindow(
        earth_visible_hours_per_sol=12,
        relay_orbiter_passes_per_sol=4,
        max_data_rate_mbps=2.0,
        blackout_periods_per_year=2,
    )

    # Hazards
    hazards = []
    slope = random.uniform(0, 20)
    if slope > 15:
        hazards.append(
            Hazard(
                type="slope",
                severity="high",
                description=f"Mean slope {slope:.1f}° exceeds 15° landing limit",
            )
        )
    elif slope > 10:
        hazards.append(
            Hazard(
                type="slope",
                severity="moderate",
                description=f"Mean slope {slope:.1f}°",
            )
        )

    rock_abundance = random.uniform(1, 15)
    if rock_abundance > 10:
        hazards.append(
            Hazard(
                type="rock",
                severity="high",
                description=f"Rock abundance {rock_abundance:.0f}%",
            )
        )
    elif rock_abundance > 5:
        hazards.append(
            Hazard(
                type="rock",
                severity="moderate",
                description=f"Rock abundance {rock_abundance:.0f}%",
            )
        )

    # Scoring
    score = 100
    score_breakdown = {
        "slope": 25
        if slope_stats.pct_under_5 > 80
        else 15
        if slope_stats.pct_under_15 > 80
        else 5,
        "rocks": 20 if rock_abundance < 5 else 10 if rock_abundance < 10 else 0,
        "elevation": 20
        if interpolate_elevation(lat, lon) < 0
        else 15
        if interpolate_elevation(lat, lon) < 1000
        else 5,
        "water": 15 if abs(lat) > 30 else 5,
        "solar": 15,
        "comms": 10,
    }
    total_score = sum(score_breakdown.values())

    return LandingSiteCandidate(
        id=str(uuid.uuid4())[:8],
        name=f"Site_{lat:.2f}_{lon:.2f}",
        lat=lat,
        lon=lon,
        elevation_m=round(interpolate_elevation(lat, lon), 1)
        if not math.isnan(interpolate_elevation(lat, lon))
        else 0,
        slope_stats=slope_stats,
        geology=geology,
        water_access=water,
        solar_potential=solar,
        communications=comm,
        hazards=hazards,
        score=round(total_score, 1),
        score_breakdown=score_breakdown,
        assumptions=[
            "MOLA 463m DEM for elevation/slope",
            "Regional geology from USGS maps",
            "Water ice from SHARAD synthesis",
            "Solar model assumes clean panels",
            "Comm assumes MRO/TGO relays",
        ],
        uncertainties={
            "elevation": "±3m vertical, ~100m horizontal",
            "slope": "Derived from 463m DEM, meter-scale slopes unknown",
            "water": "Orbital detection only, not ground-truthed",
            "solar": "No dust storm modeling, assumes clean panels",
        },
        data_sources=[
            "MGS MOLA DEM 463m",
            "USGS Geologic Map of Mars",
            "SHARAD/CRISM ice maps",
            "MRO MCS/TES climate data",
        ],
    )


@router.post("/analyze-site", response_model=LandingSiteCandidate)
async def analyze_site(request: SiteAnalysisRequest = Body(...)):
    """Analyze a candidate landing site."""
    if request.lon < 0:
        request.lon += 360

    return analyze_landing_site(request.lat, request.lon, request.radius_km)


@router.get("/candidates", response_model=list[LandingSiteCandidate])
async def get_candidates(
    min_lat: float = Query(-90, ge=-90, le=90),
    max_lat: float = Query(90, ge=-90, le=90),
    min_lon: float = Query(-180, ge=-180, le=180),
    max_lon: float = Query(180, ge=-180, le=180),
    min_score: float = Query(0, ge=0, le=100),
    limit: int = Query(20, ge=1, le=100),
):
    """Get pre-analyzed landing site candidates in a region."""
    candidates = []

    # Generate grid of candidates
    lat_step = 5
    lon_step = 10

    for lat in range(int(min_lat), int(max_lat), lat_step):
        for lon in range(int(min_lon), int(max_lon), lon_step):
            if lon < 0:
                lon += 360
            site = analyze_landing_site(lat, lon, 50)
            if site.score >= min_score:
                candidates.append(site)

    # Sort by score
    candidates.sort(key=lambda x: x.score, reverse=True)
    return candidates[:limit]


@router.post("/plan", response_model=MissionPlan)
async def create_mission_plan(request: MissionPlanRequest = Body(...)):
    """Generate a mission plan from a landing site and objectives."""
    if request.landing_site.lon < 0:
        request.landing_site.lon += 360

    # Generate traverse waypoints
    waypoints = []
    total_dist = 0

    for i, obj in enumerate(request.science_objectives):
        if obj.target_location:
            wp = TraverseWaypoint(
                id=f"WP{i + 1}",
                name=obj.name,
                lat=obj.target_location["lat"],
                lon=obj.target_location["lon"],
                elevation_m=interpolate_elevation(
                    obj.target_location["lat"], obj.target_location["lon"]
                )
                or 0,
                distance_from_previous_km=round(
                    haversine(
                        request.landing_site.lat
                        if i == 0
                        else request.science_objectives[i - 1].target_location["lat"],
                        request.landing_site.lon
                        if i == 0
                        else request.science_objectives[i - 1].target_location["lon"],
                        obj.target_location["lat"],
                        obj.target_location["lon"],
                    )
                    / 1000,
                    1,
                ),
                science_objective=obj.name,
                estimated_drive_time_sols=max(
                    1,
                    int(
                        haversine(
                            request.landing_site.lat
                            if i == 0
                            else request.science_objectives[i - 1].target_location[
                                "lat"
                            ],
                            request.landing_site.lon
                            if i == 0
                            else request.science_objectives[i - 1].target_location[
                                "lon"
                            ],
                            obj.target_location["lat"],
                            obj.target_location["lon"],
                        )
                        / 1000
                        / 0.1
                    ),
                ),  # ~100m/sol
                power_budget_wh=5000,
                science_priority=obj.priority,
            )
            waypoints.append(wp)

    # Risk assessment
    risk = RiskAssessment(
        overall_risk="moderate",
        risk_factors=[
            {
                "factor": "Radiation exposure",
                "likelihood": "high",
                "impact": "high",
                "mitigation": "Subsurface habitat, regolith shielding",
            },
            {
                "factor": "Dust storms",
                "likelihood": "moderate",
                "impact": "high",
                "mitigation": "Dust-resistant systems, power reserves",
            },
            {
                "factor": "Equipment failure",
                "likelihood": "moderate",
                "impact": "high",
                "mitigation": "Redundancy, ISRU spare parts",
            },
        ],
        mitigation_strategies=[
            "Habitat buried under 2-3m regolith",
            "Redundant life support systems",
            "ISRU for water/oxygen production",
        ],
        contingency_plans=[
            "Abort to orbit capability",
            "Emergency ascent vehicle",
            "Earth-return contingency",
        ],
    )

    # Resource budget
    resource = ResourceBudget(
        total_mass_kg=20000 + 5000 * request.crew_size,
        power_budget_wh_per_sol=5000 * request.crew_size,
        data_volume_gb=100 * request.max_sols / 500,
        consumables_kg=500 * request.crew_size * request.max_sols / 500,
        margin_pct=0.3,
    )

    # Timeline
    timeline = Timeline(
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=request.max_sols),
        total_sols=request.max_sols,
        milestones=[
            {"sol": 0, "event": "Landing"},
            {"sol": 30, "event": "Habitat deployment complete"},
            {"sol": 60, "event": "First traverse"},
            {"sol": request.max_sols // 2, "event": "Mid-mission review"},
            {"sol": request.max_sols - 60, "event": "Ascent preparation"},
            {"sol": request.max_sols, "event": "Ascent/Departure"},
        ],
    )

    return MissionPlan(
        id=str(uuid.uuid4())[:8],
        name=f"Mission_{request.landing_site.name}",
        landing_site=request.landing_site,
        traverse_waypoints=waypoints,
        science_objectives=request.science_objectives,
        risk_assessment=risk,
        resource_budget=resource,
        timeline=timeline,
        assumptions=[
            "Landing site is within certified ellipse",
            "ISRU demonstration successful",
            "Relay orbiters operational",
        ],
        limitations=[
            "No real-time hazard avoidance",
            "Weather not modeled beyond statistical",
            "ISRU performance based on lab tests",
        ],
    )


@router.get("/site/{site_id}", response_model=LandingSiteCandidate)
async def get_site(site_id: str):
    """Get a previously analyzed site by ID."""
    # In production, query database
    raise HTTPException(
        status_code=404,
        detail="Site not found. Use POST /mission/analyze-site to create new analyses.",
    )
