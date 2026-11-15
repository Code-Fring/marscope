# GitHub Research - Mars/Planetary Visualization Projects

## Search Strategy
Searched GitHub for repositories related to:
- Mars visualization (webgl, threejs, cesium)
- Planetary mapping (openlayers, leaflet, maplibre)
- DEM handling (MOLA, LOLA)
- Terrain analysis (slope, elevation profiles)
- Route planning on rasters
- Planetary nomenclature (IAU Gazetteer)

## Evaluated Repositories

### 1. planetary-dem-to-stl (SimplySolid3D/planetary-dem-to-stl)
- **URL:** https://github.com/SimplySolid3D/planetary-dem-to-stl
- **License:** MIT ✅
- **Last Commit:** Oct 16, 2026 (very recent)
- **Language:** Python
- **Description:** Downloads MOLA/LOLA DEM data from USGS via HTTP range requests, converts to STL for 3D printing
- **Key Reusable Components:**
  - `tiff.py` - Custom TIFF reader for uncompressed strip-organized GeoTIFFs (local + HTTP range requests)
  - `geo.py` - Azimuthal equidistant projection for Mars/Moon (sphere radius 3,396,190m for Mars)
  - `worlds.py` - World definitions with USGS URLs, grid parameters, sphere radii
  - Direct USGS S3 URLs for MOLA (2.1 GB) and LOLA (8.5 GB) GeoTIFFs
- **Data Sources Documented:** MOLA 463m (CC0), LOLA 118m (public domain)
- **Relevance:** HIGH - Core DEM access, coordinate handling, projection code directly applicable
- **Attribution Required:** MIT license preserved, cite MOLA/LOLA teams and USGS

### 2. MARSIGHT (lokeshLmp/MARSIGHT)
- **URL:** https://github.com/lokeshLmp/MARSIGHT
- **License:** MIT ✅
- **Last Commit:** Nov 13, 2026 (very recent)
- **Language:** Python
- **Description:** "AI-powered planetary terrain intelligence and mission planning platform" - but only 3 commits, minimal code
- **Relevance:** LOW - Concept only, no substantial implementation yet
- **Note:** Same problem space, could reference for requirements

### 3. MarsJS (KonscienceGit/MarsJS)
- **URL:** https://github.com/KonscienceGit/MarsJS
- **License:** Not visible (need to check)
- **Last Commit:** Oct 24, 2022
- **Language:** JavaScript
- **Description:** "JavaScript/WebGL 3D accurate Mars visualization"
- **Relevance:** MEDIUM - Check license and implementation details

### 4. mars-mola-webgl (alainrichardt/mars-mola-webgl)
- **URL:** https://github.com/alainrichardt/mars-mola-webgl
- **License:** Not visible
- **Last Commit:** Mar 10, 2013 (very old)
- **Language:** JavaScript
- **Description:** Blog post code for visualizing MOLA with three.js
- **Relevance:** LOW - Old, likely outdated patterns

### 5. mars3d (marsgis/mars3d)
- **URL:** https://github.com/marsgis/mars3d
- **License:** Apache 2.0 + custom attribution terms ⚠️
- **Last Commit:** Nov 1, 2026
- **Language:** JavaScript/TypeScript (Cesium-based)
- **Description:** Full 3D GIS platform based on Cesium
- **License Issue:** Community free edition requires keeping Mars3D logo and F12 console attribution - NOT compatible with MIT release of our code
- **Relevance:** HIGH for patterns, LOW for direct use due to license
- **Action:** Use CesiumJS directly (Apache 2.0) instead

### 6. CesiumJS (CesiumGS/cesium)
- **URL:** https://github.com/CesiumGS/cesium
- **License:** Apache 2.0 ✅
- **Last Commit:** Nov 13, 2026 (active)
- **Stars:** 15.9k
- **Description:** 3D globes and maps, WebGL, supports custom terrain/imagery providers
- **Mars Support:** Can use custom ellipsoid (Mars radius), custom imagery/terrain providers
- **Relevance:** HIGH - Production-grade 3D globe, permissive license
- **Consideration:** Large bundle (~2MB gzipped), 3D-focused

### 7. OpenLayers (openlayers/openlayers)
- **URL:** https://github.com/openlayers/openlayers
- **License:** BSD-2-Clause ✅
- **Last Commit:** Nov 13, 2026 (active)
- **Stars:** 12.7k
- **Description:** High-performance 2D mapping library
- **Planetary Support:** Custom projections via Proj4JS, custom tile sources
- **Relevance:** HIGH - Lightweight (~150KB gzipped), 2D-first, excellent for map-centric app
- **Mars Support:** Need to define custom projection (equirectangular on Mars sphere)

### 8. Leaflet (Leaflet/Leaflet)
- **URL:** https://github.com/Leaflet/Leaflet
- **License:** BSD-2-Clause ✅
- **Last Commit:** Nov 14, 2026 (active)
- **Stars:** 45.9k
- **Description:** Lightweight interactive maps (~40KB gzipped)
- **Planetary Support:** Proj4Leaflet plugin for custom projections, custom CRS
- **Relevance:** HIGH - Simplest 2D option, huge plugin ecosystem
- **Mars Support:** CRS.Simple or custom projection via Proj4Leaflet

### 9. MapLibre GL JS (maplibre/maplibre-gl-js)
- **URL:** https://github.com/maplibre/maplibre-gl-js
- **License:** BSD-3-Clause ✅
- **Last Commit:** Nov 14, 2026 (active)
- **Stars:** 12.1k
- **Description:** Vector tile maps, WebGL-accelerated
- **Planetary Support:** Custom projections limited, better for Web Mercator
- **Relevance:** MEDIUM - Vector tiles not primary need for Mars raster data

### 10. NASA Web WorldWind (NASAWorldWind/WebWorldWind)
- **URL:** https://github.com/NASAWorldWind/WebWorldWind
- **License:** Apache 2.0 ✅
- **Last Commit:** Sep 20, 2025
- **Stars:** 1.0k
- **Description:** NASA's own 3D globe SDK
- **Mars Support:** Designed for Earth, but extensible to other planets
- **Relevance:** MEDIUM - NASA heritage, but less active than Cesium

## Python Geospatial Libraries

### 11. GDAL (OSGeo/gdal)
- **License:** MIT/X11 ✅
- **Description:** Geospatial data abstraction library
- **Relevance:** HIGH for backend processing, not for browser

### 12. Rasterio (rasterio/rasterio)
- **License:** BSD-3-Clause ✅
- **Description:** Python wrapper for GDAL, clean API
- **Relevance:** HIGH for backend DEM processing

### 13. planetary-dem-to-stl (already covered) - includes custom TIFF reader avoiding GDAL dependency

### 14. rio-tiler (cogeotiff/rio-tiler)
- **License:** BSD-3-Clause ✅
- **Description:** Fast raster tile server for COGs
- **Relevance:** MEDIUM - If we convert MOLA to COG

### 15. PROJ / pyproj (OSGeo/proj, pyproj/pyproj)
- **License:** MIT ✅
- **Description:** Cartographic projections and coordinate transformations
- **Relevance:** HIGH - Essential for Mars coordinate system handling

## Rejected / Incompatible

| Project | Reason |
|---------|--------|
| mars3d | Custom license requires logo retention, not MIT-compatible |
| Mars Trek (NASA) | Not open source, service only |
| Google Earth Engine | Proprietary |
| ArcGIS | Proprietary |
| QGIS | GPL (desktop only) |

## Recommended Stack for MARSCOPE

### Option A: 2D-First (Recommended for Tier 1-3)
**Frontend:** Leaflet + Proj4Leaflet + custom Mars CRS
- Smallest bundle (~50KB with Proj4)
- Simple API, huge plugin ecosystem
- Custom CRS.Simple or azimuthal equidistant for local areas
- TileLayer for NASA/USGS tile services

**Backend (optional):** Python (FastAPI) + Rasterio + rio-tiler for on-demand DEM tiles
- Or: Client-side only using planetary-dem-to-stl's tiff.py approach via HTTP range requests

### Option B: 3D-Capable (If Tier 5 needed)
**Frontend:** CesiumJS with custom Mars ellipsoid
- Native 3D terrain, globe view
- Custom imagery/terrain providers for NASA data
- Larger bundle (~2MB)

### Option C: Hybrid
- Leaflet for 2D map (Tiers 1-3)
- CesiumJS loaded on-demand for 3D view (Tier 5)

## Key Code to Adapt from planetary-dem-to-stl

1. **geo.py** - Azimuthal equidistant projection (already Mars-ready with 3,396,190m radius)
2. **tiff.py** - HTTP range request TIFF reader (works with USGS S3 URLs directly)
3. **worlds.py** - Data source definitions with exact URLs and grid parameters

## Mars Data URLs (Verified from planetary-dem-to-stl DATA.md)

| Dataset | URL | Size | Format | License |
|---------|-----|------|--------|---------|
| MOLA 463m | https://planetarymaps.usgs.gov/mosaic/Mars_MGS_MOLA_DEM_mosaic_global_463m.tif | 2.1 GB | GeoTIFF (strip, uncompressed) | CC0 |
| LOLA 118m | https://planetarymaps.usgs.gov/mosaic/Lunar_LRO_LOLA_Global_LDEM_118m_Mar2014.tif | 8.5 GB | GeoTIFF (strip, uncompressed) | Public Domain |

## Next Steps for Phase 3
1. Test HTTP range requests to MOLA URL
2. Test Mars Trek tile endpoints
3. Test IAU Gazetteer search API (if any)
4. Test USGS geologic map downloads
5. Verify coordinate system parameters against PDS labels