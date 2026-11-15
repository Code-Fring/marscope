# MARSCOPE

**Interactive Martian Exploration and Mission Planning System**  
Built for the NASA Space Apps Challenge 2026: *Interplanetary Survival Guide: Martian Map*

## Overview

MARSCOPE is a web-based tool for Mars surface exploration planning. It integrates real NASA/USGS data to provide:

- **Interactive Mars map** with multiple base layers (MOLA elevation, hillshade, slope)
- **Click-to-inspect** elevation sampling from MOLA DEM (463 m/pixel, ±3 m vertical accuracy)
- **Distance measurement** using Mars great-circle geometry (R = 3,396.19 km)
- **Elevation profiles** along user-drawn lines
- **Slope visualization** derived from MOLA via Horn's method
- **Named feature search** from IAU Gazetteer (15,000+ Mars features)
- **Route planner** with distance, ascent/descent, max slope (candidate routes only)
- **Dark scientific UI** optimized for accessibility and map-first workflow

## Live Demo

*Coming soon - deploy to GitHub Pages / Netlify / Vercel*

## Quick Start

### Frontend Only (Static Hosting)
```bash
npm install
npm run dev          # Development server at localhost:5173
npm run build        # Production build to dist/
```

### With Backend (MOLA Tile Server)
```bash
# 1. Prepare MOLA COG (one-time, downloads 2.1 GB)
cd backend
python scripts/prepare_mola_cog.py

# 2. Start backend
docker build -t marscope-backend .
docker run -p 8000:8000 -v $(pwd)/data:/data marscope-backend

# 3. Start frontend (in another terminal)
cd ..
npm run dev
```

The frontend will connect to `http://localhost:8000` for elevation data and tiles.

## Data Sources

| Dataset | Status | Resolution | License | Attribution |
|---------|--------|------------|---------|-------------|
| MOLA DEM 463m | **INTEGRATED** | 463 m/px | CC0 | MOLA Team; NASA GSFC; USGS Astrogeology |
| IAU Gazetteer | **INTEGRATED** | N/A | Public Domain | IAU WGPSN; USGS Astrogeology |
| HiRISE | INVESTIGATED ONLY | 0.25-0.5 m/px | Public Domain | NASA/JPL/UArizona |
| CTX | INVESTIGATED ONLY | 5-6 m/px | Public Domain | NASA/JPL/MSSS |
| THEMIS IR | INVESTIGATED ONLY | 100 m/px | Public Domain | NASA/JPL/ASU |
| USGS Geologic Maps | INVESTIGATED ONLY | Various | Public Domain | USGS Astrogeology |

**Coordinate System**: Planetocentric latitude, East-positive longitude (0-360°), Mars sphere (R = 3,396,190 m), Areoid vertical datum (GMM-2B).

**Validation Points**: Olympus Mons (+21.9 km), Valles Marineris (-5 to -7 km), Jezero Crater (-2.6 km), Hellas Basin (-7 to -8 km), Gale Crater (-4.5 km).

## Architecture

```
Frontend (Vite + Preact + TypeScript)
├── Leaflet + Proj4Leaflet (Mars CRS)
├── @preact/signals (State)
└── Custom AEQD Projection (Local mapping)

Backend (FastAPI + Rasterio + rio-tiler) - Optional
├── MOLA COG Tile Server
├── Point Elevation API
├── Profile / Slope / Route API
└── Dockerized

3D View (Lazy Loaded)
└── CesiumJS (Apache-2.0)
```

## Development

### Project Structure
```
marscope/
├── src/
│   ├── main.ts              # App entry
│   ├── constants/mars.ts    # Mars physical constants
│   ├── projections/         # AEQD, CRS definitions
│   ├── layers/              # Base, feature, geology layers
│   ├── state/               # Signals-based state
│   ├── api/client.ts        # Backend client
│   └── styles/main.css      # Dark scientific theme
├── backend/
│   ├── main.py              # FastAPI tile server
│   ├── Dockerfile
│   └── scripts/prepare_mola_cog.py
├── public/data/mars_features.json
├── package.json
└── tsconfig.json
```

### Key Commands
```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run test       # Run Vitest tests
npm run lint       # ESLint + TypeScript check
```

## Testing

### Unit Tests (Vitest)
```bash
npm run test
```
- Haversine distance against known Mars distances
- AEQD projection round-trip accuracy (< 1 mm)
- Slope calculation (Horn's method) on synthetic DEM

### Integration Tests
- Backend `/elevation` returns correct values for known coordinates
- Profile endpoint matches manual MOLA sampling

### Validation (Phase 7)
- 5 known locations vs published MOLA values
- Distance vs independent great-circle calculation
- Slope/profile vs manual raster calculation

## Deployment

### Frontend (Static)
```bash
npm run build
# Deploy dist/ to GitHub Pages, Netlify, Vercel, Cloudflare Pages
```

### Backend (Container)
```bash
docker build -t marscope-backend backend/
docker run -d -p 8000:8000 -v /host/data:/data marscope-backend
```

Set `VITE_API_BASE_URL` in frontend build to point to backend URL.

## License

**Code**: MIT License (see LICENSE)  
**Data**: All public domain / CC0 (see THIRD_PARTY_LICENSES.md)  
**Attribution**: In-app attribution bar + NASA/USGS citations per dataset

## Known Limitations

1. **MOLA DEM CORS**: Direct browser fetch blocked; requires backend proxy
2. **Mars Trek Tiles**: Endpoint pattern unknown; not used
3. **IAU Search API**: Returns 500 errors; pre-loaded features only
4. **USGS Geologic Maps**: Search interface broken (404)
5. **Route Planner**: Candidate routes only - no hazard/rock/trafficability/comms data
6. **Vertical Accuracy**: MOLA ±3 m stated; regional variations not quantified
7. **Polar Coverage**: MOLA sparse above 87°; interpolation used

## Contributing

See CONTRIBUTING.md (to be created)

## Acknowledgments

- NASA JPL Mars Trek team
- USGS Astrogeology Science Center
- IAU Working Group for Planetary System Nomenclature
- planetary-dem-to-stl project (MOLA access patterns)
- Leaflet, Proj4JS, Preact communities

## Project Status

See `docs/IMPLEMENTATION_STATUS.md` for detailed feature/dataset/dependency tracking.