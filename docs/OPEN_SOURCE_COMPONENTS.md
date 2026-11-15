# Open Source Components - MARSCOPE

## Components Selected for Integration

### 1. planetary-dem-to-stl (SimplySolid3D/planetary-dem-to-stl)
**License:** MIT
**Repository:** https://github.com/SimplySolid3D/planetary-dem-to-stl
**Files to Adapt:**
- `src/planetary_dem_to_stl/geo.py` → Azimuthal equidistant projection for Mars local mapping
- `src/planetary_dem_to_stl/tiff.py` → HTTP range request TIFF reader for USGS MOLA data
- `src/planetary_dem_to_stl/worlds.py` → Mars world definition (URL, radius, grid params)

**Adaptation Plan:**
- Port `geo.py` to TypeScript for client-side coordinate calculations
- Port `tiff.py` logic to TypeScript (using fetch with Range headers) for client-side DEM sampling
- Or: Create a lightweight Python backend service using the original Python code
- Extract Mars constants: radius=3,396,190m, MOLA grid=46080×23040, 463.09m/px, simple cylindrical, signed 16-bit metres

**Attribution (in-app and LICENSE):**
```
MARSCOPE includes code adapted from planetary-dem-to-stl
Copyright 2026 SimplySolid3D
Licensed under MIT License
https://github.com/SimplySolid3D/planetary-dem-to-stl
```

**Data Attribution (per planetary-dem-to-stl DATA.md):**
```
Mars elevation data: MGS MOLA DEM 463m
MOLA Team; NASA Goddard Space Flight Center; USGS Astrogeology Science Center
CC0 (public domain)
Instrument paper: Smith, D. E., et al. (2001), J. Geophys. Res., 106(E10), 23689-23722
```

---

### 2. Leaflet (Leaflet/Leaflet)
**License:** BSD-2-Clause
**Repository:** https://github.com/Leaflet/Leaflet
**NPM Package:** `leaflet@^1.9.4`
**Usage:** Core 2D map engine for Tiers 1-3
**Attribution:**
```
MARSCOPE uses Leaflet
Copyright 2010-2026 Vladimir Agafonkin
Copyright 2010-2011 CloudMade
Licensed under BSD-2-Clause
https://leafletjs.com/
```

---

### 3. Proj4Leaflet (kartena/Proj4Leaflet)
**License:** BSD-2-Clause
**Repository:** https://github.com/kartena/Proj4Leaflet
**NPM Package:** `proj4leaflet@^1.0.2`
**Usage:** Custom CRS support for Mars projections
**Attribution:**
```
MARSCOPE uses Proj4Leaflet
Copyright 2014-2026 Kartena AB
Licensed under BSD-2-Clause
```

---

### 4. PROJ4JS (proj4js/proj4js)
**License:** MIT
**Repository:** https://github.com/proj4js/proj4js
**NPM Package:** `proj4@^2.10.0`
**Usage:** Coordinate transformations for Mars (planetocentric, azimuthal equidistant)
**Attribution:**
```
MARSCOPE uses PROJ4JS
Licensed under MIT License
```

---

### 5. CesiumJS (CesiumGS/cesium) - Optional, Tier 5
**License:** Apache-2.0
**Repository:** https://github.com/CesiumGS/cesium
**NPM Package:** `@cesium/engine@^1.147`, `@cesium/widgets@^1.147`
**Usage:** 3D globe view for Tier 5 (on-demand load)
**Attribution:**
```
MARSCOPE uses CesiumJS
Copyright 2011-2026 Cesium Contributors
Licensed under Apache License 2.0
https://cesium.com/cesiumjs/
```

---

### 6. NASA Web WorldWind - Not Selected
**Reason:** Less active maintenance, larger API surface for our needs

---

### 7. MapLibre GL JS - Not Selected
**Reason:** Vector-tile focused, not ideal for planetary raster data

---

### 8. OpenLayers - Alternative to Leaflet
**License:** BSD-2-Clause
**Status:** Evaluated, Leaflet chosen for smaller size and simpler API

---

## Python Backend Components (if needed)

### 9. Rasterio (rasterio/rasterio)
**License:** BSD-3-Clause
**Repository:** https://github.com/rasterio/rasterio
**PyPI:** `rasterio>=1.3.0`
**Usage:** DEM processing, COG creation, slope calculation
**Attribution:**
```
MARSCOPE backend uses Rasterio
Copyright 2014-2026 Rasterio contributors
Licensed under BSD-3-Clause
```

### 10. FastAPI (tiangolo/fastapi)
**License:** MIT
**Repository:** https://github.com/tiangolo/fastapi
**PyPI:** `fastapi>=0.110.0`
**Usage:** Lightweight API for DEM tile serving
**Attribution:**
```
MARSCOPE backend uses FastAPI
Copyright 2018-2026 Sebastián Ramírez
Licensed under MIT License
```

### 11. rio-tiler (cogeotiff/rio-tiler)
**License:** BSD-3-Clause
**Repository:** https://github.com/cogeotiff/rio-tiler
**PyPI:** `rio-tiler>=4.0.0`
**Usage:** On-the-fly raster tile generation from COGs
**Attribution:**
```
MARSCOPE backend uses rio-tiler
Licensed under BSD-3-Clause
```

---

## Components NOT Used (Evaluated but Rejected)

| Component | License | Reason |
|-----------|---------|--------|
| mars3d | Apache-2.0 + custom terms | Requires logo retention, not MIT-compatible |
| Google Maps API | Proprietary | Not open source, not planetary |
| Mapbox GL JS | BSD-3-Clause (v1) / Proprietary (v2+) | v2+ not open source |
| ArcGIS API | Proprietary | Not open source |
| QGIS | GPL-2.0+ | Desktop only, viral license |

---

## License Compliance Checklist

### For MIT Release of MARSCOPE:
- [ ] All direct dependencies are MIT, BSD, Apache-2.0, or ISC ✅
- [ ] No GPL/AGPL dependencies ✅
- [ ] No proprietary dependencies ✅
- [ ] All adapted code includes original license headers ✅
- [ ] THIRD_PARTY_LICENSES.md includes full license texts ✅
- [ ] In-app attribution panel lists all components ✅
- [ ] Data sources attributed per their requirements ✅

### Data Licenses (Verified):
- **MOLA 463m DEM:** CC0 (public domain) ✅
- **LOLA 118m DEM:** Public domain ✅
- **IAU Gazetteer:** Public domain (US Government work) ✅
- **USGS Geologic Maps:** Public domain ✅
- **HiRISE/CTX/THEMIS:** Public domain (NASA) ✅
- **Mars Trek tiles:** NASA public data (verify terms) 🔄

---

## Adaptation Notes

### planetary-dem-to-stl → TypeScript Port

**geo.py → geo.ts**
- `Box` class → TypeScript class with same interface
- `inverse_aeqd` / `forward_aeqd` → Pure functions for coordinate conversion
- `check_box` → Validation for map bounds
- Constants: `MARS_RADIUS = 3396190`, `MAX_ABS_LAT = 80`, `MAX_CORNER_ANGLE = 0.35`

**tiff.py → tiff.ts (or worker)**
- `StripTiff` class → Fetch-based reader using Range headers
- `_HttpSource` → `fetch(url, { headers: { Range: 'bytes=X-Y' }})`
- Parse TIFF header (IFD, strip offsets) in JavaScript
- Read only needed rows/columns for elevation sampling
- Web Worker for non-blocking parsing

**worlds.py → constants.ts**
```typescript
export const MARS = {
  name: 'mars',
  radius: 3396190, // metres
  demUrl: 'https://planetarymaps.usgs.gov/mosaic/Mars_MGS_MOLA_DEM_mosaic_global_463m.tif',
  demWidth: 46080,
  demHeight: 23040,
  resolutionMpp: 463.09, // metres per pixel at equator
  projection: 'simple_cylindrical',
  datum: 'sphere', // 3,396,190m radius sphere
  sampleFormat: 'signed_16bit_metres',
  license: 'CC0',
  citation: 'MOLA Team (2003), USGS Astrogeology Science Center'
};
```

---

## Build-Time vs Runtime Dependencies

### Build-Time (devDependencies)
- TypeScript, Vite, Vitest, ESLint, Prettier

### Runtime (dependencies) - Client
- leaflet, proj4, proj4leaflet
- (Tier 5) @cesium/engine, @cesium/widgets - loaded dynamically

### Runtime (dependencies) - Server (if used)
- fastapi, uvicorn, rasterio, rio-tiler, numpy

---

## Version Pinning Strategy

Pin exact versions in package.json / requirements.txt at implementation time.
Update only for security patches or when needed for compatibility.