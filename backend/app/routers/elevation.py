"""
Elevation endpoints for MARSCOPE Backend.
MOLA DEM point queries, profiles, slopes, and routes.
"""

import math
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import StreamingResponse

from app.dependencies import (
    get_cog_reader,
    validate_latitude,
    validate_longitude,
    validate_samples,
    MARS_RADIUS,
    MOLA_RESOLUTION,
)
from app.schemas.elevation import (
    ElevationResponse,
    ProfileResponse,
    ProfilePoint,
    SlopeResponse,
    RouteResponse,
    RouteSegment,
    HealthResponse,
)

router = APIRouter(prefix="/elevation", tags=["elevation"])


# Global COG reader reference
_cog_reader = None


def set_cog_reader(reader):
    global _cog_reader
    _cog_reader = reader


def get_reader():
    if _cog_reader is None:
        raise HTTPException(
            status_code=503,
            detail="MOLA COG not loaded. COG file may be missing or conversion failed.",
        )
    return _cog_reader


# Mars constants (also in dependencies)
MOLA_COG_PATH = "/data/Mars_MGS_MOLA_DEM_mosaic_global_463m_cog.tif"


def latlon_to_pixel(lat: float, lon: float) -> tuple[int, int]:
    """Convert lat/lon to pixel coordinates in MOLA COG (simple cylindrical, 0-360 lon)."""
    if lon < 0:
        lon += 360
    x = int(lon * 128)  # 128 px/degree
    y = int((90 - lat) * 128)
    return x, y


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance on Mars sphere (metres)."""
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
    """Initial bearing from point 1 to point 2 (degrees)."""
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
    """Bilinear interpolation from COG at given lat/lon."""
    reader = get_reader()
    if lon < 0:
        lon += 360

    try:
        result = reader.point(lat, lon)
        return float(result[0])
    except Exception:
        # Fallback: nearest neighbor via rasterio
        import rasterio
        from rasterio.windows import Window

        x, y = latlon_to_pixel(lat, lon)
        with rasterio.open(MOLA_COG_PATH) as src:
            if 0 <= y < src.height and 0 <= x < src.width:
                val = src.read(1, window=Window(x, y, 1, 1))[0, 0]
                return float(val)
            return float("nan")


@router.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    reader = _cog_reader
    return HealthResponse(status="ok", mola_cog_loaded=reader is not None)


@router.get("/point", response_model=ElevationResponse)
async def get_elevation(
    lat: Annotated[float, Depends(validate_latitude)],
    lon: Annotated[float, Depends(validate_longitude)],
):
    """Get elevation at a single point."""
    reader = get_reader()
    elev = interpolate_elevation(lat, lon)

    if math.isnan(elev):
        raise HTTPException(
            status_code=404, detail="No elevation data at this location"
        )

    return ElevationResponse(elevation=round(elev, 1))


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(
    coords: str = Query(
        ..., description="Lat,lon pairs separated by semicolons: lat1,lon1;lat2,lon2"
    ),
    samples: Annotated[int, Depends(validate_samples)] = 100,
):
    """Get elevation profile along a great-circle line."""
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
        total_seg_dist = sum(
            haversine(points[j][0], points[j][1], points[j + 1][0], points[j + 1][1])
            for j in range(len(points) - 1)
        )
        seg_samples = (
            max(2, int(samples * seg_dist / total_seg_dist))
            if total_seg_dist > 0
            else 2
        )

        brng = bearing(lat1, lon1, lat2, lon2)

        for s in range(seg_samples):
            frac = s / (seg_samples - 1) if seg_samples > 1 else 0
            dist = total_dist + frac * seg_dist

            # Spherical linear interpolation (slerp)
            angular_dist = dist / MARS_RADIUS
            # Simplified linear interpolation for small segments
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


@router.get("/slope", response_model=SlopeResponse)
async def get_slope(
    lat: Annotated[float, Depends(validate_latitude)],
    lon: Annotated[float, Depends(validate_longitude)],
):
    """Get slope and aspect at a point (Horn's method on 3x3 neighborhood)."""
    if lon < 0:
        lon += 360

    # Sample 3x3 neighborhood
    lat_rad = math.radians(lat)
    pixel_width_m = MOLA_RESOLUTION * math.cos(lat_rad)
    pixel_height_m = MOLA_RESOLUTION

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
        dlat = dy * MOLA_RESOLUTION / MARS_RADIUS * 180 / math.pi
        dlon = dx * MOLA_RESOLUTION / (MARS_RADIUS * math.cos(lat_rad)) * 180 / math.pi
        nlat = lat + dlat
        nlon = lon + dlon
        if nlon < 0:
            nlon += 360
        elev = interpolate_elevation(nlat, nlon)
        elevations.append(elev if not math.isnan(elev) else 0)

    # Horn's method
    z = elevations
    dzdx = ((z[2] + 2 * z[5] + z[8]) - (z[0] + 2 * z[3] + z[6])) / (8 * pixel_width_m)
    dzdy = ((z[0] + 2 * z[1] + z[2]) - (z[6] + 2 * z[7] + z[8])) / (8 * pixel_height_m)

    slope_rad = math.atan(math.sqrt(dzdx**2 + dzdy**2))
    slope_deg = math.degrees(slope_rad)

    aspect_rad = math.atan2(-dzdx, -dzdy)
    aspect_deg = (math.degrees(aspect_rad) + 360) % 360

    return SlopeResponse(
        slope=round(slope_deg, 2),
        aspect=round(aspect_deg, 1),
    )


@router.get("/route", response_model=RouteResponse)
async def get_route(
    coords: str = Query(..., description="Waypoints as lat,lon;lat,lon;..."),
    samples: Annotated[int, Depends(validate_samples)] = 50,
):
    """Get route metrics for waypoints."""
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
