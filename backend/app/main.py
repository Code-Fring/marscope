"""
MARSCOPE Backend - MOLA DEM Tile Server & Planetary Science API
"""

import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.config import settings
from app.dependencies import set_cog_reader
from app.routers import elevation, climate, survival, mission, library, datasets


# Global COG reader
cog_reader = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global cog_reader
    # Startup
    if os.path.exists(settings.mola_cog_path):
        from rio_tiler.io import COGReader

        cog_reader = COGReader(settings.mola_cog_path)
        print(f"Loaded MOLA COG: {settings.mola_cog_path}")
        # Set in elevation module
        from app.routers import elevation

        elevation.set_cog_reader(cog_reader)
    else:
        print(f"WARNING: MOLA COG not found at {settings.mola_cog_path}")
        print("Elevation endpoints will return 503")
    yield
    # Shutdown
    if cog_reader:
        cog_reader.close()


app = FastAPI(
    title=settings.app_name,
    description="MARSCOPE Backend - MOLA DEM Tile Server & Planetary Science API",
    version=settings.app_version,
    lifespan=lifespan,
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=settings.allow_credentials,
    allow_methods=settings.allowed_methods,
    allow_headers=settings.allowed_headers,
)

# Include routers
app.include_router(elevation.router)
app.include_router(climate.router)
app.include_router(survival.router)
app.include_router(mission.router)
app.include_router(library.router)
app.include_router(datasets.router)


# Root endpoint
@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "description": "MARSCOPE Backend - MOLA DEM Tile Server & Planetary Science API",
        "endpoints": {
            "elevation": "/elevation",
            "climate": "/climate",
            "survival": "/survival",
            "mission": "/mission",
            "library": "/library",
            "datasets": "/datasets",
            "health": "/elevation/health",
        },
    }


@app.get("/api/info")
async def api_info():
    """API information and capabilities."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "mars_radius_m": 3_396_190,
        "mola_resolution_mpp": 463.0835744,
        "coordinate_system": "Planetocentric, +East 0-360°",
        "vertical_datum": "Areoid (GMM-2B)",
        "integrated_datasets": [
            "MOLA DEM 463m (COG)",
            "IAU Gazetteer",
            "NASA NTRS",
            "OpenAlex",
        ],
        "available_endpoints": {
            "elevation": [
                "GET /elevation/health",
                "GET /elevation/point?lat={}&lon={}",
                "GET /elevation/profile?coords=lat1,lon1;lat2,lon2&samples=100",
                "GET /elevation/slope?lat={}&lon={}",
                "GET /elevation/route?coords=lat1,lon1;lat2,lon2&samples=50",
                "GET /elevation/tiles/mola_hillshade/{z}/{x}/{y}.png",
                "GET /elevation/tiles/mola_color/{z}/{x}/{y}.png",
                "GET /elevation/tiles/mola_slope/{z}/{x}/{y}.png",
            ],
            "climate": [
                "GET /climate/weather?lat={}&lon={}&start={}&end={}",
                "GET /climate/normals?lat={}&lon={}",
                "GET /climate/dust-storms?lat={}&lon={}",
                "GET /climate/solar-illumination?lat={}&lon={}&date={}",
            ],
            "survival": [
                "GET /survival/assessment?lat={}&lon={}",
                "GET /survival/compare?locations=lat1,lon1;lat2,lon2",
            ],
            "mission": [
                "POST /mission/analyze-site",
                "GET /mission/candidates",
                "POST /mission/plan",
                "GET /mission/site/{site_id}",
            ],
            "library": [
                "GET /library/search?q={}&category={}&source={}",
                "GET /library/{resource_id}",
                "GET /library/stats",
                "GET /library/categories",
                "GET /library/sources",
            ],
            "datasets": [
                "GET /datasets",
                "GET /datasets/{dataset_id}",
                "GET /datasets/integrated",
                "GET /datasets/by-source/{source}",
                "GET /datasets/by-mission/{mission}",
            ],
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
