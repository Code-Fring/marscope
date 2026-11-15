# MARSCOPE Comprehensive Expansion — Implementation Plan

## Overview

Transform MARSCOPE into a comprehensive planetary science platform by integrating NASA/ESA/USGS datasets and adding survival assessment, climate, mission planning, and research library modules.

**Timeline**: 8-12 weeks (phased)
**Approach**: Incremental, test-driven, modular
**Priority**: Scientific accuracy > feature completeness > visual polish

---

## Phase 0: Foundation & Architecture (Week 1)

### 0.1 Refactor Backend Structure
```
backend/
├── app/
│   ├── main.py                 # App factory, lifespan, middleware
│   ├── config.py               # Settings via pydantic-settings
│   ├── database.py             # Async DB (if needed for caching/metadata)
│   ├── dependencies.py         # Shared FastAPI dependencies
│   ├── routers/
│   │   ├── elevation.py        # Existing + new endpoints
│   │   ├── climate.py          # NEW: Weather/climate endpoints
│   │   ├── survival.py         # NEW: Survival assessment endpoints
│   │   ├── mission.py          # NEW: Mission planning endpoints
│   │   ├── library.py          # NEW: Research library endpoints
│   │   └── datasets.py         # NEW: Dataset catalog/metadata
│   ├── services/
│   │   ├── elevation_service.py
│   │   ├── climate_service.py
│   │   ├── survival_service.py
│   │   ├── mission_service.py
│   │   ├── library_service.py
│   │   └── dataset_service.py
│   ├── schemas/
│   │   ├── elevation.py
│   │   ├── climate.py
│   │   ├── survival.py
│   │   ├── mission.py
│   │   └── library.py
│   └── utils/
│       ├── mars_math.py
│       ├── data_fetch.py
│       └── metadata.py
├── tests/
├── requirements.txt
└── Dockerfile
```

### 0.2 Configuration & Settings
- Use `pydantic-settings` for environment-based config
- Add `DATA_SOURCES` config for dataset catalog
- Add rate-limit configs for external APIs
- Add cache TTL configs

### 0.3 Testing Infrastructure
- Add `pytest-asyncio`, `httpx`, `pytest-cov`
- Create `tests/conftest.py` with fixtures
- Set up CI pipeline (GitHub Actions)

---

## Phase 1: Core Dataset Expansion (Weeks 2-3)

### 1.1 Dataset Catalog & Metadata Service
Create a unified dataset registry with metadata:
```python
# app/schemas/datasets.py
class DatasetMetadata(BaseModel):
    id: str
    name: str
    description: str
    source: str           # NASA, ESA, USGS, etc.
    mission: str          # MGS, MRO, Odyssey, etc.
    instrument: str       # MOLA, HiRISE, CTX, THEMIS, etc.
    resolution: str       # "463 m/pixel"
    coverage: str         # "Global", "Regional", coordinates
    format: str           # "GeoTIFF", "NetCDF", "CSV", etc.
    projection: str       # "Simple Cylindrical", etc.
    coordinate_system: str # "Planetocentric, +East 0-360"
    vertical_datum: str   # "Areoid (GMM-2B)"
    license: str          # "CC0", "Public Domain", etc.
    access_url: str
    citation: str
    last_updated: datetime
    spatial_resolution_m: float
    temporal_coverage: str
    uncertainties: dict
    is_integrated: bool
    access_method: str    # "COG", "WMS", "WMTS", "API", "download"
```

### 1.2 MOLA DEM — Full Integration (Already Started)
- [x] COG conversion script
- [x] Point elevation endpoint
- [x] Profile endpoint
- [x] Slope endpoint (Horn's method)
- [ ] Hillshade tile rendering (rio-tiler expression)
- [ ] Colorized elevation tiles (rio-tiler colormap)
- [ ] Slope tiles (pre-computed or on-demand)

### 1.3 HRSC DEM (ESA/DLR) — Higher Resolution
- Source: ESA Mars Express HRSC
- Resolution: ~50-100 m/pixel (blended with MOLA)
- Format: GeoTIFF, available via ESA PSA
- Integration: COG conversion, tile service

### 1.4 CTX Mosaic (MRO)
- Source: NASA PDS / USGS Astrogeology
- Resolution: 5-6 m/pixel
- Coverage: >99% Mars
- Format: Large GeoTIFFs
- Strategy: On-demand tile generation via rio-tiler from COGs

### 1.5 HiRISE DTMs & Orthoimages
- Source: HiRISE PDS / UArizona
- Resolution: 0.25-0.5 m/pixel (targeted)
- Format: JP2, GeoTIFF
- Strategy: On-demand via WMS/WMTS or COG subsetting

### 1.6 THEMIS Thermal Inertia & IR
- Source: ASU / NASA PDS
- Day IR: 100 m/pixel global
- Night IR: 100 m/pixel global
- Thermal Inertia: 100 m/pixel
- Format: GeoTIFF/NetCDF

### 1.7 CRISM Mineral Maps
- Source: JHU/APL / NASA PDS
- Resolution: 18 m/pixel (targeted)
- Products: Summary parameters (BD1900, etc.), mineral indices
- Format: GeoTIFF

### 1.8 USGS Geologic Maps
- Source: USGS Astrogeology
- Formats: GeoPackage, Shapefile, GeoTIFF
- Scales: 1:5M to 1:24K
- Integration: Vector tile service (tippecanoe + rio-tiler)

### 1.8 Climate & Weather Data
- **MCS (MRO)**: Atmospheric profiles, temperature, dust
- **MARCI (MRO)**: Daily global weather maps
- **REMS (Curiosity)**: Surface weather station data
- **MEDA (Perseverance)**: Surface weather, radiation, dust
- **TES (MGS)**: Thermal emission spectrometer data
- Format: NetCDF, CSV, PDS

### 1.9 Radiation Data
- **RAD (Curiosity)**: Surface radiation measurements
- **MARIE (Odyssey)**: Orbital radiation environment
- **Models**: GEANT4, Planetocosmics outputs
- Format: CSV, NetCDF

---

## Phase 2: Survival Assessment Module (Week 4)

### 2.1 Schema Design
```python
# app/schemas/survival.py
class AtmosphericConditions(BaseModel):
    pressure_pa: float
    composition: dict[str, float]  # CO2: 0.95, N2: 0.027, Ar: 0.016
    density_kg_m3: float
    temperature_k: float
    seasonal_variation: dict

class RadiationEnvironment(BaseModel):
    galactic_cosmic_ray_sievert_per_day: float
    solar_particle_event_probability: float
    surface_dose_rate_mgy_per_day: float
    shielding_recommendations: list[str]

class ThermalEnvironment(BaseModel):
    surface_temp_min_k: float
    surface_temp_max_k: float
    diurnal_range_k: float
    seasonal_range_k: float
    regolith_thermal_inertia: float

class WaterResources(BaseModel):
    surface_ice_locations: list[GeoFeature]
    subsurface_ice_probability: RasterLayer
    hydrated_minerals: list[GeoFeature]
    extraction_feasibility: dict

class SurvivalAssessment(BaseModel):
    location: LatLon
    atmospheric: AtmosphericConditions
    radiation: RadiationEnvironment
    thermal: ThermalEnvironment
    water: WaterResources
    overall_score: float  # 0-100
    limiting_factors: list[str]
    uncertainties: dict
```

### 2.2 Endpoints
- `GET /survival/assessment?lat={}&lon={}` — Full assessment
- `GET /survival/atmospheric?lat={}&lon={}`
- `GET /survival/radiation?lat={}&lon={}`
- `GET /survival/thermal?lat={}&lon={}`
- `GET /survival/water?lat={}&lon={}`

### 2.3 Data Sources
- Atmosphere: MGS TES, MRO MCS, MRO MARCI, REMS, MEDA
- Radiation: RAD (Curiosity), MARIE (Odyssey), Planetocosmics models
- Thermal: MOLA/HRSC thermal inertia, THEMIS, REMS, MEDA
- Water: SHARAD, CRISM, OMEGA, neutron spectrometer (HEND/NS)

---

## Phase 3: Climate & Weather Module (Week 5)

### 3.1 Schema Design
```python
# app/schemas/climate.py
class WeatherObservation(BaseModel):
    timestamp: datetime
    lat: float
    lon: float
    temperature_k: float
    pressure_pa: float
    wind_speed_ms: float
    wind_direction_deg: float
    dust_opacity: float
    source: str  # "REMS", "MEDA", "MARCI", "MCS"

class ClimateNormals(BaseModel):
    lat: float
    lon: float
    monthly_temps_k: list[float]  # 12 months
    monthly_pressure_pa: list[float]
    dust_storm_probability: list[float]  # 12 months
    solar_illumination_hours: list[float]
```

### 3.2 Endpoints
- `GET /climate/weather?lat={}&lon={}&start={}&end={}`
- `GET /climate/normals?lat={}&lon={}`
- `GET /climate/dust-storms?lat={}&lon={}&season={}`
- `GET /climate/solar-illumination?lat={}&lon={}&date={}`

### 3.3 Visualization
- Temperature overlay (time slider)
- Dust storm tracking
- Solar illumination calculator
- Pressure/wind vectors

---

## Phase 4: Mission Planning Module (Week 6)

### 4.1 Schema Design
```python
# app/schemas/mission.py
class LandingSiteCandidate(BaseModel):
    id: str
    name: str
    lat: float
    lon: float
    elevation_m: float
    slope_stats: SlopeStats
    geology: GeologySummary
    water_access: WaterAccess
    solar_energy: SolarPotential
    communications: CommWindow
    hazards: list[Hazard]
    score: float  # 0-100
    score_breakdown: dict[str, float]
    assumptions: list[str]
    uncertainties: dict

class MissionPlan(BaseModel):
    id: str
    name: str
    landing_site: LandingSiteCandidate
    traverse_waypoints: list[TraverseWaypoint]
    science_objectives: list[ScienceObjective]
    risk_assessment: RiskAssessment
    resource_budget: ResourceBudget
    timeline: Timeline
```

### 4.2 Scoring System (Transparent)
```
Science Value (30%):
  - Geological diversity
  - Water/ice proximity
  - Mineralogical interest
  - Stratigraphic exposure

Engineering Feasibility (30%):
  - Slope < 15° (landing)
  - Rock abundance < 10%
  - Elevation < 0 km (atmospheric braking)
  - Latitude for solar power

Safety (25%):
  - Radiation exposure
  - Thermal extremes
  - Dust storm frequency
  - Rock/obstacle density

Resources (15%):
  - Water/ice accessibility
  - Solar energy potential
  - Regolith for ISRU
```

### 4.3 Endpoints
- `POST /mission/analyze-site` — Analyze candidate site
- `GET /mission/candidates` — Pre-scored candidate list
- `POST /mission/plan` — Generate mission plan
- `GET /mission/plan/{id}`

---

## Phase 5: Scientific Research Library (Week 7)

### 5.1 Schema Design
```python
# app/schemas/library.py
class ResearchResource(BaseModel):
    id: str
    title: str
    authors: list[str]
    institution: str
    publication_date: date
    category: str  # "planetary_science", "human_spaceflight", etc.
    abstract: str
    source: str  # "NTRS", "PDS", "OpenAlex", "Zenodo", etc.
    doi: str | None
    dataset_id: str | None
    tags: list[str]
    url: str
    access_type: str  # "open", "restricted", "public_domain"
```

### 5.2 Data Sources
- **NASA NTRS**: Technical reports, conference papers
- **NASA PDS**: Dataset catalog with DOIs
- **OpenAlex**: Scientific publications (free API)
- **Zenodo**: Research datasets, software
- **ADS**: Astrophysics Data System
- **PubMed/arXiv**: Cross-listed planetary science

### 5.3 Endpoints
- `GET /library/search?q={}&category={}&source={}`
- `GET /library/{id}`
- `GET /library/related/{id}`

---

## Phase 6: Frontend Integration (Weeks 8-9)

### 6.1 New Navigation Structure
```
PLANETARY SCIENCE
├── Mars Explorer (existing map)
├── Surface Geology
│   ├── MOLA Elevation
│   ├── HRSC Elevation
│   ├── CTX Mosaic
│   ├── HiRISE DTMs
│   ├── Geological Maps
│   └── Mineralogy (CRISM)
├── Climate & Weather
│   ├── Temperature
│   ├── Pressure & Wind
│   ├── Dust Storms
│   └── Solar Illumination
├── Water Resources
│   ├── Surface Ice
│   ├── Subsurface Ice
│   └── Hydrated Minerals
├── Radiation Environment
├── Survival Assessment
├── Habitat Engineering
├── Mission Planning
└── Scientific Library
```

### 6.2 Component Architecture
```
src/
├── views/
│   ├── MarsExplorerView.vue      (existing)
│   ├── GeologyView.vue
│   ├── ClimateView.vue
│   ├── WaterView.vue
│   ├── RadiationView.vue
│   ├── SurvivalView.vue
│   ├── MissionView.vue
│   └── LibraryView.vue
├── components/
│   ├── map/
│   ├── charts/
│   ├── forms/
│   └── library/
├── stores/
│   ├── mapStore.ts
│   ├── climateStore.ts
│   ├── survivalStore.ts
│   ├── missionStore.ts
│   └── libraryStore.ts
└── api/
    ├── elevation.ts
    ├── climate.ts
    ├── survival.ts
    ├── mission.ts
    └── library.ts
```

### 6.3 Map Layers
- Layer groups with visibility toggles
- Opacity sliders per layer
- Legend components with units
- Time slider for temporal data
- Layer metadata panel (source, resolution, uncertainty)

---

## Phase 7: Scientific Accuracy & Validation (Week 10)

### 7.1 Metadata Validation
- Every dataset: source, identifier, date, units, resolution, coverage, uncertainty
- Distinguish observations vs. models
- Cite original papers/DOIs

### 7.2 Validation Tests
- [ ] Elevation at 5 known locations vs published values
- [ ] Distance measurements vs independent calculation
- [ ] Slope/profile vs manual raster calculation
- [ ] Climate normals vs published Mars climate atlases
- [ ] Radiation estimates vs published RAD data
- [ ] Water ice locations vs published SHARAD/CRISM papers

### 7.3 Documentation
- `docs/DATA_SOURCES.md` — Complete dataset catalog
- `docs/METHODOLOGY.md` — Calculation methods, assumptions
- `docs/VALIDATION.md` — Validation results
- `docs/LIMITATIONS.md` — Known limitations

---

## Phase 8: Space Apps Submission Prep (Week 11-12)

### 8.1 Demo Preparation
- 3-min video walkthrough
- Live demo rehearsal
- Backup screenshots for offline demo

### 8.2 Submission Materials
- Project name & summary
- Presentation outline (7 slides)
- Project details
- AI usage disclosure
- NASA data sources
- Other resources
- Competition strategy

### 8.3 Final Polish
- Accessibility audit (WCAG 2.1 AA)
- Performance optimization
- Cross-browser testing
- Mobile responsiveness

---

## Dataset Priority Matrix

| Priority | Dataset | Source | Effort | Impact |
|----------|---------|--------|--------|--------|
| P0 | MOLA DEM (complete) | NASA/USGS | Low | Critical |
| P0 | HRSC DEM | ESA/DLR | Medium | High |
| P0 | IAU Gazetteer (complete) | USGS/IAU | Low | High |
| P1 | CTX Mosaic | NASA/USGS | Medium | High |
| P1 | THEMIS IR/Thermal Inertia | ASU/NASA | Medium | High |
| P1 | Climate (REMS/MEDA/MARCI) | NASA/JPL | Medium | High |
| P1 | Radiation (RAD/MARIE) | NASA/JPL | Medium | High |
| P1 | Water Ice (SHARAD/CRISM) | NASA/ESA | High | Critical |
| P1 | USGS Geologic Maps | USGS | Medium | High |
| P2 | HiRISE DTMs | UArizona/NASA | High | Medium |
| P2 | CRISM Mineral Maps | JHU/APL | High | Medium |
| P2 | Scientific Library | NTRS/OpenAlex | Medium | High |
| P3 | Historical Climate Models | NASA/ESA | High | Medium |

---

## Technical Debt to Address

1. **Backend tile rendering** — Replace PIL placeholders with rio-tiler expressions
2. **Spherical interpolation** — Fix linear lat/lon interpolation in profile/route
3. **Error handling** — Consistent error responses, logging
4. **Rate limiting** — External API clients with retry/backoff
5. **Caching** — Redis or in-memory for external API responses
6. **Async downloads** — Large dataset preparation with progress tracking
7. **Type safety** — Strict TypeScript, Pydantic v2 validation

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| External API rate limits | High | Medium | Caching, fallback data, rate-limit handling |
| Large dataset downloads | Medium | High | Progressive loading, spatial subsetting |
| Coordinate system mismatches | Medium | High | Strict validation, unit tests |
| Scientific accuracy claims | Low | Critical | Peer review, validation against literature |
| Performance on mobile | Medium | Medium | Lazy loading, progressive enhancement |
| Scope creep | High | High | Strict phase gates, prioritize P0/P1 |

---

## Definition of Done per Phase

- [ ] All endpoints return 200 with valid Pydantic responses
- [ ] Unit tests pass (>80% coverage for services)
- [ ] Integration tests pass for critical paths
- [ ] Frontend components render without console errors
- [ ] Metadata documented for all new datasets
- [ ] Validation tests pass against known values
- [ ] Documentation updated
- [ ] No console errors in browser
- [ ] Accessibility audit passes (axe-core)

---

## Immediate Next Steps (This Week)

1. [ ] Refactor backend to modular structure (0.1)
2. [ ] Add pydantic-settings config (0.2)
3. [ ] Set up pytest + httpx (0.3)
4. [ ] Create dataset metadata schema (1.1)
5. [ ] Implement MOLA hillshade/color tiles via rio-tiler
8. [ ] Start HRSC DEM integration research
9. [ ] Set up GitHub Actions CI

---

## Notes

- **Do not** create fake UI or placeholder functionality presented as complete
- **Do not** download massive datasets unnecessarily — use spatial subsetting, COGs, progressive loading
- **Do** distinguish observations from models in all UI
- **Do** cite sources for every data point
- **Do** validate against published literature
- **Do** keep modules loosely coupled
- **Do** write tests alongside implementation