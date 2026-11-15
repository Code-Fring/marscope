# Scientific Requirements for MARSCOPE

## Core Scientific Objectives (Derived from Challenge)

### 1. Multi-Layer Data Integration
**Requirement:** Integrate ≥3 distinct data types from NASA Mars missions
**Candidate Data Types:**
- **Topographic:** MOLA (Mars Orbiter Laser Altimeter) - elevation, slope, roughness
- **Optical/Visible:** HiRISE (MRO), CTX (MRO), Mastcam (Curiosity/Perseverance) - high-res imagery
- **Thermal:** THEMIS (Mars Odyssey) - thermal inertia, surface temperature
- **Spectral/Mineralogical:** CRISM (MRO) - mineral composition, hydration
- **Geophysical:** SHARAD (MRO) - subsurface radar, ice detection
- **Atmospheric:** MEDA (Perseverance), REMS (Curiosity) - pressure, temperature, wind, radiation
- **Radiation:** RAD (Curiosity) - surface radiation environment
- **Chemical:** APXS, ChemCam (Curiosity/Perseverance) - elemental composition

### 2. Hyperlocal EVA-Scale Mapping
**Requirement:** Map resolution suitable for individual astronaut traverses (meters to tens of meters)
**Implications:**
- Global datasets (MOLA ~460m/pixel) insufficient alone
- Need HiRISE (~0.25-0.5m/pixel) or CTX (~5-6m/pixel) for traverse planning
- Landing site regions have best coverage

### 3. Astronaut Safety & Mobility
**Requirements:**
- **Slope analysis:** Maximum traversable slope for suited astronaut (~15-20° for walking, ~25° for rover)
- **Terrain roughness:** Rock abundance, surface texture from thermal inertia
- **Radiation exposure:** Cumulative dose along route, shelter identification
- **Thermal environment:** Surface temperature extremes, diurnal variation
- **Obstacle avoidance:** Large rocks, cliffs, sand traps from imagery
- **Communication/visibility:** Line-of-sight to habitat/relay

### 4. Scientific Target Identification
**Requirements:**
- Named feature database (craters, landing sites, regions)
- Geologic unit mapping (USGS geologic maps)
- Mineralogical targets (hydrated minerals, carbonates, etc.)
- Stratigraphic sequences for traverse planning

### 5. Route Planning & Optimization
**Requirements:**
- Waypoint-based route builder
- Distance measurement (great-circle on Mars sphere)
- Elevation profile along route
- Cumulative ascent/descent
- Maximum slope along route
- Optional: Cost-path analysis (slope, roughness, thermal inertia as cost factors)

## Coordinate System Requirements

### Mars Coordinate Conventions (MANDATORY)
| Aspect | Convention | Notes |
|--------|-----------|-------|
| **Datum** | Mars sphere (radius 3396.19 km) or Mars ellipsoid (a=3396.19, b=3376.2 km) | IAU 2015 |
| **Latitude** | Planetocentric (default for MOLA, most modern data) | -90° to +90° |
| **Longitude** | East-positive (0-360°) - IAU standard | West-positive used in older data |
| **Elevation Reference** | Areoid (Mars geoid) or sphere/ellipsoid | MOLA uses areoid |
| **Projection** | Equirectangular (simple cylindrical) for global; Polar stereographic for poles | Web Mercator NOT appropriate for Mars |

### Critical Implementation Notes
- **Never use Earth radius** (6371 km) for distance calculations
- **Never use Web Mercator** (EPSG:3857) for Mars - distorts poles severely
- **Verify each dataset's coordinate system** before integration
- **Display coordinate system** to user in UI

## Data Quality & Uncertainty Requirements

### Per-Displayed-Value Labeling (MANDATORY)
Every numerical value shown to user must be labeled as:
1. **Direct Observation** - Raw measurement from instrument
2. **Derived Measurement** - Computed from raw data (state method)
3. **Estimate** - Model/interpolation (state assumptions)

### Required Metadata Per Layer
- Source mission/instrument
- Spatial resolution (m/pixel)
- Temporal coverage (dates)
- Vertical accuracy (for elevation)
- Processing level (raw, calibrated, derived)
- Attribution/citation
- License/usage terms

## Validation Requirements

### Ground Truth Validation Points (Minimum 5)
| Location | Known Elevation | Known Coordinates | Source |
|----------|----------------|-------------------|--------|
| Olympus Mons summit | ~21.9 km | 18.65°N, 226.2°E | MOLA/IAU |
| Valles Marineris floor | ~-5 to -7 km | ~7°S, 285°E | MOLA |
| Jezero Crater (Perseverance) | ~-2.6 km | 18.4°N, 77.5°E | MOLA/Perseverance |
| Hellas Basin floor | ~-7 to -8 km | 42°S, 70°E | MOLA |
| Gale Crater (Curiosity) | ~-4.5 km | 4.5°S, 137.4°E | MOLA/Curiosity |

### Measurement Validation
- Great-circle distance on Mars sphere vs. app measurement
- Elevation profile vs. direct MOLA profile extraction
- Slope calculation vs. manual calculation on source DEM

## Performance Requirements

### Target Hardware
- Standard laptop (8-16 GB RAM, integrated graphics)
- Tablet (iPad/Android) for HUD concept
- No GPU compute requirement for core features

### Response Time Targets
- Map pan/zoom: <100ms
- Layer switch: <500ms
- Elevation query: <200ms
- Profile generation: <2s for 100-point profile
- Route calculation: <5s

## Accessibility Requirements
- WCAG 2.1 AA compliance
- Keyboard navigation for all map controls
- Screen reader compatible layer metadata
- Sufficient contrast (dark scientific theme)
- No color-only information encoding