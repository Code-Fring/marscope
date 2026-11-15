"""
Pydantic schemas for mission planning endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class SlopeStats(BaseModel):
    mean_deg: float
    max_deg: float
    pct_under_5: float
    pct_under_15: float
    pct_under_30: float


class GeologySummary(BaseModel):
    primary_unit: str
    unit_age: Optional[str] = None
    mineralogy: List[str] = Field(default_factory=list)
    stratigraphic_context: Optional[str] = None
    reference: Optional[str] = None


class WaterAccess(BaseModel):
    distance_to_ice_km: Optional[float] = None
    ice_type: Optional[str] = None  # surface, subsurface, hydrated
    extraction_difficulty: Optional[str] = None  # easy, moderate, hard
    estimated_yield_kg_per_sol: Optional[float] = None


class SolarPotential(BaseModel):
    annual_insolation_kwh_m2: float
    worst_month_insolation_kwh_m2: float
    daylight_hours_winter: float
    daylight_hours_summer: float
    panel_efficiency_at_temp: float = Field(default=0.25)
    dust_degradation_per_sol: float = Field(default=0.001)


class CommWindow(BaseModel):
    earth_visible_hours_per_sol: float
    relay_orbiter_passes_per_sol: int
    max_data_rate_mbps: float
    blackout_periods_per_year: int


class Hazard(BaseModel):
    type: str  # slope, rock, crater, dust_storm, radiation, thermal
    severity: str  # low, moderate, high, critical
    description: str
    mitigation: Optional[str] = None


class LandingSiteCandidate(BaseModel):
    id: str
    name: str
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    elevation_m: float
    slope_stats: SlopeStats
    geology: GeologySummary
    water_access: WaterAccess
    solar_potential: SolarPotential
    communications: CommWindow
    hazards: List[Hazard] = Field(default_factory=list)
    score: float = Field(..., ge=0, le=100)
    score_breakdown: Dict[str, float] = Field(default_factory=dict)
    assumptions: List[str] = Field(default_factory=list)
    uncertainties: Dict[str, Any] = Field(default_factory=dict)
    data_sources: List[str] = Field(default_factory=list)


class TraverseWaypoint(BaseModel):
    id: str
    name: str
    lat: float
    lon: float
    elevation_m: float
    distance_from_previous_km: float
    science_objective: Optional[str] = None
    estimated_drive_time_sols: Optional[int] = None
    power_budget_wh: Optional[float] = None
    science_priority: int = Field(default=1, ge=1, le=5)


class ScienceObjective(BaseModel):
    id: str
    name: str
    description: str
    priority: int = Field(ge=1, le=5)
    target_location: Optional[Dict[str, float]] = None
    instruments_required: List[str] = Field(default_factory=list)
    estimated_time_sols: int = 1


class RiskAssessment(BaseModel):
    overall_risk: str = Field(..., pattern="^(low|moderate|high|critical)$")
    risk_factors: List[Dict[str, Any]] = Field(default_factory=list)
    mitigation_strategies: List[str] = Field(default_factory=list)
    contingency_plans: List[str] = Field(default_factory=list)


class ResourceBudget(BaseModel):
    total_mass_kg: float
    power_budget_wh_per_sol: float
    data_volume_gb: float
    consumables_kg: float
    margin_pct: float = Field(default=0.3)


class Timeline(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    total_sols: int
    milestones: List[Dict[str, Any]] = Field(default_factory=list)


class MissionPlan(BaseModel):
    id: str
    name: str
    landing_site: LandingSiteCandidate
    traverse_waypoints: List[TraverseWaypoint] = Field(default_factory=list)
    science_objectives: List[ScienceObjective] = Field(default_factory=list)
    risk_assessment: RiskAssessment
    resource_budget: ResourceBudget
    timeline: Timeline
    created_at: datetime = Field(default_factory=datetime.utcnow)
    assumptions: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)


class SiteAnalysisRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    radius_km: float = Field(default=50, ge=1, le=500)
    include_subsurface: bool = True


class MissionPlanRequest(BaseModel):
    landing_site: LandingSiteCandidate
    science_objectives: List[ScienceObjective] = Field(default_factory=list)
    max_sols: int = Field(default=500, ge=10, le=2000)
    crew_size: int = Field(default=4, ge=1, le=10)
    risk_tolerance: str = Field(default="moderate", pattern="^(low|moderate|high)$")
