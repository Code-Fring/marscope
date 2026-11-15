# MARSCOPE — Project Details

## Architecture

**Frontend**: Single-page application built with Preact + TypeScript + Vite
- **Map Engine**: Leaflet 1.9+ with custom CRS (`MarsCRS`) for Mars Simple Cylindrical projection (planetocentric, +East 0-360°)
- **Projections**: Azimuthal Equidistant (AEQD) for local mapping accuracy, ported from planetary-dem-to-stl; haversine great-circle distance on Mars sphere (R=3,396,190 m)
- **State**: @preact/signals for fine-grained reactivity (map view, layers, measurements, routes, UI)
- **UI**: Vanilla CSS dark scientific theme; left sidebar (layers/datasets/features), right sidebar (location details), bottom panel (measure/route), attribution bar
- **Build**: Vite 5, ES2022 target, code splitting (leaflet/vendor, preact/vendor), ~70 KB gzipped core

**Backend** (Optional — for MOLA tile serving & elevation queries):
- FastAPI + Uvicorn (ASGI)
- rio-tiler + rasterio for Cloud-Optimized GeoTIFF (COG) tile serving
- Endpoints: `/elevation` (point), `/profile` (line), `/slope` (Horn's method), `/route` (waypoints), `/tiles/{layer}/{z}/{x}/{y}.png`
- Dockerized (Python 3.12 slim + GDAL/rasterio); mounts MOLA COG volume
- CORS enabled for frontend dev; graceful degradation if backend unavailable

**3D View (Tier 5 — Lazy Loaded)**:
- CesiumJS (@cesium/engine + @cesium/widgets) loaded on-demand
- Custom Mars ellipsoid (sphere, 3,396,190 m)
- Same MOLA COG as terrain/imagery source

---

## Functionality

### Tier 1 — Core Map (WORKING)
- **Interactive Map**: Pan, zoom (0-12), coordinate readout (planetocentric +E 0-360° and ±180°)
- **Base Layers**: MOLA Hillshade, MOLA Colorized Elevation, MOLA Slope (derived) — radio button switching
- **Overlay Layers**: THEMIS Day IR, THEMIS Night IR, CTX Mosaic, HiRISE — checkboxes with opacity sliders (placeholders)
- **Layer Metadata**: Datasets tab shows source, instrument, resolution, coverage, USGS product URL for each layer
- **Click Inspection**: Map click → coordinates (planetocentric +E 0-360 / ±180), elevation from MOLA DEM via backend (graceful degradation if offline), nearby named features (KD-tree search, 40+ pre-loaded)

### Tier 2 — Analysis (PARTIAL)
- **Distance Measurement**: UI scaffolded; haversine great-circle on Mars sphere (R=3,396.19 km) implemented in `aeqd.ts`; map interaction not yet connected
- **Elevation Profile**: UI scaffolded; backend `/profile` endpoint samples MOLA COG at N points along great-circle segments; Horn's method slope available via `/slope`
- **Slope Visualization**: MOLA Slope tile layer + `/slope` endpoint (Horn's method on 3x3 neighborhood at 463m resolution); labeled "derived, 463m resolution"

### Tier 3 — Science Context (PARTIAL)
- **Feature Search**: 40+ Mars features pre-loaded from IAU Gazetteer (Feature IDs 15000-15001, 5356-5357, 12239-12276); search input scaffolded; click feature → centers map, shows metadata (type, diameter, approval date, origin, reference, quad)
- **Feature Click**: Map markers for all features; click → centers map, shows details in right sidebar
- **Geology Overlay**: Placeholder in Datasets tab; USGS geologic maps not yet integrated

### Tier 4 — Planning (PARTIAL)
- **Route Planner**: UI scaffolded (waypoints via Shift+click); backend `/route` computes total distance, cumulative ascent/descent, max slope per segment; frontend not yet connected to map interaction
- **Output**: Total distance, cumulative ascent/descent, max slope, per-segment breakdown; all labeled "candidate route only — no hazard/rock/trafficability/comms/illumination data"

### Tier 5 — Optional (NOT IMPLEMENTED)
- 3D terrain view (CesiumJS lazy-load scaffold only)
- Export measurements/routes (GeoJSON/CSV)
- Shareable URL state (hash-based state serialization)

---

## Data Integration

| Dataset | Status | Resolution | License | Access Method |
|---------|--------|------------|---------|---------------|
| MOLA DEM 463m | INVESTIGATED ONLY (metadata + backend) | 463 m/px | CC0 | COG via rio-tiler (2.1 GB source) |
| IAU Gazetteer | INTEGRATED (40+ features) | N/A | Public Domain | Pre-loaded JSON from Feature pages |
| HiRISE | INVESTIGATED ONLY | 0.25-0.5 m/px | Public Domain | Placeholder layer |
| CTX | INVESTIGATED ONLY | 5-6 m/px | Public Domain | Placeholder layer |
| THEMIS IR | INVESTIGATED ONLY | 100 m/px | Public Domain | Placeholder layer |
| CRISM | INVESTIGATED ONLY | 18 m/px | Public Domain | Not integrated |
| SHARAD | INVESTIGATED ONLY | N/A | Public Domain | Not integrated |
| USGS Geologic Maps | INVESTIGATED ONLY | Various | Public Domain | Not integrated |
| Mars Rover Photos API | INVESTIGATED ONLY | Various | Public Domain | Not integrated |

**Coordinate System Rigor**:
- Planetocentric latitude, East-positive longitude (0-360°)
- Mars sphere radius: 3,396,190 m (IAU 2000 / MOLA product)
- Vertical datum: Areoid (GMM-2B gravity field, degree/order 50)
- Vertical accuracy: ±3 m (areoid ±1.8 m + regional)
- Horizontal accuracy: ~100 m
- No Web Mercator, no Earth radius used anywhere

---

## Mapping

- **Base Map**: MOLA Hillshade (default), MOLA Colorized Elevation, MOLA Slope (derived)
- **Projection**: Simple Cylindrical (Equirectangular) for global view; Azimuthal Equidistant for local measurement accuracy
- **Tile Scheme**: Standard XYZ (z/x/y.png) at 256px; max zoom 12 (~113m/px at equator)
- **Overlay**: Feature markers (circle markers), measurement lines, route waypoints
- **Attribution**: Persistent bottom bar + per-layer in Datasets tab + right sidebar for features

---

## Terrain

- **Source**: MGS MOLA DEM 463m (CC0) — 600M+ laser altimeter shots (1999-2001), adjusted for consistency, converted to Areoid (GMM-2B)
- **Derived Products**:
  - Hillshade: Standard illumination (azimuth 315°, altitude 45°)
  - Colorized Elevation: Hypsometric tint (custom palette)
  - Slope: Horn's method on 3x3 neighborhood (463m resolution) — labeled "derived"
- **Accuracy**: ±3 m vertical (areoid ±1.8 m + regional), ~100 m horizontal
- **Limitations**: Polar gaps filled by interpolation; 463m resolution means meter-scale hazards invisible; no rock abundance or trafficability data

---

## Geology

- **Source**: USGS Planetary Geologic Maps (Public Domain) — investigated only
- **Integration**: Placeholder in Datasets tab; not yet rendered as vector tile overlay
- **Future**: GeoPackage/GeoJSON from USGS → vector tiles via tippecanoe or rio-tiler

---

## Planning

- **Route Builder**: Waypoint-based (Shift+click), great-circle segments on Mars sphere
- **Metrics**: Total distance, cumulative ascent/descent, max slope per segment, per-segment breakdown
- **Output**: GeoJSON export scaffolded; labeled "candidate route only — no hazard/rock/trafficability/comms/illumination data"
- **Missing**: No A* routing, no cost surface (slope/roughness/thermal), no illumination/comms analysis

---

## UX

- **Dark Scientific Theme**: High contrast (WCAG 2.1 AA target), minimal animation, map-first layout
- **Layout**: Left sidebar (collapsible), center map, right sidebar (collapsible), bottom panel (collapsible)
- **Keyboard**: Full keyboard navigation for layer controls, measurement tools (tab/enter/arrows)
- **Screen Reader**: ARIA labels on all interactive elements; semantic HTML
- **Color**: No color-only encoding; patterns + labels for slope categories
- **Responsive**: Sidebar overlay on mobile (<768px); bottom panel fixed height

---

## Technologies

**Frontend**:
- Preact 10 + TypeScript 5 + Vite 5
- Leaflet 1.9 + Proj4Leaflet 1 + PROJ4JS 2
- @preact/signals (reactive state)
- Vitest (unit testing)

**Backend**:
- FastAPI 0.110 + Uvicorn 0.29
- rasterio 1.3 + rio-tiler 4 + numpy 1.26
- Docker (Python 3.12 slim + GDAL 3.8)

**Data Processing**:
- gdal_translate (COG conversion with DEFLATE + PREDICTOR=2)
- planetary-dem-to-stl (AEQD projection reference implementation)

**All Licenses**: MIT / BSD-2-Clause / BSD-3-Clause / Apache-2.0 — compatible with MIT release

---

## Innovation

1. **Correct Mars CRS in Leaflet**: Custom simple cylindrical + AEQD projections with proper Mars sphere radius (not Earth)
2. **Honest Derived Measurements**: Every elevation/slope/profile/route value labeled with source, resolution, method, and uncertainty
3. **Minimal Permissive Stack**: No heavy frameworks; ~70 KB gzipped core; all dependencies MIT/BSD/Apache-2.0
4. **Backend Optional**: Graceful degradation — map works without backend; elevation/profile/route degrade to "unavailable" with clear messaging
5. **Reproducible Data Pipeline**: Single script downloads MOLA (2.1 GB) and converts to COG with standard GDAL options
6. **Honest Documentation**: IMPLEMENTATION_STATUS.md tracks every feature/dataset/dependency with WORKING/PARTIAL/NOT IMPLEMENTED status

---

## Impact

- **Primary Users**: Mission planners, EVA designers, planetary science students, public outreach
- **Use Case**: Pre-mission traverse planning, landing site context, education/outreach
- **Scientific Value**: Integrates authoritative NASA/USGS data in accessible interface with correct coordinate handling and explicit uncertainty
- **Safety**: Explicit caveats on all derived products; no false precision; "candidate route only" labeling
- **Reproducibility**: Clean clone → `npm install && npm run dev` + backend Docker → working app

---

## Accessibility

- WCAG 2.1 AA target: sufficient contrast, keyboard navigation, screen reader labels
- No color-only information (slope uses patterns + labels)
- Focus visible on all interactive elements
- Semantic HTML, ARIA labels on map controls
- Dark theme default (reduces eye strain for mission ops)

---

## Weaknesses & Known Limitations

1. **Backend Required for Elevation**: MOLA COG not served via CORS; requires FastAPI proxy
2. **Measurement Tools Not Connected**: Distance/profile/route UI exists but map click handlers not implemented
3. **No Geology Overlay**: USGS maps investigated but not integrated
4. **No A* Routing**: Cost-surface routing not implemented
5. **Polar Coverage**: MOLA sparse above 87°; AEQD projection limited to 80° latitude
6. **Vertical Accuracy**: ±3 m stated; regional variations unquantified
7. **No Hazard Data**: Rock abundance, trafficability, illumination, comms — all missing
6. **Testing Incomplete**: Unit tests scaffolded; integration/validation pending

---

## Future Work

1. Complete measurement tool map interactions (distance, profile, route)
2. Integrate USGS geologic maps as vector tile layer
3. Add HiRISE/CTX/THEMIS tile services when endpoints discovered
4. Implement A* routing on slope/roughness cost surface
5. Add illumination/comms analysis for route planning
7. Full validation against 5 known locations (Olympus Mons, Valles Marineris, Jezero, Hellas, Gale)
8. Deploy to GitHub Pages + Fly.io/Railway for live demo
9. E2E tests with Playwright for critical user flows