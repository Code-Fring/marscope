# Other Resources — MARSCOPE

## Software Libraries & Frameworks

| Resource | Version | License | URL | Role in MARSCOPE |
|----------|---------|---------|-----|------------------|
| **Preact** | 10.19+ | MIT | https://preactjs.com/ | Lightweight UI framework (3 KB alternative to React) |
| **@preact/signals** | 1.2+ | MIT | https://preactjs.com/ | Fine-grained reactive state management |
| **Leaflet** | 1.9+ | BSD-2-Clause | https://leafletjs.com/ | Core 2D map engine |
| **Proj4Leaflet** | 1.0+ | BSD-2-Clause | https://github.com/kartena/Proj4Leaflet | Leaflet CRS bridge for custom projections |
| **PROJ4JS** | 2.10+ | MIT | https://github.com/proj4js/proj4js | Cartographic projection library |
| **Vite** | 5.0+ | MIT | https://vitejs.dev/ | Build tool, dev server, bundler |
| **TypeScript** | 5.3+ | MIT | https://www.typescriptlang.org/ | Static type checking |
| **Vitest** | 1.0+ | MIT | https://vitest.dev/ | Unit testing framework |
| **ESLint** | 8.55+ | MIT | https://eslint.org/ | Code linting |
| **@typescript-eslint** | 6.15+ | MIT | https://typescript-eslint.io/ | TypeScript-specific linting |

## Backend Stack

| Resource | Version | License | URL | Role |
|----------|---------|---------|-----|------|
| **FastAPI** | 0.110+ | MIT | https://fastapi.tiangolo.com/ | High-performance async API framework |
| **Uvicorn** | 0.29+ | BSD-3-Clause | https://www.uvicorn.org/ | ASGI server for FastAPI |
| **Rasterio** | 1.3+ | BSD-3-Clause | https://github.com/rasterio/rasterio | Geospatial raster I/O (GDAL wrapper) |
| **rio-tiler** | 4.0+ | BSD-3-Clause | https://github.com/cogeotiff/rio-tiler | Cloud-Optimized GeoTIFF tile server |
| **NumPy** | 1.26+ | BSD-3-Clause | https://numpy.org/ | Numerical computing for slope/profile calculations |
| **Pydantic** | 2.7+ | MIT | https://docs.pydantic.dev/ | Data validation & API schemas |

## Data Processing Tools

| Resource | Version | License | URL | Role |
|----------|---------|---------|-----|------|
| **GDAL** | 3.8+ | MIT/X11 | https://gdal.org/ | Geospatial data translation (COG conversion) |
| **gdal_translate** | 3.8+ | MIT/X11 | https://gdal.org/ | Convert GeoTIFF → Cloud-Optimized GeoTIFF (COG) |
| **planetary-dem-to-stl** | 2026-10 | MIT | https://github.com/SimplySolid3D/planetary-dem-to-stl | Reference implementation: AEQD projection, HTTP range TIFF reader, MOLA/LOLA metadata |

## NASA & USGS Data Portals

| Resource | URL | Purpose |
|----------|-----|---------|
| **NASA Space Apps Challenge** | https://www.spaceappschallenge.org/2026/challenges/interplanetary-survival-guide-martian-map/ | Challenge description, resources, submission |
| **JPL Mars Trek** | https://trek.nasa.gov/mars/ | Interactive Mars map with NASA layers |
| **NASA PDS** | https://pds.nasa.gov/ | Planetary Data System archive |
| **PDS Geosciences Node** | https://pds-geosciences.wustl.edu/ | Mars mission data (MGS, MRO, Odyssey, etc.) |
| **MOLA DEM Product** | https://astrogeology.usgs.gov/search/map/mars_mgs_mola_dem_463m | MOLA DEM metadata & download |
| **MOLA DEM Download** | https://planetarymaps.usgs.gov/mosaic/Mars_MGS_MOLA_DEM_mosaic_global_463m.tif | Direct GeoTIFF (2.1 GB, S3) |
| **HiRISE** | https://www.uahirise.org/ / https://pds-geosciences.wustl.edu/missions/mro/hirise.html | High-res imagery & DTMs |
| **CTX** | https://pds-geosciences.wustl.edu/missions/mro/ctx.html | Context Camera global mosaic |
| **THEMIS** | https://themis.asu.edu/ / https://pds-geosciences.wustl.edu/missions/ody/themis.html | Thermal IR & visible imagery |
| **CRISM** | https://crism.jhuapl.edu/ / https://pds-geosciences.wustl.edu/missions/mro/crism.html | Mineralogical mapping |
| **SHARAD** | https://pds-geosciences.wustl.edu/missions/mro/sharad.html | Subsurface radar |
| **IAU Gazetteer** | https://planetarynames.wr.usgs.gov/ | Official planetary feature names |
| **USGS Astrogeology** | https://astrogeology.usgs.gov/ | Planetary cartography, geologic maps |
| **NASA Mars Rover Photos API** | https://api.nasa.gov/ | Curiosity/Perseverance raw images |

## Reference Implementations & Inspiration

| Project | URL | License | Relevance |
|---------|-----|---------|-----------|
| **planetary-dem-to-stl** | https://github.com/SimplySolid3D/planetary-dem-to-stl | MIT | MOLA/LOLA HTTP range TIFF reader, AEQD projection, MOLA metadata |
| **CesiumJS** | https://github.com/CesiumGS/cesium | Apache-2.0 | 3D globe reference; custom ellipsoid support |
| **OpenLayers** | https://github.com/openlayers/openlayers | BSD-2-Clause | Alternative 2D map engine |
| **NASA Web WorldWind** | https://github.com/NASAWorldWind/WebWorldWind | Apache-2.0 | NASA's own 3D globe SDK |
| **Mars3D** | https://github.com/marsgis/mars3d | Apache-2.0 + custom | Cesium-based Mars platform (custom terms) |
| **MARSIGHT** | https://github.com/lokeshLmp/MARSIGHT | MIT | Similar problem space (very early) |

## Development Tools

| Tool | URL | Purpose |
|------|-----|---------|
| **OpenCode** | https://opencode.ai | AI coding agent (primary development environment) |
| **agent-browser** | MCP server | Web research, page scraping, interaction |
| **nuxt** | MCP server | Nuxt/Vue documentation (reference) |
| **Git** | https://git-scm.com/ | Version control |
| **Docker** | https://docker.com | Backend containerization |
| **VS Code** | https://code.visualstudio.com/ | IDE (recommended) |

## Documentation & Standards

| Resource | URL | Purpose |
|----------|-----|---------|
| **IAU 2000 Mars Constants** | https://www.iau.org/ | Mars radius, rotation, coordinate standards |
| **MOLA Product Page** | https://astrogeology.usgs.gov/search/map/mars_mgs_mola_dem_463m | DEM specifications |
| **planetarynames.wr.usgs.gov** | https://planetarynames.wr.usgs.gov/ | Feature nomenclature |
| **GDAL COG Documentation** | https://gdal.org/drivers/raster/cog.html | Cloud-Optimized GeoTIFF format |
| **rio-tiler Documentation** | https://cogeotiff.github.io/rio-tiler/ | Dynamic tile serving from COG |
| **Leaflet CRS Tutorial** | https://leafletjs.com/examples/crs-simple/crs-simple.html | Custom coordinate systems |
| **PROJ4JS Documentation** | https://proj4js.org/ | Coordinate transformations |

## Credit & Attribution

All third-party code used under permissive licenses (MIT, BSD-2-Clause, BSD-3-Clause, Apache-2.0). Full license texts in `THIRD_PARTY_LICENSES.md`.

All NASA/USGS data used is public domain or CC0. Attribution per source requirements in `NASA_DATA_SOURCES.md` and in-app attribution bar.

Planetary-dem-to-stl code adapted under MIT license with attribution in `src/projections/aeqd.ts` and `OPEN_SOURCE_COMPONENTS.md`.

**No GPL, AGPL, LGPL, or proprietary code used.**