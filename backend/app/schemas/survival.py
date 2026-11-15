"""
Pydantic schemas for survival assessment endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class AtmosphericConditions(BaseModel):
    pressure_pa: float = Field(
        ..., description="Surface atmospheric pressure in Pascals"
    )
    composition: Dict[str, float] = Field(
        default={"CO2": 0.953, "N2": 0.027, "Ar": 0.016, "O2": 0.0013, "CO": 0.0008},
        description="Atmospheric composition by volume fraction",
    )
    density_kg_m3: float = Field(..., description="Atmospheric density in kg/m³")
    temperature_k: float = Field(..., description="Surface temperature in Kelvin")
    scale_height_km: float = Field(
        default=11.1, description="Atmospheric scale height in km"
    )
    seasonal_variation: Dict[str, float] = Field(
        default_factory=dict,
        description="Seasonal pressure/temperature variation factors",
    )


class RadiationEnvironment(BaseModel):
    galactic_cosmic_ray_sievert_per_day: float = Field(
        ..., description="GCR dose rate on surface (Sv/day)"
    )
    solar_particle_event_probability: float = Field(
        ..., description="Probability of SPE per sol (0-1)"
    )
    surface_dose_rate_mgy_per_day: float = Field(
        ..., description="Total surface dose rate (mGy/day)"
    )
    subsurface_dose_rate_mgy_per_day: Dict[str, float] = Field(
        default_factory=dict, description="Dose rate at depth (m): dose rate (mGy/day)"
    )
    shielding_recommendations: List[str] = Field(
        default_factory=list,
        description="Recommended shielding thicknesses and materials",
    )
    acute_risk_threshold_sv: float = Field(
        default=0.25, description="Acute radiation syndrome threshold (Sv)"
    )
    chronic_risk_threshold_sv_per_year: float = Field(
        default=0.05, description="Chronic risk threshold (Sv/year)"
    )


class ThermalEnvironment(BaseModel):
    surface_temp_min_k: float = Field(
        ..., description="Minimum surface temperature (K)"
    )
    surface_temp_max_k: float = Field(
        ..., description="Maximum surface temperature (K)"
    )
    surface_temp_mean_k: float = Field(..., description="Mean surface temperature (K)")
    diurnal_range_k: float = Field(..., description="Diurnal temperature range (K)")
    seasonal_range_k: float = Field(..., description="Seasonal temperature range (K)")
    regolith_thermal_inertia: float = Field(
        ..., description="Thermal inertia (J·m⁻²·K⁻¹·s⁻¹/²)"
    )
    subsurface_temp_gradient_k_per_m: float = Field(
        default=1.5, description="Subsurface thermal gradient (K/m)"
    )


class WaterResourceFeature(BaseModel):
    name: str
    lat: float
    lon: float
    type: str = Field(
        ...,
        description="Type: surface_ice, subsurface_ice, hydrated_mineral, recurring_slope_lineae",
    )
    confidence: float = Field(
        ..., ge=0, le=1, description="Confidence in detection (0-1)"
    )
    estimated_volume_km3: Optional[float] = None
    depth_m: Optional[float] = None
    reference: Optional[str] = None


class WaterResources(BaseModel):
    surface_ice_locations: List[WaterResourceFeature] = Field(default_factory=list)
    subsurface_ice_probability: Dict[str, Any] = Field(
        default_factory=dict, description="Raster metadata for ice probability maps"
    )
    hydrated_minerals: List[WaterResourceFeature] = Field(default_factory=list)
    recurring_slope_lineae: List[WaterResourceFeature] = Field(default_factory=list)
    extraction_feasibility: Dict[str, Any] = Field(
        default_factory=dict, description="Energy, equipment, yield estimates"
    )
    total_accessible_ice_km3: Optional[float] = None


class HazardAssessment(BaseModel):
    slope_exceeds_15_deg: bool = False
    slope_exceeds_30_deg: bool = False
    rock_abundance_percent: float = Field(..., ge=0, le=100)
    crater_density: Optional[float] = None
    dust_storm_frequency: Optional[float] = None
    radiation_exceeds_chronic: bool = False
    thermal_stress_risk: str = Field(
        default="moderate", description="low, moderate, high, extreme"
    )
    dust_devil_risk: str = Field(default="moderate")


class SurvivalAssessment(BaseModel):
    location: Dict[str, float] = Field(..., description="{lat, lon}")
    atmospheric: AtmosphericConditions
    radiation: RadiationEnvironment
    thermal: ThermalEnvironment
    water: WaterResources
    hazards: HazardAssessment
    overall_survivability_score: float = Field(
        ..., ge=0, le=100, description="0-100 composite score"
    )
    limiting_factors: List[str] = Field(default_factory=list)
    uncertainties: Dict[str, Any] = Field(default_factory=dict)
    data_sources: List[str] = Field(default_factory=list)
    caveats: List[str] = Field(default_factory=list)


class SurvivalCategoryResponse(BaseModel):
    category: str
    score: float = Field(..., ge=0, le=100)
    metrics: Dict[str, Any]
    limiting_factors: List[str]
    data_quality: str
    caveats: List[str]


class SurvivalComparisonResponse(BaseModel):
    locations: List[Dict[str, Any]]
    best_overall: Optional[str] = None
    best_by_category: Dict[str, str] = Field(default_factory=dict)
