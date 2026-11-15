/**
 * API client for backend services
 * All endpoints are optional - graceful degradation if backend unavailable
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface ElevationResponse {
  elevation: number; // metres
  source: string;
  resolution: string;
  accuracy: string;
  method: 'direct' | 'interpolated';
}

export interface ProfilePoint {
  lat: number;
  lon: number;
  elev: number;
  dist: number; // metres from start
}

export interface ProfileResponse {
  points: ProfilePoint[];
  totalDistance: number;
  cumulativeAscent: number;
  cumulativeDescent: number;
  maxSlope: number;
  minElevation: number;
  maxElevation: number;
  source: string;
  resolution: string;
  method: string;
}

export interface SlopeResponse {
  slope: number; // degrees
  aspect: number; // degrees from north
  source: string;
  resolution: string;
  method: string;
}

export interface RouteResponse {
  waypoints: Array<{ lat: number; lon: number }>;
  totalDistance: number;
  cumulativeAscent: number;
  cumulativeDescent: number;
  maxSlope: number;
  segments: Array<{
    start: { lat: number; lon: number };
    end: { lat: number; lon: number };
    distance: number;
    ascent: number;
    descent: number;
    maxSlope: number;
  }>;
  source: string;
  resolution: string;
  caveat: string;
}

export interface HealthResponse {
  status: string;
  mola_cog_loaded: boolean;
}

// Climate schemas
export interface WeatherObservation {
  timestamp: string;
  lat: number;
  lon: number;
  temperature_k: number;
  pressure_pa: number;
  wind_speed_ms?: number;
  wind_direction_deg?: number;
  dust_opacity?: number;
  relative_humidity?: number;
  source: string;
  instrument: string;
  confidence?: string;
}

export interface ClimateNormals {
  lat: number;
  lon: number;
  monthly_mean_temp_k: number[];
  monthly_min_temp_k: number[];
  monthly_max_temp_k: number[];
  monthly_mean_pressure_pa: number[];
  monthly_dust_storm_probability: number[];
  monthly_solar_illumination_hours: number[];
  annual_mean_temp_k: number;
  annual_temp_range_k: number;
  annual_mean_pressure_pa: number;
  data_period: string;
  source: string;
  reference?: string;
}

export interface DustStormEvent {
  start_date: string;
  end_date: string;
  lat_min: number;
  lat_max: number;
  lon_min: number;
  lon_max: number;
  peak_opacity: number;
  classification: string;
  source: string;
  reference?: string;
}

export interface SolarIllumination {
  lat: number;
  lon: number;
  date: string;
  sunrise?: string;
  sunset?: string;
  daylight_hours: number;
  solar_zenith_angle_noon: number;
  solar_azimuth_noon: number;
  max_elevation_angle: number;
  polar_day: boolean;
  polar_night: boolean;
}

export interface WeatherResponse {
  observations: WeatherObservation[];
  count: number;
  lat: number;
  lon: number;
  start_date: string;
  end_date: string;
  sources: string[];
  caveat: string;
}

// Survival schemas
export interface AtmosphericConditions {
  pressure_pa: number;
  composition: Record<string, number>;
  density_kg_m3: number;
  temperature_k: number;
  scale_height_km: number;
  seasonal_variation: Record<string, number>;
}

export interface RadiationEnvironment {
  galactic_cosmic_ray_sievert_per_day: number;
  solar_particle_event_probability: number;
  surface_dose_rate_mgy_per_day: number;
  subsurface_dose_rate_mgy_per_day: Record<string, number>;
  shielding_recommendations: string[];
  acute_risk_threshold_sv: number;
  chronic_risk_threshold_sv_per_year: number;
}

export interface ThermalEnvironment {
  surface_temp_min_k: number;
  surface_temp_max_k: number;
  surface_temp_mean_k: number;
  diurnal_range_k: number;
  seasonal_range_k: number;
  regolith_thermal_inertia: number;
  subsurface_temp_gradient_k_per_m: number;
}

export interface WaterResourceFeature {
  name: string;
  lat: number;
  lon: number;
  type: string;
  confidence: number;
  estimated_volume_km3?: number;
  depth_m?: number;
  reference?: string;
}

export interface WaterResources {
  surface_ice_locations: WaterResourceFeature[];
  subsurface_ice_probability: Record<string, any>;
  hydrated_minerals: WaterResourceFeature[];
  recurring_slope_lineae: WaterResourceFeature[];
  extraction_feasibility: Record<string, any>;
  total_accessible_ice_km3?: number;
}

export interface HazardAssessment {
  slope_exceeds_15_deg: boolean;
  slope_exceeds_30_deg: boolean;
  rock_abundance_percent: number;
  crater_density?: number;
  dust_storm_frequency?: number;
  radiation_exceeds_chronic: boolean;
  thermal_stress_risk: string;
  dust_devil_risk: string;
}

export interface SurvivalAssessment {
  location: { lat: number; lon: number };
  atmospheric: AtmosphericConditions;
  radiation: RadiationEnvironment;
  thermal: ThermalEnvironment;
  water: WaterResources;
  hazards: HazardAssessment;
  overall_survivability_score: number;
  limiting_factors: string[];
  uncertainties: Record<string, any>;
  data_sources: string[];
  caveats: string[];
}

export interface SurvivalCategoryResponse {
  category: string;
  score: number;
  metrics: Record<string, any>;
  limiting_factors: string[];
  data_quality: string;
  caveats: string[];
}

export interface SurvivalComparisonResponse {
  locations: Array<{
    location: { lat: number; lon: number };
    score: number;
    limiting_factors: string[];
    atmospheric_score: number;
    radiation_score: number;
    thermal_score: number;
    water_score: number;
    hazard_score: number;
  }>;
  best_overall?: string;
  best_by_category: Record<string, string>;
}

// Mission schemas
export interface SlopeStats {
  mean_deg: number;
  max_deg: number;
  pct_under_5: number;
  pct_under_15: number;
  pct_under_30: number;
}

export interface GeologySummary {
  primary_unit: string;
  unit_age?: string;
  mineralogy: string[];
  stratigraphic_context?: string;
  reference?: string;
}

export interface WaterAccess {
  distance_to_ice_km?: number;
  ice_type?: string;
  extraction_difficulty?: string;
  estimated_yield_kg_per_sol?: number;
}

export interface SolarPotential {
  annual_insolation_kwh_m2: number;
  worst_month_insolation_kwh_m2: number;
  daylight_hours_winter: number;
  daylight_hours_summer: number;
  panel_efficiency_at_temp: number;
  dust_degradation_per_sol: number;
}

export interface CommWindow {
  earth_visible_hours_per_sol: number;
  relay_orbiter_passes_per_sol: number;
  max_data_rate_mbps: number;
  blackout_periods_per_year: number;
}

export interface Hazard {
  type: string;
  severity: string;
  description: string;
  mitigation?: string;
}

export interface LandingSiteCandidate {
  id: string;
  name: string;
  lat: number;
  lon: number;
  elevation_m: number;
  slope_stats: SlopeStats;
  geology: GeologySummary;
  water_access: WaterAccess;
  solar_potential: SolarPotential;
  communications: CommWindow;
  hazards: Hazard[];
  score: number;
  score_breakdown: Record<string, number>;
  assumptions: string[];
  uncertainties: Record<string, any>;
  data_sources: string[];
}

export interface TraverseWaypoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  elevation_m: number;
  distance_from_previous_km: number;
  science_objective?: string;
  estimated_drive_time_sols?: number;
  power_budget_wh?: number;
  science_priority: number;
}

export interface ScienceObjective {
  id: string;
  name: string;
  description: string;
  priority: number;
  target_location?: { lat: number; lon: number };
  instruments_required: string[];
  estimated_time_sols: number;
}

export interface RiskAssessment {
  overall_risk: string;
  risk_factors: Array<Record<string, any>>;
  mitigation_strategies: string[];
  contingency_plans: string[];
}

export interface ResourceBudget {
  total_mass_kg: number;
  power_budget_wh_per_sol: number;
  data_volume_gb: number;
  consumables_kg: number;
  margin_pct: number;
}

export interface Timeline {
  start_date?: string;
  end_date?: string;
  total_sols: number;
  milestones: Array<Record<string, any>>;
}

export interface MissionPlan {
  id: string;
  name: string;
  landing_site: LandingSiteCandidate;
  traverse_waypoints: TraverseWaypoint[];
  science_objectives: ScienceObjective[];
  risk_assessment: RiskAssessment;
  resource_budget: ResourceBudget;
  timeline: Timeline;
  created_at: string;
  assumptions: string[];
  limitations: string[];
}

export interface SiteAnalysisRequest {
  lat: number;
  lon: number;
  radius_km: number;
  include_subsurface: boolean;
}

export interface MissionPlanRequest {
  landing_site: LandingSiteCandidate;
  science_objectives: ScienceObjective[];
  max_sols: number;
  crew_size: number;
  risk_tolerance: string;
}

// Library schemas
export interface ResearchResource {
  id: string;
  title: string;
  authors: string[];
  institution?: string;
  publication_date?: string;
  category: string;
  abstract?: string;
  source: string;
  doi?: string;
  dataset_id?: string;
  tags: string[];
  url?: string;
  access_type: string;
  citation_count?: number;
}

export interface LibrarySearchResponse {
  resources: ResearchResource[];
  total: number;
  page: number;
  page_size: number;
  query: string;
  categories: string[];
  sources: string[];
}

export interface ResourceDetailResponse {
  resource: ResearchResource;
  related: ResearchResource[];
  citations: ResearchResource[];
  references: ResearchResource[];
}

export interface LibraryStatsResponse {
  total_resources: number;
  by_category: Record<string, number>;
  by_source: Record<string, number>;
  by_year: Record<string, number>;
  top_tags: Array<Record<string, any>>;
}

// Dataset schemas
export interface DatasetMetadata {
  id: string;
  name: string;
  description: string;
  source: string;
  mission: string;
  instrument: string;
  resolution: string;
  coverage: string;
  format: string;
  projection: string;
  coordinate_system: string;
  vertical_datum: string;
  license: string;
  access_url: string;
  citation: string;
  last_updated: string;
  spatial_resolution_m: number;
  temporal_coverage: string;
  uncertainties: Record<string, any>;
  is_integrated: boolean;
  access_method: string;
  tags: string[];
}

export interface DatasetListResponse {
  datasets: DatasetMetadata[];
  total: number;
  integrated_count: number;
  investigated_count: number;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new ApiError(response.status, `API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(408, 'Request timeout');
    }
    throw new ApiError(0, `Network error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

/**
 * Get elevation at a single point
 */
export async function getElevation(lat: number, lon: number): Promise<ElevationResponse | null> {
  try {
    const url = `${API_BASE}/elevation?lat=${lat}&lon=${lon}`;
    return await fetchJson<ElevationResponse>(url);
  } catch (error) {
    console.warn('Elevation query failed:', error);
    return null;
  }
}

/**
 * Get elevation profile along a line
 * coords: "lat1,lon1;lat2,lon2;..." or "lat1,lon1,lat2,lon2,..."
 */
export async function getProfile(
  coords: string,
  samples: number = 100
): Promise<ProfileResponse | null> {
  try {
    const url = `${API_BASE}/profile?coords=${encodeURIComponent(coords)}&samples=${samples}`;
    return await fetchJson<ProfileResponse>(url);
  } catch (error) {
    console.warn('Profile query failed:', error);
    return null;
  }
}

/**
 * Get slope at a point
 */
export async function getSlope(lat: number, lon: number): Promise<SlopeResponse | null> {
  try {
    const url = `${API_BASE}/elevation/slope?lat=${lat}&lon=${lon}`;
    return await fetchJson<SlopeResponse>(url);
  } catch (error) {
    console.warn('Slope query failed:', error);
    return null;
  }
}

/**
 * Get route metrics for waypoints
 */
export async function getRoute(
  waypoints: Array<{ lat: number; lon: number }>,
  samplesPerSegment: number = 50
): Promise<RouteResponse | null> {
  try {
    const coords = waypoints.map(w => `${w.lat},${w.lon}`).join(';');
    const url = `${API_BASE}/elevation/route?coords=${encodeURIComponent(coords)}&samples=${samplesPerSegment}`;
    return await fetchJson<RouteResponse>(url);
  } catch (error) {
    console.warn('Route query failed:', error);
    return null;
  }
}

/**
 * Health check
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Format API error for display
 */
export function formatApiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return 'Backend unavailable - using fallback';
    if (error.status === 408) return 'Request timeout';
    if (error.status >= 500) return 'Server error';
    return `Error ${error.status}: ${error.message}`;
  }
  if (error instanceof Error) return error.message;
  return 'Unknown error';
}

// Climate API
export async function getWeather(
  lat: number,
  lon: number,
  start?: string,
  end?: string,
  source?: string
): Promise<WeatherResponse | null> {
  try {
    const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    if (source) params.append('source', source);
    const url = `${API_BASE}/climate/weather?${params.toString()}`;
    return await fetchJson<WeatherResponse>(url);
  } catch (error) {
    console.warn('Weather query failed:', error);
    return null;
  }
}

export async function getNormals(lat: number, lon: number): Promise<ClimateNormals | null> {
  try {
    const url = `${API_BASE}/climate/normals?lat=${lat}&lon=${lon}`;
    return await fetchJson<ClimateNormals>(url);
  } catch (error) {
    console.warn('Normals query failed:', error);
    return null;
  }
}

export async function getDustStorms(
  lat: number,
  lon: number,
  season?: string
): Promise<any[] | null> {
  try {
    const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
    if (season) params.append('season', season);
    const url = `${API_BASE}/climate/dust-storms?${params.toString()}`;
    return await fetchJson<any[]>(url);
  } catch (error) {
    console.warn('Dust storms query failed:', error);
    return null;
  }
}

export async function getSolarIllumination(
  lat: number,
  lon: number,
  date?: string
): Promise<SolarIllumination | null> {
  try {
    const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
    if (date) params.append('date', date);
    const url = `${API_BASE}/climate/solar-illumination?${params.toString()}`;
    return await fetchJson<SolarIllumination>(url);
  } catch (error) {
    console.warn('Solar illumination query failed:', error);
    return null;
  }
}

// Survival API
export async function getSurvivalAssessment(
  lat: number,
  lon: number,
  season?: string
): Promise<SurvivalAssessment | null> {
  try {
    const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
    if (season) params.append('season', season);
    const url = `${API_BASE}/survival/assessment?${params.toString()}`;
    return await fetchJson<SurvivalAssessment>(url);
  } catch (error) {
    console.warn('Survival assessment query failed:', error);
    return null;
  }
}

export async function compareLocations(locations: string): Promise<SurvivalComparisonResponse | null> {
  try {
    const url = `${API_BASE}/survival/compare?locations=${encodeURIComponent(locations)}`;
    return await fetchJson<SurvivalComparisonResponse>(url);
  } catch (error) {
    console.warn('Survival comparison query failed:', error);
    return null;
  }
}

// Mission API
export async function analyzeSite(request: { lat: number; lon: number; radius_km?: number }): Promise<any | null> {
  try {
    const response = await fetch(`${API_BASE}/mission/analyze-site`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('Site analysis failed:', error);
    return null;
  }
}

export async function getCandidates(params: {
  min_lat?: number;
  max_lat?: number;
  min_lon?: number;
  max_lon?: number;
  min_score?: number;
  limit?: number;
}): Promise<any[] | null> {
  try {
    const paramsObj = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) paramsObj.append(k, String(v));
    });
    const url = `${API_BASE}/mission/candidates?${paramsObj.toString()}`;
    return await fetchJson<any[]>(url);
  } catch (error) {
    console.warn('Candidates query failed:', error);
    return null;
  }
}

export async function createMissionPlan(request: any): Promise<any | null> {
  try {
    const response = await fetch(`${API_BASE}/mission/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('Mission plan creation failed:', error);
    return null;
  }
}

// Library API
export async function searchLibrary(
  query: string,
  category?: string,
  source?: string,
  page: number = 1,
  pageSize: number = 20
): Promise<LibrarySearchResponse | null> {
  try {
    const params = new URLSearchParams({ q: query });
    if (category) params.append('category', category);
    if (source) params.append('source', source);
    params.append('page', String(page));
    params.append('page_size', String(pageSize));
    const url = `${API_BASE}/library/search?${params.toString()}`;
    return await fetchJson<LibrarySearchResponse>(url);
  } catch (error) {
    console.warn('Library search failed:', error);
    return null;
  }
}

export async function getResource(resourceId: string): Promise<ResourceDetailResponse | null> {
  try {
    const url = `${API_BASE}/library/${encodeURIComponent(resourceId)}`;
    return await fetchJson<ResourceDetailResponse>(url);
  } catch (error) {
    console.warn('Resource fetch failed:', error);
    return null;
  }
}

export async function getLibraryStats(): Promise<LibraryStatsResponse | null> {
  try {
    const url = `${API_BASE}/library/stats`;
    return await fetchJson<LibraryStatsResponse>(url);
  } catch (error) {
    console.warn('Library stats failed:', error);
    return null;
  }
}

export async function getCategories(): Promise<string[] | null> {
  try {
    const url = `${API_BASE}/library/categories`;
    return await fetchJson<string[]>(url);
  } catch (error) {
    console.warn('Categories fetch failed:', error);
    return null;
  }
}

export async function getSources(): Promise<string[] | null> {
  try {
    const url = `${API_BASE}/library/sources`;
    return await fetchJson<string[]>(url);
  } catch (error) {
    console.warn('Sources fetch failed:', error);
    return null;
  }
}

// Datasets API
export async function getDatasets(params: {
  integrated_only?: boolean;
  source?: string;
  mission?: string;
  instrument?: string;
  tags?: string;
  limit?: number;
  offset?: number;
}): Promise<any | null> {
  try {
    const paramsObj = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) paramsObj.append(k, String(v));
    });
    const url = `${API_BASE}/datasets?${paramsObj.toString()}`;
    return await fetchJson<any>(url);
  } catch (error) {
    console.warn('Datasets query failed:', error);
    return null;
  }
}

export async function getDataset(datasetId: string): Promise<any | null> {
  try {
    const url = `${API_BASE}/datasets/${encodeURIComponent(datasetId)}`;
    return await fetchJson<any>(url);
  } catch (error) {
    console.warn('Dataset fetch failed:', error);
    return null;
  }
}

export async function getIntegratedDatasets(): Promise<any[] | null> {
  try {
    const url = `${API_BASE}/datasets/integrated`;
    return await fetchJson<any[]>(url);
  } catch (error) {
    console.warn('Integrated datasets query failed:', error);
    return null;
  }
}

export async function getDatasetsBySource(source: string): Promise<any[] | null> {
  try {
    const url = `${API_BASE}/datasets/by-source/${encodeURIComponent(source)}`;
    return await fetchJson<any[]>(url);
  } catch (error) {
    console.warn('Datasets by source query failed:', error);
    return null;
  }
}

export async function getDatasetsByMission(mission: string): Promise<any[] | null> {
  try {
    const url = `${API_BASE}/datasets/by-mission/${encodeURIComponent(mission)}`;
    return await fetchJson<any[]>(url);
  } catch (error) {
    console.warn('Datasets by mission query failed:', error);
    return null;
  }
}

/**
 * Format API error for display
 */
export function formatApiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return 'Backend unavailable - using fallback';
    if (error.status === 408) return 'Request timeout';
    if (error.status >= 500) return 'Server error';
    return `Error ${error.status}: ${error.message}`;
  }
  if (error instanceof Error) return error.message;
  return 'Unknown error';
}