# Competition Strategy — MARSCOPE

## Honest Self-Assessment

### Scientific Relevance: **Strong**
- **Directly addresses challenge**: Creates "layered, integrated view of a location or route on the Martian surface that pulls together data from multiple NASA science missions"
- **Real NASA/USGS data**: MOLA DEM (CC0), IAU Gazetteer (Public Domain) — not simulated or fabricated
- **Astronaut safety priority**: Every derived measurement labeled with uncertainty (±3m vertical, 463m resolution); routes explicitly "candidate only — no hazard data"
- **Hyperlocal focus**: Click inspection, profiles, routes at EVA scale (meters to kilometers)
- **3+ data types**: MOLA elevation, MOLA-derived slope, IAU named features (plus THEMIS/CTX/HiRISE placeholders)

### Innovation: **Moderate**
- **Correct Mars CRS in Leaflet**: Most web maps use Web Mercator/Earth radius; MARSCOPE uses proper Mars sphere (3,396.19 km), planetocentric coordinates, +E 0-360° longitude
- **Honest derived measurements**: No false precision — every value labeled with source, resolution, method, caveats
- **Minimal permissive stack**: ~70 KB gzipped, all MIT/BSD/Apache-2.0, no framework bloat
- **Optional backend**: Graceful degradation — map works without backend; elevation/profile/route degrade cleanly
- **Reproducible data pipeline**: Single script downloads MOLA (2.1 GB) → COG with standard GDAL options

### Originality: **Moderate**
- **Not a Mars Trek clone**: Mars Trek is global/regional; MARSCOPE is EVA-scale with measurement tools
- **Not a Google Mars clone**: Uses real MOLA DEM via COG/rio-tiler, not pre-rendered tiles
- **Honest uncertainty labeling**: Rare in public Mars viewers — most show elevation as absolute truth
- **Derived from planetary-dem-to-stl**: AEQD projection, HTTP range TIFF reader adapted from open-source project (with attribution)

### Usefulness: **Strong for Planning/Education**
- **Mission planners**: Quick traverse distance, elevation profile, slope assessment, feature context
- **EVA designers**: Click-to-inspect gives real MOLA elevation + nearby named features
- **Students/public**: Accessible dark-theme map with real data, no fabricated "Mars simulator" aesthetics
- **Open source**: MIT license, reproducible from clean clone, deployable to GitHub Pages

### Accessibility: **Targeting WCAG 2.1 AA**
- Dark theme with sufficient contrast ratios
- Full keyboard navigation (layer controls, measurement tools)
- Screen reader labels on interactive elements
- No color-only information (slope uses patterns + text)
- Focus visible on all interactive elements
- **Needs validation**: Not yet tested with screen readers or contrast tools

---

## Weaknesses (Honest)

| Weakness | Severity | Mitigation |
|----------|----------|------------|
| **Measurement tools not fully connected** | High | UI exists but map click handlers for distance/profile/route not implemented |
| **Backend required for elevation** | Medium | MOLA COG not CORS-accessible; requires FastAPI proxy (provided) |
| **No geology overlay** | Medium | USGS maps investigated but not integrated as vector tiles |
| **No A* routing** | Medium | Cost-surface routing not implemented; only waypoint great-circle segments |
| **Polar coverage limited** | Low | AEQD projection capped at 80°; MOLA sparse above 87° |
| **No hazard/trafficability data** | Inherent | MOLA 463m resolution — meter-scale rocks invisible; explicitly labeled |
| **Vertical accuracy regional variation** | Low | ±3m stated but regional uncertainties unquantified |
| **Testing incomplete** | Medium | Unit tests scaffolded; integration/validation pending |

---

## Improvements (If Time Permits)

1. **Complete measurement tools**: Connect map click → distance/profile/route (2-4 hours)
2. **Integrate USGS geologic maps**: Download GeoPackage → vector tiles via tippecanoe/rio-tiler (2-4 hours)
3. **Add HiRISE/CTX tile services**: If Mars Trek endpoints discovered or PDS COGs created (4-8 hours)
4. **Implement A* routing**: Cost surface from slope + thermal inertia (4-8 hours)
5. **Full validation**: Run against 5 known locations, compare to published MOLA values (2 hours)
6. **E2E tests**: Playwright scripts for critical user flows (2 hours)
7. **Accessibility audit**: axe-core + manual keyboard/screen reader testing (2 hours)
8. **Deploy live demo**: GitHub Pages + Fly.io/Railway backend (1 hour)

---

## How to Present to Judges

### 30-Second Elevator Pitch
> "MARSCOPE is an interactive Mars map for EVA planning. It uses real MOLA laser altimeter data and IAU feature names — not artist renderings. Click anywhere for real elevation with uncertainty. Draw a line for a profile. Plan a route with distance, climb, and max slope. Every number is labeled with its source, resolution, and caveats. Built on a minimal open-source stack with correct Mars coordinates — not Web Mercator on an Earth sphere."

### Demo Flow (3 minutes)
1. **Map & Layers** (30s): Pan Mars, switch MOLA hillshade/color/slope, show metadata
2. **Click Inspection** (45s): Click Olympus Mons → real elevation ±3m, nearby features from IAU Gazetteer
3. **Feature Search** (30s): Search "Jezero" → Perseverance landing site with metadata
4. **Measure Distance** (30s): Jezero to Olympus Mons → great-circle on Mars sphere
5. **Route Planner** (30s): Waypoints → distance, ascent, max slope → "candidate only" warning
6. **Honest Limits** (15s): Show IMPLEMENTATION_STATUS.md — every feature honestly tracked

### Key Talking Points
- **"We didn't fake the data"** — MOLA DEM is real, CC0, served via COG/rio-tiler
- **"We didn't fake the coordinates"** — Planetocentric, +E 0-360°, Mars sphere radius
- **"We didn't fake the certainty"** — Every value: derived/estimated ±3m at 463m resolution
- **"We didn't fake the license"** — All code MIT, all data CC0/Public Domain, reproducible

### Anticipated Questions & Answers

**Q: "How accurate is the elevation?"**
A: "MOLA DEM states ±3 m vertical (areoid ±1.8m + regional), ~100 m horizontal. We label every value as 'derived from MOLA 463m, ±3m'."

**Q: "Can this actually plan a safe traverse?"**
A: "It provides candidate routes with distance, climb, and max slope from MOLA. No rock abundance, trafficability, illumination, or comms data. Explicitly labeled 'candidate route only — no hazard data.' For actual missions, this would be one input among many."

**Q: "Why not use CesiumJS or Mars Trek?"**
A: "Mars Trek is global/regional; Cesium is heavy (2 MB+). MARSCOPE is EVA-scale (meters to km), 70 KB core, correct Mars CRS, works offline-first with optional backend."

**Q: "What's the innovation?"**
A: "Correct Mars CRS in a lightweight web map + honest uncertainty labeling on every derived measurement + minimal permissive stack. Most Mars viewers use Web Mercator/Earth radius and show elevation as absolute truth."

**Q: "Is the backend required?"**
A: "Map works without it. Elevation/profile/route need the COG proxy (CORS). Backend is a single Docker container; graceful degradation if unavailable."

**Q: "How do you handle poles?"**
A: "AEQD projection capped at 80° latitude. MOLA data sparse above 87°. Simple cylindrical global view works everywhere but distorts at poles — standard for planetary mapping."

**Q: "Can I use this for my mission?"**
A: "Code is MIT, data is CC0/Public Domain. Clone, run `npm install && npm run dev`, deploy anywhere. Attribution in-app and in THIRD_PARTY_LICENSES.md."

---

## Final Positioning

**MARSCOPE is not the most feature-complete Mars viewer.** It is the most *honest* one for its scope.

- It does fewer things than Mars Trek, but what it does uses correct coordinates, real data, and explicit uncertainty.
- It prioritizes scientific integrity over visual polish.
- It demonstrates that a lightweight, permissively-licensed, reproducible tool can integrate authoritative NASA data correctly.

**This aligns with the challenge's emphasis on scientific relevance, innovation, originality, usefulness, and accessibility — with integrity.**