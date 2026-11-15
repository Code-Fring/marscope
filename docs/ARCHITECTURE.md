# MARSCOPE Architecture Document

## Executive Summary

MARSCOPE is a client-side-first web application for interactive Mars exploration and mission planning. It uses a minimal, permissively-licensed stack to deliver Tier 1-3 functionality (interactive map, elevation sampling, measurement tools, feature search) with optional Tier 5 3D view.

**Core Principle:** Ship a smaller, correct, verifiable application rather than a larger overclaimed one.

---

## Technology Stack

### Frontend (Client-Side)

| Layer | Technology | License | Size (gz) | Justification |
|-------|------------|---------|-----------|---------------|
| Map Engine | **Leaflet 1.9+** | BSD-2-Clause | ~40 KB | Smallest mature 2D map library; huge plugin ecosystem; custom CRS support via Proj4Leaflet |
| Projections | **Proj4Leaflet + PROJ4JS** | BSD-2-Clause / MIT | ~15 KB | Enables Mars custom CRS (azimuthal equidistant, simple cylindrical) |
| UI Framework | **Vanilla TypeScript + CSS** | MIT (our code) | ~10 KB | No framework overhead; direct DOM control; minimal bundle |
| State | **Signals (preact/signals or custom)** | MIT | ~2 KB | Fine-grained reactivity without virtual DOM |
| Build | **Vite 5+** | MIT | N/A | Fast HMR, optimized production builds, TypeScript native |

**Total Core Bundle Target:** < 100 KB gzipped (excluding map tiles)

### Backend (Optional - Only for MOLA DEM Tile Serving)

| Layer | Technology | License | Justification |
|-------|------------|---------|---------------|
| API | **FastAPI** | MIT | Async, auto OpenAPI docs, minimal |
| Raster I/O | **Rasterio + rio-tiler** | BSD-3-Clause | COG tile server, efficient windowed reads |
| Server | **Uvicorn** | BSD-3-Clause | ASGI, production-ready |
| DEM Source | **MOLA COG (local)** | CC0 | Pre-converted from USGS GeoTIFF |

**Backend Deploy:** Single container (Docker), ~200 MB, runs on any cloud VM or locally.

### 3D View (Tier 5 - Lazy Loaded)

| Layer | Technology | License | Justification |
|-------|------------|---------|---------------|
| Globe | **CesiumJS (@cesium/engine + @cesium/widgets)** | Apache-2.0 | Only mature WebGL globe with custom ellipsoid support; loaded on-demand |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Leaflet    │  │  UI State   │  │  Geo Utils  │             │
│  │  Map        │  │  (Signals)  │  │  (geo.ts)   │             │
│  │  + Proj4    │  │             │  │  - AEQD     │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                    │
│         ▼                ▼                ▼                    │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              LAYER CONTROLLER                        │       │
│  │  - Base Layers (MOLA hillshade, THEMIS, CTX, HiRISE)│       │
│  │  - Overlay Layers (Features, Geology, Routes)       │       │
│  │  - Opacity/Visibility Controls                      │       │
│  └────────────────────┬────────────────────────────────┘       │
│                       │                                        │
│         ┌─────────────┼─────────────┐                          │
│         ▼             ▼             ▼                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │ Elevation│  │ Measure  │  │ Features │                     │
│  │ Sampler  │  │ Tools    │  │ Search   │                     │
│  │ (Worker) │  │          │  │ (Local)  │                     │
│  └──────────┘  └──────────┘  └──────────┘                     │
│         │             │             │                           │
│         └─────────────┼─────────────┘                           │
│                       ▼                                        │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              RIGHT SIDEBAR PANEL                       │       │
│  │  - Coordinates (planetocentric, +E 0-360)            │       │
│  │  - Elevation (source: MOLA 463m, ±3m)                │       │
│  │  - Feature Metadata (IAU Gazetteer)                  │       │
│  │  - Uncertainty / Data Quality Flags                  │       │
│  └─────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                    HTTPS / REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Optional)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │  FastAPI    │───▶│  rio-tiler  │───▶│  MOLA COG   │         │
│  │  /tiles/    │    │  (COG read) │    │  (local fs) │         │
│  │  {z}/{x}/{y}│    │             │    │  2.1 GB     │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│         │                                                     │
│         ▼                                                     │
│  ┌─────────────┐                                             │
│  │  /elevation │  (point query via rio-tiler or rasterio)    │
│  │  /profile   │  (line sampling)                            │
│  │  /slope     │  (on-demand computation)                    │
│  └─────────────┘                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Map Initialization
```
1. Load Leaflet + Proj4Leaflet
2. Register Mars CRS (simple cylindrical + azimuthal equidistant)
3. Initialize base layer: MOLA hillshade tiles from backend
4. Load feature index (IAU Gazetteer Mars features) from local JSON
5. Render UI: left sidebar (layers), right sidebar (empty), bottom panel (measurements)
```

### 2. User Clicks Map
```
1. Click event → lat/lon in Mars CRS
2. Convert to planetocentric +E 0-360
3. Show coordinates in right sidebar
4. Fire elevation query: GET /elevation?lat={}&lon={}
5. Backend: rio-tiler reads COG window → returns elevation (metres)
6. Display: "Elevation: -4523 m (MOLA 463m, derived, ±3m)"
7. Fire feature lookup: local k-d tree search → nearest named features
8. Display feature list with distances
```

### 3. User Draws Measurement Line
```
1. LineString captured in map CRS
2. Convert vertices to planetocentric
3. Sample elevation along line: GET /profile?coords=...
4. Backend: samples MOLA COG at N points (default 100)
5. Returns: [{lat, lon, elev, dist_from_start}, ...]
6. Frontend: renders elevation profile chart (Canvas/Chart.js)
7. Computes: total distance, cumulative ascent/descent, max slope
8. Labels all values: "Derived from MOLA 463m, slope via Horn's method"
```

### 4. User Builds Route
```
1. Waypoints added via click (shift+click)
2. Route = piecewise great-circle segments on Mars sphere (R=3,396,190m)
3. For each segment: sample elevation profile
4. Aggregate: total distance, ascent, descent, max slope, min elevation
5. Display in bottom panel with "Candidate route only" disclaimer
6. Export: GeoJSON with metadata
```

---

## Coordinate System Handling

### Mars Constants (Single Source of Truth)
```typescript
// src/constants/mars.ts
export const MARS = {
  RADIUS_M: 3_396_190,           // IAU 2000, MOLA product
  MOLA_RESOLUTION_MPP: 463.0835744,
  MOLA_WIDTH_PX: 46_080,
  MOLA_HEIGHT_PX: 23_040,
  VERTICAL_ACCURACY_M: 3,        // ±3 m (areoid + regional)
  HORIZONTAL_ACCURACY_M: 100,    // ~100 m
} as const;
```

### CRS Definitions
```typescript
// Simple Cylindrical (Global) - matches MOLA grid
export const MARS_SIMPLE_CYLINDRICAL = new Proj.Projection('+proj=eqc +lat_ts=0 +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +R=3396190 +units=m +no_defs');

// Azimuthal Equidistant (Local) - for measurement accuracy
// Center point defined per-view
export function createAEQDProjection(centerLat: number, centerLon: number) {
  return new Proj.Projection(`+proj=aeqd +lat_0=${centerLat} +lon_0=${centerLon} +R=3396190 +units=m +no_defs`);
}
```

### Display Format
- **Internal:** Planetocentric latitude, East-positive longitude (0-360°)
- **Display:** "Lat: 18.45° N, Lon: 77.52° E (Planetocentric, +E 0-360)"
- **Right Sidebar:** Shows both +E 0-360 and -180 to +180 for reference

---

## Module Structure

```
marscope/
├── src/
│   ├── main.ts                 # App entry, Leaflet init
│   ├── constants/
│   │   └── mars.ts             # Mars physical constants
│   ├── projections/
│   │   ├── crs.ts              # Leaflet CRS registration
│   │   └── aeqd.ts             # Azimuthal equidistant utils (port from geo.py)
│   ├── layers/
│   │   ├── baseLayers.ts       # MOLA, THEMIS, CTX, HiRISE tile layers
│   │   ├── featureLayer.ts     # IAU Gazetteer points
│   │   ├── geologyLayer.ts     # USGS geologic maps (GeoJSON)
│   │   └── routeLayer.ts       # User-drawn routes
│   ├── ui/
│   │   ├── LeftSidebar.tsx     # Layer controls, dataset list
│   │   ├── RightSidebar.tsx    # Location details, metadata
│   │   ├── BottomPanel.tsx     # Measurements, profiles, routes
│   │   └── AttributionBar.tsx  # Always-visible data credits
│   ├── state/
│   │   ├── mapStore.ts         # Signals: center, zoom, activeLayers
│   │   ├── measurementStore.ts # Current line, profile data
│   │   └── routeStore.ts       # Waypoints, computed route metrics
│   ├── api/
│   │   ├── client.ts           # Backend fetch wrappers
│   │   └── types.ts            # API response types
│   ├── workers/
│   │   └── elevationWorker.ts  # Off-main-thread profile computation
│   └── utils/
│       ├── distance.ts         # Haversine on Mars sphere
│       ├── slope.ts            # Horn's method / finite difference
│       └── format.ts           # Coordinate formatting
├── public/
│   ├── data/
│   │   └── mars_features.json  # Pre-fetched IAU features (name, lat, lon, type, diameter)
│   └── vite.svg
├── backend/ (optional)
│   ├── main.py                 # FastAPI app
│   ├── tiles.py                # /tiles/{z}/{x}/{y}.png via rio-tiler
│   ├── elevation.py            # /elevation, /profile, /slope
│   ├── Dockerfile
│   └── requirements.txt
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Rejected Alternatives & Rationale

| Alternative | Reason for Rejection |
|-------------|---------------------|
| **CesiumJS as primary** | 2MB+ bundle; 3D not required for Tiers 1-3; overkill for 2D map-first UX |
| **OpenLayers** | Larger bundle (~150 KB); more complex API; Leaflet sufficient |
| **MapLibre GL** | Vector-tile focused; planetary raster data not a good fit |
| **Web WorldWind** | Less active; NASA but smaller community; Apache-2.0 but larger |
| **mars3d** | Custom license requires logo retention; not MIT-compatible |
| **React/Vue/Svelte** | Framework overhead not justified for map-centric app; vanilla TS + Signals simpler |
| **Client-side TIFF (planetary-dem-to-stl)** | CORS blocks USGS S3; Web Worker TIFF parsing complex; backend COG simpler |
| **GDAL in browser (gdal-wasm)** | Large WASM (~20 MB); overkill for tile serving |
| **PostGIS/PostgreSQL** | Heavy for tile serving; rio-tiler + COG is simpler |
| **GeoServer** | Java, heavy; not needed for static COG |

---

## Deployment

### Development
```bash
# Frontend
npm install
npm run dev          # Vite dev server on localhost:5173

# Backend (optional, for MOLA tiles)
cd backend
pip install -r requirements.txt
# Download & convert MOLA to COG (one-time, ~10 min)
python scripts/prepare_mola_cog.py
uvicorn main:app --reload  # localhost:8000
```

### Production (Static Hosting + Optional Backend)
- **Frontend:** `npm run build` → `dist/` → deploy to GitHub Pages, Netlify, Vercel, Cloudflare Pages
- **Backend:** Docker container on Fly.io, Railway, Render, or any VM with Docker
- **MOLA COG:** Stored in backend container or cloud storage (S3/R2) with byte-range support

### Environment Variables
```bash
# Frontend (.env)
VITE_API_BASE_URL=https://api.marscope.dev  # or http://localhost:8000
VITE_MARS_TREK_BASE_URL=https://trek.nasa.gov/tiles  # if tile endpoints found

# Backend (.env)
MOLA_COG_PATH=/data/Mars_MGS_MOLA_DEM_mosaic_global_463m_cog.tif
API_HOST=0.0.0.0
API_PORT=8000
```

---

## Testing Strategy

### Unit Tests (Vitest)
- `distance.ts` - Haversine against known Mars great-circle distances
- `slope.ts` - Horn's method against synthetic DEM
- `projections/aeqd.ts` - Round-trip accuracy < 1 mm
- `format.ts` - Coordinate formatting edge cases

### Integration Tests
- Backend: `/elevation` returns correct value for known coordinates
- Backend: `/profile` returns array matching manual MOLA sampling
- Frontend: Map click → elevation display → value matches backend

### Validation Tests (Phase 7)
- 5 known locations: compare app elevation vs published MOLA values
- Distance measurements vs independent great-circle calculation
- Slope/profile vs manual calculation on source raster

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Initial load (frontend) | < 3 s on 3G |
| Map pan/zoom response | < 100 ms |
| Layer switch | < 500 ms |
| Elevation query (backend) | < 200 ms |
| Profile (100 pts) | < 2 s |
| Bundle size (gz) | < 100 KB (core), +2 MB (Cesium lazy) |
| Memory (idle) | < 50 MB |

---

## Security Considerations

- No authentication required (public NASA data)
- Backend: Rate limit tile/elevation endpoints (e.g., 100 req/min/IP)
- CSP headers on frontend
- No user data stored
- HTTPS only in production

---

## Accessibility (WCAG 2.1 AA)

- Keyboard navigation for all map controls (Leaflet supports this)
- Sufficient contrast (dark theme with WCAG-compliant colors)
- Screen reader labels for all interactive elements
- No color-only information (patterns + labels for slope categories)
- Focus visible on all interactive elements
- Alt text for all imagery

---

## License Compliance

- **Our Code:** MIT (LICENSE)
- **Dependencies:** All MIT/BSD/Apache-2.0/ISC (see THIRD_PARTY_LICENSES.md)
- **Data:** All public domain / CC0 (see NASA_DATA_CATALOG.md)
- **Attribution:** In-app attribution bar + THIRD_PARTY_LICENSES.md

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| MOLA COG conversion fails | Low | High | Test conversion script early; fallback to planetary-dem-to-stl HTTP range approach |
| Mars Trek tiles never found | Medium | Low | Not required for Tier 1-3; MOLA hillshade sufficient |
| IAU Gazetteer search stays broken | Medium | Low | Pre-load known features; manual feature pages work |
| Backend hosting cost | Low | Low | Single small container; free tier on Fly.io/Railway |
| Bundle size creep | Medium | Medium | Enforce bundle budget in CI; lazy-load Cesium |

---

## Milestones

| Phase | Deliverable | Target |
|-------|-------------|--------|
| 1-3 | Research complete (this doc) | Done |
| 4 | Architecture approved | Current |
| 5.1 | Map + base layers + click elevation | Week 1 |
| 5.2 | Measurement tools (distance, profile, slope) | Week 2 |
| 5.3 | Feature search + geology overlay | Week 3 |
| 5.4 | Route builder + export | Week 4 |
| 5.5 | 3D view (Cesium lazy) | Week 5 (optional) |
| 6 | UI polish, accessibility, dark theme | Week 5 |
| 7 | Validation tests, docs | Week 6 |
| 8-9 | Status ledger, submission materials | Week 6-7 |