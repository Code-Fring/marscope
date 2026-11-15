# Research Sources for MARSCOPE

## Primary NASA/USGS Data Sources (To Investigate)

### 1. JPL Mars Trek
- **URL:** https://trek.nasa.gov/mars/
- **Type:** Web portal with tile/WMTS services
- **Layers:** MOLA elevation, HiRISE, CTX, THEMIS, CRISM, landing sites, rover traverses, nomenclature
- **Access Method:** Tile server (XYZ/WMTS), REST API
- **Status:** INVESTIGATED ONLY (need to test actual endpoints)
- **License:** NASA public data - generally public domain, but verify
- **Priority:** HIGH - Primary base map and layer source

### 2. NASA PDS (Planetary Data System)
- **URL:** https://pds.nasa.gov/
- **Geosciences Node:** https://pds-geosciences.wustl.edu/
- **Type:** Archive of all NASA planetary mission data
- **Access Method:** HTTPS download, OPeNDAP, API
- **Status:** INVESTIGATED ONLY
- **License:** Public domain (US Government work)
- **Priority:** HIGH - Authoritative source for raw data

### 3. MOLA (Mars Orbiter Laser Altimeter) - Mars Global Surveyor
- **URL:** https://pds-geosciences.wustl.edu/missions/mgs/megdr.html
- **Product:** MEGDR (Mission Experiment Gridded Data Records)
- **Resolution:** ~460 m/pixel (128 px/deg) global; higher for polar
- **Format:** IMG (PDS), GeoTIFF conversions available
- **Coverage:** Global
- **Vertical Accuracy:** ~1-2 m relative, ~10-20 m absolute (areoid)
- **Coordinate System:** Planetocentric, east-positive longitude, areoid reference
- **Status:** INVESTIGATED ONLY
- **License:** Public domain
- **Priority:** CRITICAL - Baseline elevation for all slope/profile work

### 4. HiRISE (High Resolution Imaging Science Experiment) - MRO
- **URL:** https://www.uahirise.org/
- **PDS:** https://pds-geosciences.wustl.edu/missions/mro/hirise.html
- **Resolution:** 0.25-0.5 m/pixel
- **Coverage:** ~3% of Mars (targeted)
- **Format:** JP2, GeoTIFF
- **Products:** RDR (Reduced Data Record) - orthorectified; DTM (Digital Terrain Models) ~1m postings
- **Status:** INVESTIGATED ONLY
- **License:** Public domain
- **Priority:** HIGH - Best optical for hyperlocal mapping

### 5. CTX (Context Camera) - MRO
- **URL:** https://pds-geosciences.wustl.edu/missions/mro/ctx.html
- **Resolution:** ~5-6 m/pixel
- **Coverage:** >99% of Mars
- **Format:** PDS IMG, GeoTIFF
- **Status:** INVESTIGATED ONLY
- **License:** Public domain
- **Priority:** HIGH - Good global optical context

### 6. THEMIS (Thermal Emission Imaging System) - Mars Odyssey
- **URL:** https://themis.asu.edu/
- **PDS:** https://pds-geosciences.wustl.edu/missions/ody/themis.html
- **Products:** Day/night IR (100 m/pixel), Visible (18 m/pixel), Thermal Inertia
- **Coverage:** Global (IR), partial (VIS)
- **Status:** INVESTIGATED ONLY
- **License:** Public domain
- **Priority:** MEDIUM - Thermal inertia for surface properties, rock abundance

### 7. CRISM (Compact Reconnaissance Imaging Spectrometer for Mars) - MRO
- **URL:** https://crism.jhuapl.edu/
- **PDS:** https://pds-geosciences.wustl.edu/missions/mro/crism.html
- **Products:** Mineral maps, summary parameters (TRDR/DDR)
- **Resolution:** ~18 m/pixel (targeted), ~200 m/pixel (global mapping)
- **Status:** INVESTIGATED ONLY
- **License:** Public domain
- **Priority:** MEDIUM - Mineralogy for science targets

### 8. SHARAD (Shallow Radar) - MRO
- **URL:** https://pds-geosciences.wustl.edu/missions/mro/sharad.html
- **Products:** Subsurface reflectors, ice detection
- **Status:** INVESTIGATED ONLY
- **License:** Public domain
- **Priority:** LOW - Specialized, hard to integrate in 2D map

### 9. USGS Astrogeology - Planetary Geologic Maps
- **URL:** https://astrogeology.usgs.gov/search/map/Mars
- **Products:** Geologic maps (1:5M to 1:24K), GIS-ready (GeoPackage, shapefile)
- **Nomenclature:** https://planetarynames.wr.usgs.gov/ (IAU Gazetteer)
- **Status:** INVESTIGATED ONLY
- **License:** Public domain (US Government)
- **Priority:** HIGH - Authoritative geology and feature names

### 10. Mars Perseverance Raw Images
- **URL:** https://mars.nasa.gov/mars2020/multimedia/raw-images/
- **API:** https://api.nasa.gov/ (Mars Rover Photos API)
- **Products:** Navcam, Mastcam-Z, SuperCam, etc.
- **Status:** INVESTIGATED ONLY
- **License:** Public domain
- **Priority:** MEDIUM - Ground truth imagery for POV integration

### 11. Curiosity Raw Images
- **URL:** https://mars.nasa.gov/msl/multimedia/raw/
- **API:** NASA Mars Rover Photos API
- **Status:** INVESTIGATED ONLY
- **License:** Public domain
- **Priority:** MEDIUM

### 12. NASA Mars Rover Photos API
- **URL:** https://api.nasa.gov/
- **Endpoints:** /mars-photos/api/v1/rovers/{curiosity|opportunity|spirit|perseverance}/photos
- **Requires:** API key (free, instant)
- **Status:** INVESTIGATED ONLY
- **Priority:** MEDIUM - Programmatic access to rover imagery

## Secondary/Supplementary Sources

### 13. NASA Worldview / GIBS
- **URL:** https://worldview.earthdata.nasa.gov/
- **Note:** Earth-focused but methodology for tile services applicable
- **Status:** INVESTIGATED ONLY
- **Priority:** LOW

### 14. ESA Mars Express Data
- **HRSC:** High Resolution Stereo Camera - DTM and imagery
- **OMEGA:** Mineralogical mapping spectrometer
- **URL:** https://www.esa.int/Science_Exploration/Space_Science/Mars_Express
- **Status:** INVESTIGATED ONLY
- **License:** ESA data policy (generally open for science)
- **Priority:** LOW

### 15. OpenPlanetaryMap / Community Projects
- **URL:** https://github.com/openplanetarymap
- **Status:** INVESTIGATED ONLY
- **License:** Various (check each)
- **Priority:** LOW - Reference only

## Software Libraries to Evaluate (Phase 2)

### Mapping/Visualization
| Library | License | Language | Status |
|---------|---------|----------|--------|
| CesiumJS | Apache-2.0 | JS | INVESTIGATED ONLY |
| NASA Web WorldWind | NOSA 1.3 (check) | JS | INVESTIGATED ONLY |
| OpenLayers | BSD-2-Clause | JS | INVESTIGATED ONLY |
| Leaflet | BSD-2-Clause | JS | INVESTIGATED ONLY |
| Three.js | MIT | JS | INVESTIGATED ONLY |
| MapLibre GL | BSD-2-Clause | JS | INVESTIGATED ONLY |

### Geospatial Processing
| Library | License | Language | Status |
|---------|---------|----------|--------|
| GDAL | MIT/X11 | C++/Python | INVESTIGATED ONLY |
| Rasterio | BSD-3-Clause | Python | INVESTIGATED ONLY |
| PROJ | MIT | C/C++ | INVESTIGATED ONLY |
| PyProj | MIT | Python | INVESTIGATED ONLY |
| rasterio | BSD-3-Clause | Python | INVESTIGATED ONLY |
| rio-tiler | BSD-3-Clause | Python | INVESTIGATED ONLY |
| planetary-py | Check | Python | INVESTIGATED ONLY |

### Mars-Specific
| Library | License | Language | Status |
|---------|---------|----------|--------|
| mars.py (if exists) | Check | Python | INVESTIGATED ONLY |
| SPICE/NAIF | TSPA (check) | C/Fortran/Python | INVESTIGATED ONLY |
| pysisyphus | Check | Python | INVESTIGATED ONLY |

## Investigation Plan

### Phase 3A: Test Access to Primary Sources (Week 1)
1. Test Mars Trek tile endpoints - document exact URLs, layer names, response format
2. Test PDS download/OPeNDAP for MOLA MEGDR
3. Test HiRISE PDS access for DTMs and orthoimages
4. Test USGS geologic map downloads (GeoPackage)
5. Test IAU Gazetteer API for feature names
6. Test NASA Mars Rover Photos API

### Phase 3B: Coordinate System Verification (Week 1)
1. Verify MOLA coordinate system from PDS labels
2. Verify HiRISE coordinate system
3. Verify USGS map projections
4. Document Mars datum parameters (IAU 2015)

### Phase 3C: Data Integration Feasibility (Week 1-2)
1. Test MOLA -> slope/aspect calculation
2. Test HiRISE DTM -> high-res slope
3. Test tile overlay alignment (MOLA hillshade + HiRISE ortho)
4. Test feature name search against IAU database

## Status Tracking

| Source | Access Tested | Data Downloaded | Integrated | Notes |
|--------|--------------|-----------------|------------|-------|
| Mars Trek | ❌ | ❌ | ❌ | |
| PDS MOLA | ❌ | ❌ | ❌ | |
| HiRISE | ❌ | ❌ | ❌ | |
| CTX | ❌ | ❌ | ❌ | |
| THEMIS | ❌ | ❌ | ❌ | |
| CRISM | ❌ | ❌ | ❌ | |
| USGS Geologic | ❌ | ❌ | ❌ | |
| IAU Gazetteer | ❌ | ❌ | ❌ | |
| Rover Photos API | ❌ | ❌ | ❌ | |

**Legend:** ❌ = Not yet tested, 🔄 = In progress, ✅ = Verified accessible, ❌ = Failed/blocked