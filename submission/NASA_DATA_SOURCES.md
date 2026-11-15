# NASA Data Sources — MARSCOPE

## Integrated Data Sources (Loaded and Rendered/Queried in App)

### 1. MGS MOLA DEM 463m (Mars Global Surveyor — Mars Orbiter Laser Altimeter)
- **Status**: INTEGRATED (metadata + backend tile serving)
- **Product Page**: https://astrogeology.usgs.gov/search/map/mars_mgs_mola_dem_463m
- **Download URL**: https://planetarymaps.usgs.gov/mosaic/Mars_MGS_MOLA_DEM_mosaic_global_463m.tif (redirects to S3, 2.1 GB)
- **Resolution**: 463.0835744 m/pixel at equator (128 px/degree)
- **Grid**: 46,080 × 23,040 pixels
- **Projection**: Simple Cylindrical (Equirectangular)
- **Coordinate System**: Planetocentric latitude, East-positive longitude (0-360°)
- **Datum**: Sphere, radius 3,396,190 m (IAU 2000)
- **Vertical Reference**: Areoid (GMM-2B gravity field, degree/order 50)
- **Vertical Accuracy**: ±3 m (areoid ±1.8 m + regional uncertainties)
- **Horizontal Accuracy**: ~100 m
- **Data Period**: 1999-2001 (600+ million measurements)
- **License**: CC0 (Public Domain)
- **Citation**: MOLA Team (2003), Mars MGS MOLA DEM 463m, USGS Astrogeology Science Center. Smith, D. E., et al. (2001), J. Geophys. Res., 106(E10), 23689-23722.
- **Access Verified**: Product page accessible 2026-11-15; direct TIFF fetch blocked by CORS; server-side fetch works (per planetary-dem-to-stl)
- **Integration**: Converted to COG via `gdal_translate`; served via rio-tiler backend; hillshade/color/slope tiles + point elevation/profile/slope/route APIs

### 2. IAU Gazetteer of Planetary Nomenclature (Mars Features)
- **Status**: INTEGRATED (40+ features pre-loaded)
- **Base URL**: https://planetarynames.wr.usgs.gov/
- **Feature Pages**: https://planetarynames.wr.usgs.gov/Feature/{ID}
- **Features Loaded**: 40+ Mars features (Aeolis Mons, Valles Marineris, Jezero Crater, Hellas Planitia, Gale Crater, Olympus Mons, etc.)
- **Fields**: Name, clean name, target, type, coordinates (planetocentric, +E 0-360), diameter, approval status/date, origin, reference, quad
- **Coordinate System**: Planetocentric, +East 0-360°, MDIM 2.1 control network
- **License**: Public Domain (US Government work)
- **Citation**: Gazetteer of Planetary Nomenclature, IAU WGPSN, USGS Astrogeology Science Center, NASA Interagency Agreement
- **Access Verified**: Individual feature pages accessible 2026-11-15; Search/Advanced Search returns 500 errors
- **Integration**: Pre-loaded JSON (`public/data/mars_features.json`); KD-tree nearest-neighbor search; map markers; click → details panel

---

## Investigated Only (Researched, Metadata Documented, Not Integrated)

### 3. HiRISE (High Resolution Imaging Science Experiment — MRO)
- **Product Page**: https://www.uahirise.org/ / https://pds-geosciences.wustl.edu/missions/mro/hirise.html
- **Resolution**: 0.25-0.5 m/pixel (targeted)
- **Coverage**: ~3% of Mars
- **Format**: JP2, GeoTIFF (RDR orthorectified), DTM (~1m postings)
- **License**: Public Domain (NASA/JPL/UArizona)
- **Potential Use**: High-res orthoimagery for landing site context, meter-scale hazard mapping
- **Access**: PDS download, USGS Astrogeology
- **Status**: Placeholder layer scaffolded in baseLayers.ts

### 4. CTX (Context Camera — MRO)
- **Product Page**: https://pds-geosciences.wustl.edu/missions/mro/ctx.html
- **Resolution**: ~5-6 m/pixel
- **Coverage**: >99% of Mars
- **Format**: PDS IMG, GeoTIFF
- **License**: Public Domain
- **Potential Use**: Global context imagery, regional geomorphology
- **Access**: PDS download, USGS Astrogeology
- **Status**: Placeholder layer scaffolded

### 5. THEMIS (Thermal Emission Imaging System — Mars Odyssey)
- **Product Page**: https://themis.asu.edu/ / https://pds-geosciences.wustl.edu/missions/ody/themis.html
- **Products**: Day IR (100 m/px, global), Night IR (100 m/px, global), Visible (18 m/px, partial), Thermal Inertia
- **License**: Public Domain
- **Potential Use**: Surface properties (rock abundance, thermal inertia), day/night temperature context
- **Access**: ASU THEMIS portal, USGS Astrogeology
- **Status**: Day/Night IR placeholder layers scaffolded

### 6. CRISM (Compact Reconnaissance Imaging Spectrometer for Mars — MRO)
- **Product Page**: https://crism.jhuapl.edu/ / https://pds-geosciences.wustl.edu/missions/mro/crism.html
- **Resolution**: ~18 m/px (targeted), ~200 m/px (global mapping)
- **Products**: Mineral maps, summary parameters (TRDR/DDR)
- **License**: Public Domain
- **Potential Use**: Mineralogy for science targets (hydrated minerals, carbonates)
- **Access**: PDS Geosciences Node
- **Status**: Not integrated

### 7. SHARAD (Shallow Radar — MRO)
- **Product Page**: https://pds-geosciences.wustl.edu/missions/mro/sharad.html
- **Products**: Subsurface reflectors, ice detection
- **License**: Public Domain
- **Potential Use**: Subsurface water ice detection for resource planning
- **Access**: PDS Geosciences Node
- **Status**: Not integrated

### 8. USGS Planetary Geologic Maps
- **Product Page**: https://astrogeology.usgs.gov/search/map/Mars
- **Products**: Geologic maps (1:5M to 1:24K), GIS-ready (GeoPackage, Shapefile)
- **License**: Public Domain (US Government)
- **Potential Use**: Stratigraphic context, unit boundaries for traverse planning
- **Access**: USGS Astrogeology cartographic catalog
- **Status**: Search page returns 404 (2026-11-15); investigated only

### 9. NASA Mars Rover Photos API
- **Base URL**: https://api.nasa.gov/mars-photos/api/v1/rovers/{curiosity|perseverance|spirit|opportunity}/photos
- **Requires**: Free API key (instant at api.nasa.gov)
- **Products**: Navcam, Mastcam-Z, SuperCam, Hazcam, etc. raw images
- **License**: Public Domain
- **Potential Use**: Ground-truth POV imagery for feature inspection, rover traverse context
- **Status**: Not integrated

### 10. Mars Trek (JPL)
- **URL**: https://trek.nasa.gov/mars/
- **Layers**: MOLA elevation, HiRISE, CTX, THEMIS, CRISM, landing sites, rover traverses, nomenclature
- **Tile Services**: WMTS/XYZ endpoints (pattern not discovered)
- **Status**: Site loads but times out in automation; tile endpoint pattern unknown (tested `/tiles/Mars_MGS_MOLA_DEM_463m/{z}/{x}/{y}.png` → 404)
- **License**: NASA public data (verify terms)
- **Status**: Investigated only; fallback to MOLA COG

---

## Coordinate System Conventions (Mars)

| Parameter | Convention | Source |
|-----------|------------|--------|
| **Datum** | Mars sphere, radius 3,396,190 m | IAU 2000 / MOLA product |
| **Latitude** | Planetocentric (-90° to +90°) | MOLA product, IAU standard |
| **Longitude** | East-positive (0-360°) | MOLA product, IAU standard |
| **Vertical Datum** | Areoid (GMM-2B, degree/order 50) | MOLA product page |
| **Projection (Global)** | Simple Cylindrical (Equirectangular) | MOLA product page |
| **Projection (Local)** | Azimuthal Equidistant | planetary-dem-to-stl geo.py |
| **Radius for Distance** | 3,396,190 m (Mars) | **NOT Earth radius (6,371 km)** |

---

## Attribution Requirements (Per Source)

### MOLA DEM 463m
> Mars elevation data: MGS MOLA DEM 463m  
> MOLA Team; NASA Goddard Space Flight Center; USGS Astrogeology Science Center  
> CC0 (public domain)  
> Instrument paper: Smith, D. E., et al. (2001), J. Geophys. Res., 106(E10), 23689-23722.

### IAU Gazetteer
> Gazetteer of Planetary Nomenclature  
> International Astronomical Union (IAU) Working Group for Planetary System Nomenclature  
> USGS Astrogeology Science Center  
> Supported by NASA under Interagency Agreement

### HiRISE / CTX / THEMIS / CRISM / SHARAD
> NASA/JPL/UArizona (HiRISE), NASA/JPL/MSSS (CTX), NASA/JPL/ASU (THEMIS), NASA/JPL/JHUAPL (CRISM), NASA/JPL (SHARAD)  
> Public Domain (NASA/US Government work)

### USGS Geologic Maps
> USGS Astrogeology Science Center  
> Public Domain (US Government work)

---

## Data Not Used (Explicitly Excluded)

- **Mars HRSC/MOLA Blended DEM (200m)**: Contains HRSC (CC BY-SA 3.0 IGO) — share-alike would propagate conditions
- **Proprietary/Commercial Data**: None used
- **GPL/AGPL Licensed Code**: None used (all dependencies MIT/BSD/Apache-2.0)
- **Unverified Claims**: No elevation values, hazard assessments, or route safety ratings presented as ground truth