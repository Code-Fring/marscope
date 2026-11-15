# NASA Data Catalog - MARSCOPE

## Data Source Status Summary

| Dataset | Status | Access Verified | License | Notes |
|---------|--------|-----------------|---------|-------|
| MOLA DEM 463m | INVESTIGATED ONLY | ✅ Product page | CC0 | Direct TIFF URL tested - CORS blocks browser fetch |
| HiRISE | INVESTIGATED ONLY | ❌ | Public Domain | Not tested |
| CTX | INVESTIGATED ONLY | ❌ | Public Domain | Not tested |
| THEMIS | INVESTIGATED ONLY | ❌ | Public Domain | Not tested |
| CRISM | INVESTIGATED ONLY | ❌ | Public Domain | Not tested |
| IAU Gazetteer | INVESTIGATED ONLY | ✅ Feature pages | Public Domain | Mars features accessible |
| Mars Trek Tiles | INVESTIGATED ONLY | ❌ | NASA Public Data | 404/timeout |
| USGS Geologic Maps | INVESTIGATED ONLY | ❌ | Public Domain | Search 404 |
| Rover Photos API | INVESTIGATED ONLY | ❌ | Public Domain | Not tested |

---

## Verified Data Sources

### 1. MGS MOLA DEM 463m (Mars Global Surveyor - Mars Orbiter Laser Altimeter)

**Product Page:** https://astrogeology.usgs.gov/search/map/mars_mgs_mola_dem_463m
**Access Date:** 2026-11-15
**Status:** INVESTIGATED ONLY (product page verified, direct TIFF fetch blocked by CORS)

**Data Specifications (from USGS product page):**
- **Format:** GeoTIFF (strip-organized, uncompressed, single-band, 16-bit signed metres)
- **Grid:** 46,080 × 23,040 pixels
- **Resolution:** 463.0835744 m/pixel at equator (128 px/degree)
- **Projection:** Simple Cylindrical (Equirectangular)
- **Latitude:** Planetocentric (-90 to +90)
- **Longitude:** Positive East (-180 to +180)
- **Datum:** Sphere, radius = 3,396,190 m (IAU 2000)
- **Vertical Reference:** Areoid (GMM-2B gravity field, degree/order 50)
- **Vertical Accuracy:** ±3 m (areoid error ±1.8 m + regional uncertainties)
- **Horizontal Accuracy:** ~100 m
- **Coverage:** Global (polar gaps filled from PDS polar releases)
- **Data Period:** 1999-2001 (600+ million measurements)

**Download URL:** https://planetarymaps.usgs.gov/mosaic/Mars_MGS_MOLA_DEM_mosaic_global_463m.tif (redirects to S3, 2.1 GB)

**Access Test Results:**
- Product page: ✅ Accessible (2026-11-15)
- Direct TIFF HEAD request: ❌ CORS blocked from browser
- HTTP Range request test: ❌ CORS blocked from browser
- **Note:** The planetary-dem-to-stl project successfully uses HTTP range requests to this URL from Python (server-side). Client-side browser fetch blocked by CORS policy.

**License:** CC0 (Public Domain) - "Access Constraints: CC0 (public domain)", "Use Constraints: None"

**Required Attribution:**
```
Mars elevation data: MGS MOLA DEM 463m
MOLA Team; NASA Goddard Space Flight Center; USGS Astrogeology Science Center
Instrument paper: Smith, D. E., et al. (2001), J. Geophys. Res., 106(E10), 23689-23722
```

**Integration Approach:** 
- Server-side proxy or Python backend (planetary-dem-to-stl pattern) for on-demand tile serving
- Or: Convert to Cloud-Optimized GeoTIFF (COG) and serve via rio-tiler
- Client-side: Use planetary-dem-to-stl's tiff.py logic via Web Worker if CORS resolved

---

### 2. IAU Gazetteer of Planetary Nomenclature (Mars Features)

**Base URL:** https://planetarynames.wr.usgs.gov/
**Access Date:** 2026-11-15
**Status:** INVESTIGATED ONLY (individual feature pages verified)

**Verified Mars Features (for validation):**

| Feature | Feature ID | Target | Coordinates (Planetocentric, +East 0-360) | Diameter | Notes |
|---------|-----------|--------|-------------------------------------------|----------|-------|
| Aeolis Mons (Mount Sharp) | 15000 | Mars | -5.08°, 137.85° | 88.99 km | Curiosity landing site region |
| Aeolis Palus | 15001 | Mars | -4.47°, 137.42° | 111.63 km | Adjacent to Aeolis Mons |
| Scandia Colles | 5356 | Mars | 66.15°, 222.80° | 1365 km | Northern polar region |
| Scandia Tholi | 5357 | Mars | 73.82°, 198.00° | 480 km | Northern polar region |

**Feature Page Pattern:** https://planetarynames.wr.usgs.gov/Feature/{ID}

**Coordinate System (from feature pages):**
- Latitude: Planetocentric
- Longitude: Positive East, 0-360° (also displayed as -180 to +180)
- Control Network: MDIM 2.1 (Mars Digital Image Mosaic 2.1)

**Required Attribution:**
```
Gazetteer of Planetary Nomenclature
International Astronomical Union (IAU) Working Group for Planetary System Nomenclature
USGS Astrogeology Science Center
Supported by NASA under Interagency Agreement
```

**Search/Advanced Search:** Returns 500 Internal Server Error (as of 2026-11-15)

**Integration Approach:**
- Pre-fetch known feature list for search autocomplete
- Use feature pages for detail popups
- Coordinate conversion: Gazetteer uses planetocentric +East 0-360

---

### 3. Mars Trek (JPL)

**URL:** https://trek.nasa.gov/mars/
**Access Date:** 2026-11-15
**Status:** INVESTIGATED ONLY (site loads but times out in browser automation)

**Layers Available (from challenge Resources tab):**
- MOLA elevation
- HiRISE imagery
- CTX imagery
- THEMIS thermal
- CRISM spectral
- Landing sites
- Rover traverses
- Nomenclature

**Tile Service Investigation:**
- Tested: https://trek.nasa.gov/tiles/Mars_MGS_MOLA_DEM_463m/{z}/{x}/{y}.png → 404
- Tested: https://trek.nasa.gov/tiles/Mars_MGS_MOLA_DEM_463m/1/0/0.png → 404
- **Note:** Mars Trek likely uses different tile path pattern or WMTS

**License:** NASA public data (verify terms of service)

**Integration Approach:**
- If tile endpoints discovered: Use as base layers in Leaflet
- Fallback: Use MOLA DEM directly via custom tile service

---

### 4. USGS Planetary Geologic Maps

**Search URL:** https://astrogeology.usgs.gov/search/map/Mars
**Access Date:** 2026-11-15
**Status:** INVESTIGATED ONLY (search returns 404)

**Available Products (from catalog page):**
- Mars THEMIS-Derived Global Thermal Inertia Mosaic
- Mars 2020 Jezero Crater Landing Site Products
- Global geologic maps (various scales)

**Integration Approach:**
- Download GeoPackage/Shapefile from USGS when accessible
- Serve as vector tile layer or GeoJSON

---

### 5. NASA Mars Rover Photos API

**Base URL:** https://api.nasa.gov/mars-photos/api/v1/rovers/
**Access Date:** Not yet tested
**Status:** INVESTIGATED ONLY
**Requires:** Free API key (instant registration at api.nasa.gov)

**Endpoints:**
- `/rovers/curiosity/photos`
- `/rovers/perseverance/photos`
- `/rovers/opportunity/photos`
- `/rovers/spirit/photos`

**Integration Approach:**
- Fetch POV images for landing site regions
- Display as clickable thumbnails in location detail panel

---

## Coordinate System Reference (MARS)

All MARSCOPE coordinate handling MUST use:

| Parameter | Value | Source |
|-----------|-------|--------|
| **Planet Radius** | 3,396,190 m | IAU 2000 / MOLA product page |
| **Datum** | Sphere (not ellipsoid) | MOLA product: "Radius A = 3396190, Radius C = 3396190" |
| **Latitude Type** | Planetocentric | MOLA product, IAU standard |
| **Longitude Direction** | Positive East (0-360°) | MOLA product, IAU standard |
| **Vertical Reference** | Areoid (GMM-2B) | MOLA product page |
| **Projection (Global)** | Simple Cylindrical (Equirectangular) | MOLA product page |
| **Projection (Local)** | Azimuthal Equidistant | planetary-dem-to-stl geo.py |

**Critical Implementation Notes:**
- ❌ NEVER use Earth radius (6,371 km) for distance calculations
- ❌ NEVER use Web Mercator (EPSG:3857) for Mars
- ✅ Use Haversine/Vincenty on Mars sphere (R=3,396,190m)
- ✅ Azimuthal equidistant for local mapping (planetary-dem-to-stl geo.py)
- ✅ Display coordinate system in UI: "Planetocentric, East-positive, Mars sphere (3396.19 km)"

---

## Validation Points (For Phase 7 Testing)

| Location | Published Elevation | Published Coordinates | Source |
|----------|-------------------|----------------------|--------|
| Olympus Mons summit | ~21.9 km | 18.65°N, 226.2°E (133.8°W) | MOLA / IAU |
| Valles Marineris floor | ~-5 to -7 km | ~7°S, 285°E | MOLA |
| Jezero Crater (Perseverance) | ~-2.6 km | 18.4°N, 77.5°E | MOLA / Perseverance |
| Hellas Basin floor | ~-7 to -8 km | 42°S, 70°E | MOLA |
| Gale Crater (Curiosity) | ~-4.5 km | 4.5°S, 137.4°E | MOLA / Curiosity |
| Aeolis Mons (Mount Sharp) | ~5.5 km | -5.08°, 137.85°E | IAU Gazetteer (ID 15000) |

**Test Method:** Query app elevation at these coordinates, compare to published values, report differences honestly.

---

## Known Limitations & Risks

1. **MOLA DEM CORS:** Direct browser fetch blocked. Requires backend proxy or COG conversion.
2. **Mars Trek Tiles:** Endpoint pattern unknown; site slow/unstable in automation.
3. **IAU Search API:** Returns 500 errors; only individual feature pages work.
4. **USGS Geologic Maps:** Search interface broken (404).
5. **HiRISE/CTX/CRISM:** Large datasets; need COG conversion or tile service for web use.
6. **Vertical Accuracy:** MOLA ±3 m stated; regional variations not quantified.
7. **Polar Coverage:** MOLA sparse above 87°; interpolation used in gaps.

---

## Next Steps for Integration

1. **Immediate:** Set up Python backend (FastAPI + rasterio/rio-tiler) to serve MOLA tiles from local COG
2. **Immediate:** Convert MOLA GeoTIFF to Cloud-Optimized GeoTIFF (COG) using gdal_translate
3. **Immediate:** Pre-load IAU Gazetteer Mars features (scrape feature pages for known IDs)
4. **Phase 3:** Test HiRISE/CTX tile services from Mars Trek or PDS
5. **Phase 3:** Test rover photos API for POV integration