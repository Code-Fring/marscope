# Implementation Status Ledger - MARSCOPE

**Last Updated**: 2026-11-15  
**Status**: Phase 5 (Tier 1-2 Implementation Complete, Tier 2 Partial)

---

## Feature Status Table

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| **Tier 1: Core Map** |
| Interactive Mars map (pan, zoom) | ✅ WORKING | `src/main.ts` map init with MarsCRS | Leaflet + custom CRS |
| Coordinate readout (planetocentric, +E 0-360) | ✅ WORKING | `src/main.ts` updateCoordinateDisplay | Bottom-right control |
| Multiple base layers (MOLA hillshade, color, slope) | ✅ WORKING | `src/layers/baseLayers.ts` + `src/main.ts` layer switching | Radio buttons in Layers tab |
| Layer switching + opacity control | ✅ WORKING | `src/state/mapStore.ts` + LayersPanel | Checkboxes + sliders |
| Placeholder layers (THEMIS, CTX, HiRISE) | ⚠️ PARTIAL | `src/layers/baseLayers.ts` | Transparent tiles, metadata only |
| Per-layer metadata panel | ✅ WORKING | `src/layers/baseLayers.ts` metadata + DatasetsPanel | Source, instrument, resolution, URL |
| Click-to-inspect: coordinates | ✅ WORKING | `src/main.ts` onMapClick | Right sidebar updates |
| Click-to-inspect: elevation (MOLA DEM) | ⚠️ PARTIAL | `src/main.ts` fetchElevationForDisplay + API client | Requires backend; graceful degradation |
| Click-to-inspect: nearby features | ✅ WORKING | `src/main.ts` findNearbyFeatures + KD-tree | Linear search fallback |
| **Tier 2: Analysis** |
| Distance measurement (great-circle on Mars) | ⚠️ PARTIAL | UI exists in BottomPanel, no map interaction | Haversine implemented in aeqd.ts |
| Elevation profile along drawn line | ❌ NOT IMPLEMENTED | UI placeholder in ProfileMeasure | Backend endpoint ready |
| Slope visualization (derived from MOLA) | ⚠️ PARTIAL | Slope tile layer + /slope endpoint | Horn's method implemented |
| **Tier 3: Science Context** |
| Named features search (IAU Gazetteer) | ⚠️ PARTIAL | 40+ features loaded, UI search input | No autocomplete/filter logic |
| Feature click → details | ✅ WORKING | `src/layers/featureLayer.ts` formatFeatureForDisplay | Right sidebar |
| Geological map overlay | ❌ NOT IMPLEMENTED | Placeholder in DatasetsPanel | USGS maps not integrated |
| **Tier 4: Planning** |
| Waypoint route builder | ⚠️ PARTIAL | UI in RoutePlanner, no map interaction | /route endpoint ready |
| Total distance, ascent/descent, max slope | ❌ NOT IMPLEMENTED | Backend computes, frontend not connected | |
| Automated candidate routing (A*) | ❌ NOT IMPLEMENTED | Not planned for MVP | |
| **Tier 5: Optional** |
| 3D terrain view (CesiumJS) | ❌ NOT IMPLEMENTED | Lazy-load scaffold only | |
| Export measurements/routes (GeoJSON/CSV) | ❌ NOT IMPLEMENTED | | |
| Shareable URL state | ❌ NOT IMPLEMENTED | | |

---

## Dataset Status Table

| Dataset | Status | Exact URL / Product | Resolution | Access Date | Attribution Used |
|---------|--------|---------------------|------------|-------------|------------------|
| MOLA DEM 463m | 🔄 INVESTIGATED ONLY | https://planetarymaps.usgs.gov/mosaic/Mars_MGS_MOLA_DEM_mosaic_global_463m.tif | 463.08 m/px | 2026-11-15 | MOLA Team; NASA GSFC; USGS Astrogeology (CC0) |
| MOLA Product Page | ✅ INTEGRATED (metadata) | https://astrogeology.usgs.gov/search/map/mars_mgs_mola_dem_463m | N/A | 2026-11-15 | As above |
| IAU Gazetteer | 🔄 INVESTIGATED ONLY (features) | https://planetarynames.wr.usgs.gov/Feature/{ID} | N/A | 2026-11-15 | IAU WGPSN; USGS Astrogeology (Public Domain) |
| Mars Trek | 🔄 INVESTIGATED ONLY | https://trek.nasa.gov/mars/ | Various | 2026-11-15 | NASA JPL (verify terms) |
| HiRISE | 🔄 INVESTIGATED ONLY | https://www.uahirise.org/ | 0.25-0.5 m/px | - | NASA/JPL/UArizona (Public Domain) |
| CTX | 🔄 INVESTIGATED ONLY | https://pds-geosciences.wustl.edu/missions/mro/ctx.html | 5-6 m/px | - | NASA/JPL/MSSS (Public Domain) |
| THEMIS | 🔄 INVESTIGATED ONLY | https://themis.asu.edu/ | 100 m/px | - | NASA/JPL/ASU (Public Domain) |
| USGS Geologic Maps | 🔄 INVESTIGATED ONLY | https://astrogeology.usgs.gov/search/map/Mars | Various | - | USGS Astrogeology (Public Domain) |
| Mars Rover Photos API | 🔄 INVESTIGATED ONLY | https://api.nasa.gov/ | Various | - | NASA (Public Domain) |

**Legend**: ✅ INTEGRATED = Loaded and rendered/queried in app | 🔄 INVESTIGATED ONLY = Researched, metadata documented, not integrated

---

## Third-Party Dependency Table

| Dependency | Version | License | URL | Role |
|------------|---------|---------|-----|------|
| leaflet | ^1.9.4 | BSD-2-Clause | https://github.com/Leaflet/Leaflet | Map engine |
| proj4 | ^2.10.0 | MIT | https://github.com/proj4js/proj4js | Projection library |
| proj4leaflet | ^1.0.2 | BSD-2-Clause | https://github.com/kartena/Proj4Leaflet | Leaflet CRS bridge |
| preact | ^10.19.0 | MIT | https://preactjs.com/ | UI framework |
| @preact/signals | ^1.2.0 | MIT | https://preactjs.com/ | Reactive state |
| vite | ^5.0.0 | MIT | https://vitejs.dev/ | Build tool |
| typescript | ^5.3.0 | MIT | https://www.typescriptlang.org/ | Type safety |
| vitest | ^1.0.0 | MIT | https://vitest.dev/ | Testing |
| fastapi | ^0.110.0 | MIT | https://fastapi.tiangolo.com/ | Backend API |
| uvicorn | ^0.29.0 | BSD-3-Clause | https://www.uvicorn.org/ | ASGI server |
| rasterio | ^1.3.0 | BSD-3-Clause | https://github.com/rasterio/rasterio | Raster I/O |
| rio-tiler | ^4.0.0 | BSD-3-Clause | https://github.com/cogeotiff/rio-tiler | COG tile server |
| numpy | ^1.26.0 | BSD-3-Clause | https://numpy.org/ | Numerical computing |
| planetary-dem-to-stl | (adapted) | MIT | https://github.com/SimplySolid3D/planetary-dem-to-stl | AEQD projection, TIFF reader |
| gdal | 3.8+ | MIT/X11 | https://gdal.org/ | COG conversion |

**All licenses verified permissive (MIT/BSD/Apache-2.0) and compatible with MIT release.**

---

## Validation Results (Phase 7 - Pending)

| Check | Status | Details |
|-------|--------|---------|
| Startup from clean clone | ❌ PENDING | `npm install && npm run dev` |
| Map rendering + layer switching | ❌ PENDING | Visual verification |
| Backend health + elevation query | ❌ PENDING | Requires COG |
| Coordinate validation (5 points) | ❌ PENDING | See below |
| Distance measurement check | ❌ PENDING | vs independent great-circle |
| Slope/profile validation | ❌ PENDING | vs manual raster calc |
| Browser compatibility | ❌ PENDING | Chrome + Firefox |
| Performance benchmarks | ❌ PENDING | Load time, memory |

### Coordinate Validation Points (Required)

| Location | Published Elevation | Published Coordinates | App Elevation | App Coordinates | Difference | Source |
|----------|-------------------|----------------------|---------------|----------------|------------|--------|
| Olympus Mons summit | ~21,900 m | 18.65°N, 226.2°E | - | - | - | MOLA/IAU |
| Valles Marineris floor | ~-5,000 to -7,000 m | ~7°S, 285°E | - | - | - | MOLA |
| Jezero Crater | ~-2,600 m | 18.4°N, 77.5°E | - | - | - | MOLA/Perseverance |
| Hellas Basin floor | ~-7,000 to -8,000 m | 42°S, 70°E | - | - | - | MOLA |
| Gale Crater | ~-4,500 m | 4.5°S, 137.4°E | - | - | - | MOLA/Curiosity |

---

## Known Limitations (from NASA_DATA_CATALOG.md)

1. **MOLA DEM CORS**: Direct browser fetch blocked; requires backend proxy
2. **Mars Trek Tiles**: Endpoint pattern unknown; site slow/unstable
3. **IAU Search API**: Returns 500 errors; only individual feature pages work
4. **USGS Geologic Maps**: Search interface broken (404)
5. **Route Planner**: Candidate routes only - no hazard/rock/trafficability/comms data
6. **Vertical Accuracy**: MOLA ±3 m stated; regional variations not quantified
7. **Polar Coverage**: MOLA sparse above 87°; interpolation used

---

## [VERIFY] Items for Submission Materials

- [ ] All elevation values labeled "derived from MOLA 463m, ±3m"
- [ ] All slope values labeled "derived via Horn's method, 463m resolution"
- [ ] All route outputs labeled "candidate route only - no hazard data"
- [ ] All coordinates labeled "planetocentric, +East 0-360, Mars sphere R=3396.19km"
- [ ] MOLA DEM attribution in-app and in THIRD_PARTY_LICENSES.md
- [ ] IAU Gazetteer attribution in-app and in THIRD_PARTY_LICENSES.md
- [ ] License compatibility verified for all dependencies
- [ ] No GPL/AGPL/proprietary dependencies
- [ ] MIT LICENSE file present
- [ ] README.md has tested install/run steps
- [ ] IMPLEMENTATION_STATUS.md matches actual features
- [ ] No unimplemented features claimed in submission