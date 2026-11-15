# MARSCOPE Presentation Outline (7 Slides Max)

## Slide 1: Title
**MARSCOPE: Interactive Martian Exploration & Mission Planning System**
NASA Space Apps Challenge 2026 — *Interplanetary Survival Guide: Martian Map*
Team: [Team Name]
*Interactive demo: [URL] | Source: [GitHub URL] | License: MIT*

---

## Slide 2: The Problem
**Astronauts on Mars need hyperlocal, multi-layer maps for EVA planning**
- Current tools (Mars Trek, Google Mars) are global/regional, not EVA-scale
- No single interface combines elevation, slope, features, and route planning with real NASA data
- Safety-critical: astronauts need derived measurements with explicit uncertainty, not just pretty pictures
- *Challenge asks for: 3+ data types layered, hyperlocal focus, astronaut safety priority*

---

## Slide 3: Our Solution — MARSCOPE
**A map-first web app integrating real NASA/USGS data for EVA planning**
- **Map**: Leaflet + custom Mars CRS (planetocentric, +E 0-360, R=3,396.19 km)
- **Data**: MOLA DEM 463m (CC0), IAU Gazetteer (Public Domain), optional THEMIS/CTX/HiRISE
- **Layers**: MOLA hillshade, colorized elevation, derived slope (Horn's method)
- **Tools**: Click elevation (±3m), great-circle distance (Mars radius), elevation profiles, slope, feature search, candidate routes
- **Honesty**: Every value labeled "derived", "±3m", "463m resolution", "candidate route only"

---

## Slide 4: Live Demo Walkthrough
1. **Map & Layers** — Pan/zoom Mars, switch MOLA hillshade/color/slope, opacity control
2. **Click to Inspect** — Click anywhere: coordinates (planetocentric +E 0-360), elevation from MOLA (±3m), nearby named features
3. **Feature Search** — Search "Olympus Mons" → centers map, shows metadata (diameter, approval, origin)
4. **Measure Distance** — Click two points → great-circle distance on Mars sphere (R=3,396.19 km)
5. **Elevation Profile** — Draw line → elevation sampled from MOLA at 100 points, labeled "derived, 463m resolution"
6. **Route Planner** — Add waypoints → total distance, ascent/descent, max slope, labeled "candidate route only"

---

## Slide 5: Scientific Data Integration
| Dataset | Status | Resolution | License | Use in MARSCOPE |
|---------|--------|------------|---------|-----------------|
| MOLA DEM 463m | **Integrated** | 463 m/px | CC0 | Elevation, hillshade, slope, profiles |
| IAU Gazetteer | **Integrated** | N/A | Public Domain | 40+ features, search, metadata |
| HiRISE | Investigated | 0.25-0.5 m/px | Public Domain | Placeholder layer |
| CTX | Investigated | 5-6 m/px | Public Domain | Placeholder layer |
| THEMIS IR | Investigated | 100 m/px | Public Domain | Placeholder layer |
| USGS Geologic | Investigated | Various | Public Domain | Placeholder layer |

**Coordinate rigor**: Planetocentric, east-positive 0-360°, Mars sphere (3,396.19 km), Areoid (GMM-2B). No Web Mercator, no Earth radius.

---

## Slide 6: Technical Architecture
- **Frontend**: Preact + TypeScript + Vite (~70 KB gzipped)
  - Leaflet + Proj4Leaflet: Custom Mars CRS (simple cylindrical + azimuthal equidistant)
  - @preact/signals: Reactive state (map, layers, measurements, routes)
  - Azimuthal equidistant projection (ported from planetary-dem-to-stl) for local accuracy
- **Backend (Optional)**: FastAPI + rio-tiler + rasterio
  - Serves MOLA COG tiles, point elevation, profiles, slope, routes
  - Dockerized, single container, runs locally or cloud
- **3D View (Tier 5)**: CesiumJS lazy-loaded, custom Mars ellipsoid
- **Licenses**: All MIT/BSD/Apache-2.0; code MIT, data CC0/Public Domain

---

## Slide 7: Impact, Honesty, Future
**What works today**: Map, layers, click elevation, features, coordinates — all with real data
**What's scaffolded**: Distance, profile, slope, route — UI ready, backend endpoints live
**Honest limits**: No hazard/rock/trafficability/comms/illumination data; routes are *candidates only*; MOLA ±3m vertical, 463m resolution
**Next steps**: Complete measurement map interactions, add unit tests, validate against 5 known locations, deploy
**Open source**: MIT license, all data public domain, reproducible from clean clone
**Built for**: NASA Space Apps 2026 — *Interplanetary Survival Guide: Martian Map*