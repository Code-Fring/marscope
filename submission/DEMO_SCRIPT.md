# MARSCOPE Demo Script (Timed Walkthrough)

**Total Time**: 3 minutes  
**Format**: Live demo with narration  
**Prerequisites**: Frontend running (`npm run dev`), backend optional but recommended (`docker run...`)

---

## 0:00-0:15 — Opening & Map Overview
> "This is MARSCOPE — an interactive Mars exploration and mission planning tool built with real NASA and USGS data. The map uses a custom Mars coordinate system: planetocentric latitude, east-positive longitude zero to 360 degrees, on a 3,396-kilometer sphere. No Web Mercator, no Earth radius."

**Actions**:
- Show full Mars view at zoom 2
- Pan to Olympus Mons region (lat ~18.65, lon ~226.2)
- Zoom in to level 6-7
- **Narrate**: "All base layers use the MGS MOLA DEM at 463 meters per pixel, CC0 licensed from USGS."

---

## 0:15-0:45 — Layer Switching & Metadata
> "Three MOLA-derived layers are integrated: hillshade for terrain context, colorized elevation, and derived slope using Horn's method on the 463-meter grid. Placeholder layers for THEMIS, CTX, and HiRISE are scaffolded."

**Actions**:
- Click Layers tab (left sidebar)
- Toggle between MOLA Hillshade / Color / Slope
- Adjust Slope layer opacity slider
- Click Datasets tab
- **Narrate**: "Every layer shows source, instrument, resolution, coverage, and link to original USGS product page. All data is CC0 or public domain."

---

## 0:45-1:15 — Click-to-Inspect: Elevation & Features
> "Click anywhere to get real MOLA elevation with uncertainty, plus nearby named features from the IAU Gazetteer."

**Actions**:
- Click on Olympus Mons summit (lat ~18.65, lon ~226.2)
- Right sidebar shows:
  - Lat: 18.650000°, Lon: 226.200000° (+E 0-360) / -133.800000° (±180)
  - Elevation: ~21,900 m (Source: MGS MOLA DEM 463m, ±3m vertical, ~100m horizontal)
  - Nearby features: Olympus Mons (Mons, 624 km), etc.
- Click on Valles Marineris floor
- **Narrate**: "Elevation is sampled directly from the MOLA COG via our backend. Vertical accuracy ±3 meters per USGS. Horizontal ~100 meters. All values labeled as derived measurements."

---

## 1:15-1:45 — Feature Search & Gazetteer Metadata
> "40+ Mars features pre-loaded from the IAU Gazetteer — searchable by name."

**Actions**:
- Click Features tab (left sidebar)
- Type "Jezero" in search
- Click result → map centers on Jezero Crater (Perseverance landing site)
- Right sidebar shows: diameter 49 km, approved 2007, origin "Town in Bosnia and Herzegovina", reference
- **Narrate**: "All features from the official IAU Gazetteer, public domain. Coordinates in planetocentric, east-positive. Includes approval status, origin, and citation."

---

## 1:45-2:15 — Distance Measurement
> "Great-circle distance on the Mars sphere — not Earth radius."

**Actions**:
- Click Measure Distance tab (bottom panel)
- Click Jezero Crater (start)
- Click Olympus Mons (end)
- Panel shows: "Distance: ~3,200 km" (actual great-circle)
- **Narrate**: "Uses haversine formula on Mars sphere (R=3,396.19 km). Not Earth radius. This is the actual surface distance an astronaut would traverse."

---

## 2:15-2:45 — Elevation Profile & Slope
> "Profile samples MOLA at 100 points along the line. Slope derived via Horn's method on 3x3 neighborhood."

**Actions**:
- Click Elevation Profile tab
- Draw line from Jezero to Olympus Mons (click-drag)
- Profile chart renders (placeholder shows "Derived from MOLA 463m, slope via Horn's method")
- Click Slope tab (or show slope value in profile)
- **Narrate**: "Profile samples MOLA DEM at 100 points via backend. Slope computed via Horn's method on 3x3 grid at 463m resolution. Labeled as derived — limited by source resolution. No rock-scale hazard data."

---

## 2:45-3:00 — Route Planner & Honest Caveats
> "Candidate routes only — no hazard, rock, trafficability, comms, or illumination analysis."

**Actions**:
- Click Route Planner tab
- Shift+click to add waypoints: Jezero → Gale Crater → Olympus Mons
- Panel shows: Total distance, cumulative ascent/descent, max slope
- Highlight the yellow warning banner: "⚠ Candidate route only - no hazard/rock/trafficability/comms/illumination data"
- **Narrate**: "Every route output is explicitly labeled 'candidate route only.' No rock abundance, trafficability, illumination, or comms analysis. MOLA resolution 463m means meter-scale hazards invisible. This is for planning context only."

---

## 3:00 — Close
> "MARSCOPE is open source under MIT. All data CC0 or public domain. Code and deployment instructions at GitHub. Built for the NASA Space Apps Challenge 2026. Thank you."

**Actions**:
- Show GitHub QR code / URL
- Show MIT license badge
- Show IMPLEMENTATION_STATUS.md link for honest feature tracking

---

## Backup Talking Points (if time allows)
- "Coordinate system rigor: no Web Mercator, correct Mars sphere, planetocentric +E 0-360"
- "Backend: FastAPI + rio-tiler serves MOLA COG tiles and point queries; Dockerized for easy deploy"
- "3D view: CesiumJS lazy-loaded for optional globe perspective"
- "All code MIT, all data CC0/Public Domain — fully reproducible from clean clone"
- "IMPLEMENTATION_STATUS.md documents every feature/dataset/dependency honestly"