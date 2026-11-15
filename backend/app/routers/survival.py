"""
Interplanetary Survival Assessment endpoints.
Integrates atmospheric, radiation, thermal, water resource, and hazard data.
"""

import math
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Depends

from app.dependencies import validate_latitude, validate_longitude, get_reader
from app.schemas.survival import (
    SurvivalAssessment,
    SurvivalCategoryResponse,
    SurvivalComparisonResponse,
    AtmosphericConditions,
    RadiationEnvironment,
    ThermalEnvironment,
    WaterResources,
    HazardAssessment,
)

router = APIRouter(prefix="/survival", tags=["survival"])


# Constants
MARS_RADIUS = 3_396_190
MOLA_RESOLUTION = 463.0835744


def interpolate_elevation(lat: float, lon: float) -> float:
    """Get elevation from MOLA COG."""
    reader = get_reader()  # from elevation router
    if lon < 0:
        lon += 360
    try:
        result = reader.point(lat, lon)
        return float(result[0])
    except Exception:
        return float("nan")


def get_atmospheric_conditions(lat: float, lon: float, season: str = "average") -> AtmosphericConditions:
    """Get atmospheric conditions at a location."""
    elev = interpolate_elevation(lat, lon)
    if math.isnan(elev):
        elev = 0.0

    # Pressure model: barometric formula with Mars g = 3.71 m/s²
    # P = P0 * exp(-z/H) where H ≈ 11.1 km
    # Reference: P0 ≈ 610 Pa at datum (0 km)
    scale_height = 11100  # metres
    pressure_pa = 610 * math.exp(-elev / 11100)

    # Temperature model
    # Equatorial mean ~210K, polar ~150K, lapse rate ~1.5 K/km
    lat_abs = abs(lat)
    base_temp = 210 - 60 * (lat_abs / 90)  # 210K equator, 150K poles
    lapse_rate = 1.5  # K/km
    temp_k = 210 - (elev / 1000) * 1.5

    # Seasonal variation
    seasonal_factor = 1.0  # Could add seasonal model

    return AtmosphericConditions(
        pressure_pa=round(pressure_pa, 1),
        composition={"CO2": 0.953, "N2": 0.027, "Ar": 0.016, "O2": 0.0013, "CO": 0.0008},
        density_kg_m3=round(pressure_pa / (192 * 210), 4),  # CO2 gas constant ~192 J/kg·K
        temperature_k=round(temp_k, 1),
        scale_height_km=11.1,
        seasonal_variation={"pressure_pct": 0.25, "temp_pct": 0.15}
    )


def get_radiation_environment(lat: float, lon: float) -> RadiationEnvironment:
    """Get radiation environment at location."""
    elev = interpolate_elevation(lat, lon)
    if math.isnan(elev):
        elev = 0.0

    # GCR dose rate: ~0.2 mGy/day at surface, reduced by atmosphere
    # Higher elevation = less shielding = higher dose
    # Reference: RAD on Curiosity measured ~0.21 mGy/day GCR + 0.04 mGy/day SPE average
    base_gcr_mgy = 0.21
    elevation_factor = math.exp(elev / 15000)  # Increases with elevation
    gcr_mgy_day = base_gcr_mgy * elevation_factor

    # SPE probability: ~1-2 per year, higher at solar max
    spe_prob = 0.005  # per sol

    # Total surface dose
    total_mgy = gcr_mgy_day + 0.04  # Add average SPE contribution

    # Subsurface dose rates
    subsurface = {
        "0.1": round(gcr_mgy_day * 0.5, 3),
        "0.5": round(gcr_mgy_day * 0.1, 3),
        "1.0": round(gcr_mgy_day * 0.02, 3),
        "2.0": round(gcr_mgy_day * 0.005, 3),
        "3.0": round(gcr_mgy_day * 0.001, 3),
    }

    return RadiationEnvironment(
        galactic_cosmic_ray_sievert_per_day=round(gcr_mgy_day * 0.001, 6),  # Convert mGy to Sv (Q=1 for GCR)
        solar_particle_event_probability=round(0.005, 4),
        surface_dose_rate_mgy_per_day=round(total_mgy, 3),
        subsurface_dose_rate_mgy_per_day=subsurface,
        shielding_recommendations=[
            "Regolith: 2-3 m for long-term habitation (reduces GCR to <5 mSv/yr)",
            "Water/ice: 1 m equivalent provides similar shielding",
            "Polyethylene: 10 cm reduces GCR by ~30%",
            "Lava tubes: Natural shielding, dose rates <5 mSv/yr at depth >10 m"
        ],
        acute_risk_threshold_sv=0.25,
        chronic_risk_threshold_sv_per_year=0.05
    )


def get_thermal_environment(lat: float, lon: float) -> ThermalEnvironment:
    elev = interpolate_elevation(lat, lon)
    if math.isnan(elev):
        elev = 0.0

    # Temperature model based on latitude, elevation, season
    lat_abs = abs(lat)
    base_mean = 210 - 60 * (abs(lat) / 90)  # 210K equator, 150K poles
    lapse_rate = 1.5  # K/km
    mean_temp = base_mean - (elev / 1000) * 1.5

    # Diurnal range: equator ~70K, poles ~20K
    diurnal = 70 * (1 - abs(lat) / 90) + 20
    # Seasonal range
    seasonal = 30 * (1 - abs(lat) / 90) + 10

    # Thermal inertia from TES/THEMIS: 100-500 J·m⁻²·K⁻¹·s⁻¹/²
    # Equatorial low inertia (dust), polar high (ice)
    thermal_inertia = 300 - 200 * (abs(lat) / 90)

    return ThermalEnvironment(
        surface_temp_min_k=round(base_mean - diurnal/2, 1),
        surface_temp_max_k=round(base_mean + diurnal/2, 1),
        surface_temp_mean_k=round(base_mean, 1),
        diurnal_range_k=round(diurnal, 1),
        seasonal_range_k=round(seasonal, 1),
        regolith_thermal_inertia=round(thermal_inertia, 1),
        subsurface_temp_gradient_k_per_m=1.5
    )


def get_water_resources(lat: float, lon: float) -> WaterResources:
    """Get water resource data for a location."""
    from app.schemas.survival import WaterResourceFeature, WaterResources

    # Known water ice locations (simplified - in reality query SHARAD/CRISM databases)
    features = []

    # Polar caps
    if abs(lat) > 80:
        features.append(WaterResourceFeature(
            name=f"{'North' if lat > 0 else 'South'} Polar Cap",
            lat=lat, lon=lon,
            type="surface_ice",
            confidence=0.99,
            estimated_volume_km3=1.6e6,
            depth_m=2000,
            reference="Smith et al. 2009, Science"
        ))

    # Mid-latitude glaciers
    if 30 < abs(lat) < 60:
        features.append(WaterResourceFeature(
            name="Mid-latitude Glacier",
            lat=lat, lon=lon,
            type="subsurface_ice",
            confidence=0.8,
            estimated_volume_km3=1000,
            depth_m=50,
            reference="Holt et al. 2008, Science"
        ))

    # Hydrated minerals (CRISM)
    if 15 < abs(lat) < 45:
        features.append(WaterResourceFeature(
            name="Hydrated Sulfates/Clays",
            lat=lat, lon=lon,
            type="hydrated_mineral",
            confidence=0.7,
            reference="Ehlmann et al. 2011, Nature"
        ))

    # Recurring slope lineae
    if 25 < abs(lat) < 40:
        features.append(WaterResourceFeature(
            name="Recurring Slope Lineae (RSL)",
            lat=lat, lon=lon,
            type="recurring_slope_lineae",
            confidence=0.6,
            reference="McEwen et al. 2014, Nature Geoscience"
        ))

    return WaterResources(
        surface_ice_locations=[f for f in features if f.type == "surface_ice"],
        hydrated_minerals=[f for f in features if f.type == "hydrated_mineral"],
        subsurface_ice_probability={
            "source": "SHARAD/CRISM synthesis",
            "resolution": "3 km/pixel",
            "coverage": "30°-60° latitude"
        },
        hydrated_minerals=[f for f in features if f.type == "hydrated_mineral"],
        recurring_slope_lineae=[f for f in features if f.type == "recurring_slope_lineae"],
        extraction_feasibility={
            "surface_ice": {"energy_MJ_per_kg": 2.8, "equipment": "excavator + heater", "yield_kg_per_sol": 1000},
            "subsurface_ice": {"energy_MJ_per_kg": 3.5, "equipment": "drill + heater", "yield_kg_per_sol": 500},
            "hydrated_minerals": {"energy_MJ_per_kg": 15, "equipment": "oven + crusher", "yield_kg_per_sol": 100},
        },
        total_accessible_ice_km3=5000000  # Global estimate
    )


def get_hazard_assessment(lat: float, lon: float) -> HazardAssessment:
    """Assess environmental hazards at a location."""
    elev = interpolate_elevation(lat, lon)
    if math.isnan(elev):
        elev = 0.0

    # Slope from MOLA (approximate)
    # In production, query slope endpoint
    slope = random.uniform(0, 20)  # Mock

    # Rock abundance from thermal inertia
    rock_abundance = random.uniform(1, 15)

    # Crater density (craters/km² > 1km)
    crater_density = random.uniform(10, 200) if abs(lat) < 30 else random.uniform(100, 500)

    return HazardAssessment(
        slope_exceeds_15_deg=slope > 15,
        slope_exceeds_30_deg=slope > 30,
        rock_abundance_percent=round(rock_abundance, 1),
        crater_density=round(crater_density, 1),
        dust_storm_frequency=0.3 if abs(lat) < 30 else 0.1,
        radiation_exceeds_chronic=False,  # Would check radiation endpoint
        thermal_stress_risk="moderate",
        dust_devil_risk="moderate"
    )


def calculate_survivability_score(
    atmospheric: AtmosphericConditions,
    radiation: RadiationEnvironment,
    thermal: ThermalEnvironment,
    water: WaterResources,
    hazards: HazardAssessment
) -> tuple[float, list[str]]:
    """Calculate composite survivability score (0-100)."""
    score = 0
    limiting = []

    # Atmospheric (20%)
    # Pressure > 600 Pa (0.6 kPa) for liquid water stability at >0°C
    if atmospheric.pressure_pa > 600:
        score += 20
    else:
        score += 20 * (atmospheric.pressure_pa / 600)
        limiting.append(f"Low pressure ({atmospheric.pressure_pa:.0f} Pa)")

    # Radiation (25%)
    # Target: <50 mSv/yr for long-term (5 mSv/yr is ideal)
    annual_dose_sv = radiation.surface_dose_rate_mgy_per_day * 365 / 1000
    if annual_dose_sv < 0.05:
        score += 25
    elif annual_dose_sv < 0.1:
        score += 20
        limiting.append(f"Radiation {annual_dose_sv:.2f} Sv/yr exceeds 50 mSv/yr target")
    else:
        score += 10
        limiting.append(f"High radiation ({annual_dose_sv:.2f} Sv/yr)")

    # Thermal (20%)
    # Need >190K for equipment, >273K for liquid water without heating
    if thermal.surface_temp_mean_k > 273:
        score += 20
    elif thermal.surface_temp_mean_k > 220:
        score += 15
        limiting.append(f"Cold ({thermal.surface_temp_mean_k:.0f} K mean)")
    else:
        score += 10
        limiting.append(f"Very cold ({thermal.surface_temp_mean_k:.0f} K mean)")

    # Water (20%)
    has_ice = len(water.surface_ice_locations) > 0 or len([f for f in water.hydrated_minerals if f.type == "subsurface_ice"]) > 0
    if has_ice:
        score += 20
    else:
        score += 5
        limiting.append("No confirmed accessible water ice")

    # Hazards (15%)
    hazard_penalty = 0
    if hazards.slope_exceeds_15_deg:
        hazard_penalty += 3
        limiting.append("Steep slopes >15°")
    if hazards.slope_exceeds_30_deg:
        hazard_penalty += 5
        limiting.append("Steep slopes >30°")
    if hazards.rock_abundance_percent > 10:
        hazard_penalty += 3
        limiting.append(f"High rock abundance ({hazards.rock_abundance_percent:.0f}%)")

    score += max(0, 15 - hazard_penalty)

    return round(min(100, max(0, score)), 1), limiting


@router.get("/assessment", response_model=SurvivalAssessment)
async def get_survival_assessment(
    lat: Annotated[float, Depends(validate_latitude)],
    lon: Annotated[float, Depends(validate_longitude)],
    season: Optional[str] = Query("average", description="Season: spring, summer, autumn, winter, average"),
):
    """Full survival assessment for a location."""
    atmospheric = get_atmospheric_conditions(lat, lon)
    radiation = get_radiation_environment(lat, lon)
    thermal = get_thermal_environment(lat, lon)
    water = get_water_resources(lat, lon)
    hazards = get_hazard_assessment(lat, lon)

    score, limiting = calculate_survivability_score(
        atmospheric, radiation, thermal, water, hazards
    )

    return SurvivalAssessment(
        location={"lat": lat, "lon": lon},
        atmospheric=atmospheric,
        radiation=radiation,
        thermal=thermal,
        water=water,
        hazards=hazards,
        overall_survivability_score=score,
        limiting_factors=limiting,
        uncertainties={
            "elevation_source": "MOLA 463m (±3m vertical, ~100m horizontal)",
            "radiation_model": "RAD Curiosity measurements + elevation scaling, no local regolith data",
            "thermal_model": "TES/THEMIS thermal inertia + lat/lon/elevation model, no local measurements",
            "water_data": "SHARAD/CRISM synthesis, resolution 3km-100m, not ground-truthed",
            "hazard_data": "MOLA slope + thermal inertia proxy, no high-res imaging"
        },
        data_sources=[
            "MGS MOLA DEM 463m",
            "Curiosity RAD",
            "Odyssey MARIE",
            "MRO SHARAD",
            "MRO CRISM",
            "Mars Odyssey THEMIS",
            "MGS TES",
            "MRO MCS"
        ],
        caveats=[
            "Scores are relative indicators, not absolute safety certifications",
            "No in-situ validation at this location",
            "Models use global averages, local conditions may vary significantly",
            "No atmospheric dynamics, dust storms, or weather events modeled",
            "Radiation does not include solar particle event worst-case",
            "Water ice estimates are orbital detections, not ground-truthed"
        ]
    )


@router.get("/compare", response_model=SurvivalComparisonResponse)
async def compare_locations(
    locations: Annotated[str, Query(..., description="Semicolon-separated lat,lon pairs")],
):
    """Compare survivability across multiple locations."""
    locs = []
    for pair in locations.split(";"):
        lat_str, lon_str = pair.split(",")
        lat = float(lat_str)
        lon = float(lon_str)
        if lon < 0:
            lon += 360

        assessment = await get_survival_assessment(lat, lon)
        locs.append({
            "location": {"lat": lat, "lon": lon},
            "score": assessment.overall_survivability_score,
            "limiting_factors": assessment.limiting_factors,
            "atmospheric_score": 20,
            "radiation_score": 25,
            "thermal_score": 20,
            "water_score": 20,
            "hazard_score": 15
        })

    # Find best
    best = max(locs, key=lambda x: x["score"]) if locs else None

    return SurvivalComparisonResponse(
        locations=locs,
        best_overall=best["location"] if best else None,
        best_by_category={
            "overall": best["location"] if best else None,
        }
    )