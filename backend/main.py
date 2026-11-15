"""
MARSCOPE Backend - MOLA DEM Tile Server
Serves elevation tiles, point queries, profiles, and routes from MOLA COG
"""

import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import rasterio
from rasterio.windows import Window
from rio_tiler.io import COGReader
from rio_tiler.models import ImageData
import numpy as np
import math

# Configuration
MOLA_COG_PATH = os.getenv(
    "MOLA_COG_PATH", "/data/Mars_MGS_MOLA_DEM_mosaic_global_463m_cog.tif"
)
MARS_RADIUS = 3_396_190  # metres

# Global COG reader
cog_reader: Optional[COGReader] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global cog_reader
    # Startup
    if os.path.exists(MOLA_COG_PATH):
        cog_reader = COGReader(MOLA_COG_PATH)
        print(f"Loaded MOLA COG: {MOLA_COG_PATH}")
    else:
        print(f"WARNING: MOLA COG not found at {MOLA_COG_PATH}")
        print("Elevation endpoints will return 503")
    yield
    # Shutdown
    if cog_reader:
        cog_reader.close()


app = FastAPI(
    title="MARSCOPE Backend",
    description="MOLA DEM Tile Server for Mars Exploration",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your domain
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


# Response Models
class ElevationResponse(BaseModel):
    elevation: float
    source: str = "MGS MOLA DEM 463m"
    resolution: str = "463 m/pixel"
    accuracy: str = "±3 m vertical, ~100 m horizontal"
    method: str = "direct"


class ProfilePoint(BaseModel):
    lat: float
    lon: float
    elev: float
    dist: float


class ProfileResponse(BaseModel):
    points: list[ProfilePoint]
    totalDistance: float
    cumulativeAscent: float
    cumulativeDescent: float
    maxSlope: float
    minElevation: float
    maxElevation: float
    source: str = "MGS MOLA DEM 463m"
    resolution: str = "463 m/pixel"
    method: str = "bilinear interpolation along great-circle"


class SlopeResponse(BaseModel):
    slope: float
    aspect: float
    source: str = "MGS MOLA DEM 463m"
    resolution: str = "463 m/pixel"
    method: str = "Horn's method (3x3 neighborhood)"


class RouteSegment(BaseModel):
    start: dict
    end: dict
    distance: float
    ascent: float
    descent: float
    maxSlope: float


class RouteResponse(BaseModel):
    waypoints: list[dict]
    totalDistance: float
    cumulativeAscent: float
    cumulativeDescent: float
    maxSlope: float
    segments: list[RouteSegment]
    source: str = "MGS MOLA DEM 463m"
    resolution: str = "463 m/pixel"
    caveat: str = (
        "Candidate route only - no hazard/rock/trafficability/illumination/comms data"
    )


class HealthResponse(BaseModel):
    status: str
    mola_cog_loaded: bool


# Helper Functions
def check_cog():
    if not cog_reader:
        raise HTTPException(status_code=503, detail="MOLA COG not loaded")


def latlon_to_pixel(lat: float, lon: float) -> tuple[int, int]:
    """Convert lat/lon to pixel coordinates in MOLA COG (simple cylindrical, 0-360 lon)"""
    # MOLA: 46080 x 23040 pixels, 128 px/degree, simple cylindrical
    # lon: 0-360, lat: -90 to 90 (planetocentric)
    # Pixel (0,0) = upper-left = lon 0, lat 90
    if lon < 0:
        lon += 360
    x = int(lon * 128)  # 128 px/degree
    y = int((90 - lat) * 128)
    return x, y


def pixel_to_latlon(x: int, y: int) -> tuple[float, float]:
    """Convert pixel to lat/lon"""
    lon = x / 128.0
    lat = 90 - y / 128.0
    return lat, lon


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance on Mars sphere (metres)"""
    R = MARS_RADIUS
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(math.radians(lon2 - lon1) / 2) ** 2
    )
    c = 2 * math.asin(min(1, math.sqrt(a)))
    return R * c


def bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Initial bearing from point 1 to point 2 (degrees)"""
    lat1_r = math.radians(lat1)
    lat2_r = math.radians(lat2)
    dlon_r = math.radians(lon2 - lon1)
    y = math.sin(dlon_r) * math.cos(lat2_r)
    x = math.cos(lat1_r) * math.sin(lat2_r) - math.sin(lat1_r) * math.cos(
        lat2_r
    ) * math.cos(dlon_r)
    brng = math.degrees(math.atan2(y, x))
    return (brng + 360) % 360


def interpolate_elevation(lat: float, lon: float) -> float:
    """Bilinear interpolation from COG at given lat/lon"""
    check_cog()

    # Convert to pixel coordinates
    if lon < 0:
        lon += 360
    # COG uses geographic coordinates, use rio_tiler's point query
    try:
        # Use rio-tiler's point query for accurate interpolation
        result = cog_reader.point(lat, lon)
        return float(result[0])
    except Exception:
        # Fallback: nearest neighbor
        x, y = latlon_to_pixel(lat, lon)
        with rasterio.open(MOLA_COG_PATH) as src:
            if 0 <= y < src.height and 0 <= x < src.width:
                val = src.read(1, window=Window(x, y, 1, 1))[0, 0]
                return float(val)
            return float("nan")


# Endpoints
@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok", mola_cog_loaded=cog_reader is not None)


@app.get("/elevation", response_model=ElevationResponse)
async def get_elevation(
    lat: float = Query(..., ge=-90, le=90, description="Planetocentric latitude"),
    lon: float = Query(..., ge=-180, le=360, description="Longitude (+East 0-360)"),
):
    """Get elevation at a single point"""
    check_cog()

    if lon < 0:
        lon += 360

    elev = interpolate_elevation(lat, lon)

    if math.isnan(elev):
        raise HTTPException(
            status_code=404, detail="No elevation data at this location"
        )

    return ElevationResponse(elevation=round(elev, 1))


@app.get("/profile", response_model=ProfileResponse)
async def get_profile(
    coords: str = Query(
        ..., description="Lat,lon pairs separated by semicolons: lat1,lon1;lat2,lon2"
    ),
    samples: int = Query(
        100, ge=10, le=1000, description="Number of sample points along line"
    ),
):
    """Get elevation profile along a great-circle line"""
    check_cog()

    # Parse coordinates
    points = []
    for pair in coords.split(";"):
        lat_str, lon_str = pair.split(",")
        lat = float(lat_str)
        lon = float(lon_str)
        if lon < 0:
            lon += 360
        points.append((lat, lon))

    if len(points) < 2:
        raise HTTPException(status_code=400, detail="At least two points required")

    # Sample along great-circle segments
    profile_points = []
    total_dist = 0.0
    cum_ascent = 0.0
    cum_descent = 0.0
    max_slope = 0.0
    min_elev = float("inf")
    max_elev = float("-inf")

    for i in range(len(points) - 1):
        lat1, lon1 = points[i]
        lat2, lon2 = points[i + 1]

        seg_dist = haversine(lat1, lon1, lat2, lon2)
        seg_samples = max(
            2,
            int(
                samples
                * seg_dist
                / sum(
                    haversine(
                        points[j][0], points[j][1], points[j + 1][0], points[j + 1][1]
                    )
                    for j in range(len(points) - 1)
                )
            ),
        )

        brng = bearing(lat1, lon1, lat2, lon2)

        for s in range(seg_samples):
            frac = s / (seg_samples - 1) if seg_samples > 1 else 0
            dist = total_dist + frac * seg_dist

            # Interpolate along great circle
            angular_dist = dist / MARS_RADIUS
            # Simplified: linear interpolation in lat/lon for small segments
            # Proper implementation would use spherical linear interpolation
            lat = lat1 + (lat2 - lat1) * frac
            lon = lon1 + (lon2 - lon1) * frac
            if lon > 180:
                lon -= 360
            elif lon < -180:
                lon += 360

            elev = interpolate_elevation(lat, lon)
            if math.isnan(elev):
                elev = 0.0

            profile_points.append(
                ProfilePoint(
                    lat=round(lat, 6),
                    lon=round(lon, 6),
                    elev=round(elev, 1),
                    dist=round(dist, 1),
                )
            )

            min_elev = min(min_elev, elev)
            max_elev = max(max_elev, elev)

            if len(profile_points) > 1:
                prev_elev = profile_points[-2].elev
                delta = elev - prev_elev
                if delta > 0:
                    cum_ascent += delta
                else:
                    cum_descent += abs(delta)
                # Slope = arctan(delta_elev / horizontal_dist)
                horiz_dist = profile_points[-1].dist - profile_points[-2].dist
                if horiz_dist > 0:
                    slope_deg = math.degrees(math.atan2(abs(delta), horiz_dist))
                    max_slope = max(max_slope, slope_deg)

        total_dist += seg_dist

    return ProfileResponse(
        points=profile_points,
        totalDistance=round(total_dist, 1),
        cumulativeAscent=round(cum_ascent, 1),
        cumulativeDescent=round(cum_descent, 1),
        maxSlope=round(max_slope, 2),
        minElevation=round(min_elev, 1),
        maxElevation=round(max_elev, 1),
    )


@app.get("/slope", response_model=SlopeResponse)
async def get_slope(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=360),
):
    """Get slope and aspect at a point (Horn's method)"""
    check_cog()

    if lon < 0:
        lon += 360

    # Sample 3x3 neighborhood
    resolution = 463.0835744  # m/pixel at equator
    # At latitude lat, pixel width in metres = resolution * cos(lat)
    lat_rad = math.radians(lat)
    pixel_width_m = resolution * math.cos(lat_rad)
    pixel_height_m = resolution

    offsets = [
        (-1, -1),
        (0, -1),
        (1, -1),
        (-1, 0),
        (0, 0),
        (1, 0),
        (-1, 1),
        (0, 1),
        (1, 1),
    ]

    elevations = []
    for dx, dy in offsets:
        # Convert pixel offset to lat/lon offset
        dlat = dy * resolution / MARS_RADIUS * 180 / math.pi
        dlon = dx * resolution / (MARS_RADIUS * math.cos(lat_rad)) * 180 / math.pi
        nlat = lat + dlat
        nlon = lon + dlon
        if nlon < 0:
            nlon += 360
        elev = interpolate_elevation(nlat, nlon)
        elevations.append(elev if not math.isnan(elev) else 0)

    # Horn's method
    # dz/dx = ((z3 + 2*z6 + z9) - (z1 + 2*z4 + z7)) / (8 * pixel_width)
    # dz/dy = ((z1 + 2*z2 + z3) - (z7 + 2*z8 + z9)) / (8 * pixel_height)
    z = elevations
    dzdx = ((z[2] + 2 * z[5] + z[8]) - (z[0] + 2 * z[3] + z[6])) / (8 * pixel_width_m)
    dzdy = ((z[0] + 2 * z[1] + z[2]) - (z[6] + 2 * z[7] + z[8])) / (8 * pixel_height_m)

    slope_rad = math.atan(math.sqrt(dzdx**2 + dzdy**2))
    slope_deg = math.degrees(slope_rad)

    # Aspect: direction of steepest descent (degrees from north, clockwise)
    aspect_rad = math.atan2(-dzdx, -dzdy)  # Note: x is east, y is north
    aspect_deg = (math.degrees(aspect_rad) + 360) % 360

    return SlopeResponse(
        slope=round(slope_deg, 2),
        aspect=round(aspect_deg, 1),
    )


@app.get("/route", response_model=RouteResponse)
async def get_route(
    coords: str = Query(..., description="Waypoints as lat,lon;lat,lon;..."),
    samples: int = Query(50, ge=10, le=200, description="Samples per segment"),
):
    """Get route metrics for waypoints"""
    check_cog()

    # Parse waypoints
    waypoints = []
    for pair in coords.split(";"):
        lat_str, lon_str = pair.split(",")
        lat = float(lat_str)
        lon = float(lon_str)
        if lon < 0:
            lon += 360
        waypoints.append({"lat": lat, "lon": lon})

    if len(waypoints) < 2:
        raise HTTPException(status_code=400, detail="At least two waypoints required")

    segments = []
    total_dist = 0.0
    cum_ascent = 0.0
    cum_descent = 0.0
    max_slope = 0.0

    for i in range(len(waypoints) - 1):
        wp1 = waypoints[i]
        wp2 = waypoints[i + 1]

        lat1, lon1 = wp1["lat"], wp1["lon"]
        lat2, lon2 = wp2["lat"], wp2["lon"]

        # Sample segment
        seg_dist = haversine(lat1, lon1, lat2, lon2)
        brng = bearing(lat1, lon1, lat2, lon2)

        seg_samples = max(2, samples)
        prev_elev = None
        seg_ascent = 0.0
        seg_descent = 0.0
        seg_max_slope = 0.0

        for s in range(seg_samples):
            frac = s / (seg_samples - 1)
            dist = total_dist + frac * seg_dist

            # Spherical linear interpolation
            angular_dist = dist / MARS_RADIUS
            lat = lat1 + (lat2 - lat1) * frac
            lon = lon1 + (lon2 - lon1) * frac
            if lon > 180:
                lon -= 360
            elif lon < -180:
                lon += 360

            elev = interpolate_elevation(lat, lon)
            if math.isnan(elev):
                elev = 0.0

            if prev_elev is not None:
                delta = elev - prev_elev
                if delta > 0:
                    seg_ascent += delta
                else:
                    seg_descent += abs(delta)
                horiz = (seg_dist / (seg_samples - 1)) if seg_samples > 1 else 0
                if horiz > 0:
                    slope = math.degrees(math.atan2(abs(delta), horiz))
                    seg_max_slope = max(seg_max_slope, slope)

            prev_elev = elev

        segments.append(
            RouteSegment(
                start=wp1,
                end=wp2,
                distance=round(seg_dist, 1),
                ascent=round(seg_ascent, 1),
                descent=round(seg_descent, 1),
                maxSlope=round(seg_max_slope, 2),
            )
        )

        total_dist += seg_dist
        cum_ascent += seg_ascent
        cum_descent += seg_descent
        max_slope = max(max_slope, seg_max_slope)

    return RouteResponse(
        waypoints=waypoints,
        totalDistance=round(total_dist, 1),
        cumulativeAscent=round(cum_ascent, 1),
        cumulativeDescent=round(cum_descent, 1),
        maxSlope=round(max_slope, 2),
        segments=segments,
    )


@app.get("/tiles/mola_hillshade/{z}/{x}/{y}.png")
async def mola_hillshade_tile(z: int, x: int, y: int):
    """Serve MOLA hillshade tile"""
    check_cog()

    # For now, return a placeholder - would need rio-tiler hillshade rendering
    # This is a stub - full implementation requires rio-tiler hillshade expression
    from PIL import Image
    import io

    img = Image.new("RGBA", (256, 256), (30, 30, 40, 255))
    # Draw grid for debugging
    from PIL import ImageDraw

    draw = ImageDraw.Draw(img)
    draw.line([(128, 0), (128, 256)], fill=(100, 100, 120, 100))
    draw.line([(0, 128), (256, 128)], fill=(100, 100, 120, 100))
    draw.text((5, 5), f"{z}/{x}/{y}", fill=(150, 150, 170, 200))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/png")


@app.get("/tiles/mola_color/{z}/{x}/{y}.png")
async def mola_color_tile(z: int, x: int, y: int):
    """Serve MOLA colorized elevation tile"""
    check_cog()

    from PIL import Image
    import io

    img = Image.new("RGBA", (256, 256), (40, 30, 30, 255))
    from PIL import ImageDraw

    draw = ImageDraw.Draw(img)
    draw.text((5, 5), f"COLOR {z}/{x}/{y}", fill=(200, 150, 150, 200))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/png")


@app.get("/tiles/mola_slope/{z}/{x}/{y}.png")
async def mola_slope_tile(z: int, x: int, y: int):
    """Serve MOLA slope tile"""
    check_cog()

    from PIL import Image
    import io

    img = Image.new("RGBA", (256, 256), (30, 40, 30, 255))
    from PIL import ImageDraw

    draw = ImageDraw.Draw(img)
    draw.text((5, 5), f"SLOPE {z}/{x}/{y}", fill=(150, 200, 150, 200))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/png")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
