"""
Mars mathematical utilities for MARSCOPE.
Coordinate transformations, distance calculations, projections.
"""

import math
from typing import Tuple, List

# Mars physical constants
MARS_RADIUS = 3_396_190  # metres (IAU 2000)
MARS_GM = 4.282837e13  # m³/s²
MARS_ROTATION_PERIOD = 88642.66  # seconds (24h 37m 22.66s)
MARS_OBLIQUITY = 25.19  # degrees
MARS_SOLAR_DAY = 88775.244  # seconds (24h 39m 35.244s)


# MOLA DEM constants
MOLA_RESOLUTION = 463.0835744  # m/pixel at equator
MOLA_WIDTH_PX = 46_080
MOLA_HEIGHT_PX = 23_040
MOLA_PIXELS_PER_DEGREE = 128


def haversine_distance(
    lat1: float, lon1: float, lat2: float, lon2: float, radius: float = MARS_RADIUS
) -> float:
    """
    Great-circle distance on a sphere using haversine formula.

    Args:
        lat1, lon1: First point (degrees, planetocentric, +E 0-360)
        lat2, lon2: Second point (degrees, planetocentric, +E 0-360)
        radius: Sphere radius (default Mars)

    Returns:
        Distance in metres
    """
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    lat1_r = math.radians(lat1)
    lat2_r = math.radians(lat2)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.asin(min(1, math.sqrt(a)))
    return radius * c


def initial_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Initial bearing from point 1 to point 2.

    Returns:
        Bearing in degrees from north (clockwise), 0-360
    """
    lat1_r = math.radians(lat1)
    lat2_r = math.radians(lat2)
    dlon_r = math.radians(lon2 - lon1)

    y = math.sin(dlon_r) * math.cos(lat2_r)
    x = math.cos(lat1_r) * math.sin(lat2_r) - math.sin(lat1_r) * math.cos(
        lat2_r
    ) * math.cos(dlon_r)

    brng = math.degrees(math.atan2(y, x))
    return (brng + 360) % 360


def destination_point(
    lat: float,
    lon: float,
    bearing_deg: float,
    distance: float,
    radius: float = MARS_RADIUS,
) -> Tuple[float, float]:
    """
    Calculate destination point given start, bearing, and distance.

    Returns:
        (lat, lon) of destination point
    """
    lat_r = math.radians(lat)
    brng_r = math.radians(bearing_deg)
    angular_dist = distance / radius

    lat2 = math.asin(
        math.sin(lat_r) * math.cos(angular_dist)
        + math.cos(lat_r) * math.sin(angular_dist) * math.cos(brng_r)
    )

    lon2 = math.radians(lon) + math.atan2(
        math.sin(brng_r) * math.sin(angular_dist) * math.cos(lat_r),
        math.cos(angular_dist) - math.sin(lat_r) * math.sin(lat2),
    )

    return math.degrees(lat2), (math.degrees(lon2) + 360) % 360


def slerp_points(
    lat1: float, lon1: float, lat2: float, lon2: float, fraction: float
) -> Tuple[float, float]:
    """
    Spherical linear interpolation between two points.

    Args:
        fraction: 0 = point 1, 1 = point 2

    Returns:
        Interpolated (lat, lon)
    """
    lat1_r = math.radians(lat1)
    lon1_r = math.radians(lon1)
    lat2_r = math.radians(lat2)
    lon2_r = math.radians(lon2)

    # Angular distance between points
    cos_c = math.sin(lat1_r) * math.sin(lat2_r) + math.cos(lat1_r) * math.cos(
        lat2_r
    ) * math.cos(lon2_r - lon1_r)
    c = math.acos(min(1, max(-1, cos_c)))

    if c < 1e-10:
        return lat1, lon1

    a = math.sin((1 - fraction) * c) / math.sin(c)
    b = math.sin(fraction * c) / math.sin(c)

    x = a * math.cos(lat1_r) * math.cos(lon1_r) + b * math.cos(lat2_r) * math.cos(
        lon2_r
    )
    y = a * math.cos(lat1_r) * math.sin(lon1_r) + b * math.cos(lat2_r) * math.sin(
        lon2_r
    )
    z = a * math.sin(lat1_r) + b * math.sin(lat2_r)

    lat_r = math.atan2(z, math.sqrt(x * x + y * y))
    lon_r = math.atan2(y, x)

    return math.degrees(lat_r), (math.degrees(lon_r) + 360) % 360


def latlon_to_pixel(
    lat: float, lon: float, pixels_per_degree: int = 128
) -> Tuple[int, int]:
    """Convert lat/lon to pixel coordinates in simple cylindrical projection."""
    if lon < 0:
        lon += 360
    x = int(lon * pixels_per_degree)
    y = int((90 - lat) * pixels_per_degree)
    return x, y


def pixel_to_latlon(
    x: int, y: int, pixels_per_degree: int = 128
) -> Tuple[float, float]:
    """Convert pixel coordinates to lat/lon."""
    lon = x / pixels_per_degree
    lat = 90 - y / pixels_per_degree
    return lat, lon


def mola_latlon_to_pixel(lat: float, lon: float) -> Tuple[int, int]:
    """Convert lat/lon to MOLA DEM pixel coordinates."""
    return latlon_to_pixel(lat, lon, 128)


def mola_pixel_to_latlon(x: int, y: int) -> Tuple[float, float]:
    """Convert MOLA DEM pixel to lat/lon."""
    return pixel_to_latlon(x, y, 128)


def great_circle_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Alias for haversine_distance."""
    return haversine_distance(lat1, lon1, lat2, lon2)


def surface_area_of_spherical_cap(
    lat_min: float, lat_max: float, radius: float = MARS_RADIUS
) -> float:
    """
    Surface area of a spherical zone between two latitudes.

    Args:
        lat_min, lat_max: Latitude bounds in degrees

    Returns:
        Area in square metres
    """
    phi1 = math.radians(lat_min)
    phi2 = math.radians(lat_max)
    return 2 * math.pi * radius**2 * (math.sin(phi2) - math.sin(phi1))


def circumference_at_latitude(lat: float, radius: float = MARS_RADIUS) -> float:
    """Circumference of Mars at a given latitude."""
    return 2 * math.pi * radius * math.cos(math.radians(lat))


def length_of_degree_at_latitude(
    lat: float, radius: float = MARS_RADIUS
) -> Tuple[float, float]:
    """
    Length of 1 degree of latitude and longitude at a given latitude.

    Returns:
        (metres_per_degree_lat, metres_per_degree_lon)
    """
    lat_r = math.radians(lat)
    metres_per_deg_lat = 2 * math.pi * radius / 360
    metres_per_deg_lon = metres_per_deg_lat * math.cos(lat_r)
    return metres_per_deg_lat, metres_per_deg_lon


def azimuthal_equidistant_projection(
    lat: float,
    lon: float,
    center_lat: float,
    center_lon: float,
    radius: float = MARS_RADIUS,
) -> Tuple[float, float]:
    """
    Azimuthal equidistant projection centered at (center_lat, center_lon).

    Returns:
        (x, y) in metres from center
    """
    lat_r = math.radians(lat)
    lon_r = math.radians(lon)
    clat_r = math.radians(center_lat)
    clon_r = math.radians(center_lon)

    cos_c = math.sin(clat_r) * math.sin(lat_r) + math.cos(clat_r) * math.cos(
        lat_r
    ) * math.cos(lon_r - clon_r)
    c = math.acos(min(1, max(-1, cos_c)))

    if c < 1e-12:
        return 0.0, 0.0

    k = c / math.sin(c)
    x = radius * k * math.cos(lat_r) * math.sin(lon_r - clon_r)
    y = (
        radius
        * k
        * (
            math.cos(clat_r) * math.sin(lat_r)
            - math.sin(clat_r) * math.cos(lat_r) * math.cos(lon_r - clon_r)
        )
    )

    return x, y


def inverse_azimuthal_equidistant(
    x: float,
    y: float,
    center_lat: float,
    center_lon: float,
    radius: float = MARS_RADIUS,
) -> Tuple[float, float]:
    """Inverse azimuthal equidistant: metres -> degrees."""
    rho = math.hypot(x, y)
    c = rho / radius
    sin_c = math.sin(c)
    cos_c = math.cos(c)

    clat_r = math.radians(center_lat)

    lat_r = math.asin(
        cos_c * math.sin(clat_r) + y * sin_c * math.cos(clat_r) / rho
        if rho > 0
        else math.sin(clat_r)
    )
    lon_r = (
        math.radians(center_lon)
        + math.atan2(
            x * sin_c, rho * math.cos(clat_r) * cos_c - y * math.sin(clat_r) * sin_c
        )
        if rho > 0
        else math.radians(center_lon)
    )

    return math.degrees(lat_r), (math.degrees(lon_r) + 360) % 360


def horn_slope_aspect(
    elevations: List[List[float]], pixel_width_m: float, pixel_height_m: float
) -> Tuple[float, float]:
    """
    Horn's method for slope and aspect from 3x3 elevation window.

    Args:
        elevations: 3x3 grid [row][col], row 0 = north
        pixel_width_m: East-west pixel size in metres
        pixel_height_m: North-south pixel size in metres

    Returns:
        (slope_degrees, aspect_degrees_from_north)
    """
    z = elevations

    # dz/dx = ((z3 + 2*z6 + z9) - (z1 + 2*z4 + z7)) / (8 * pixel_width)
    # dz/dy = ((z1 + 2*z2 + z3) - (z7 + 2*z8 + z9)) / (8 * pixel_height)
    # Indices: 0=z1(NW), 1=z2(N), 2=z3(NE), 3=z4(W), 4=z5(C), 5=z6(E), 6=z7(SW), 7=z8(S), 8=z9(SE)

    dzdx = ((z[0][2] + 2 * z[1][2] + z[2][2]) - (z[0][0] + 2 * z[1][0] + z[2][0])) / (
        8 * pixel_width_m
    )
    dzdy = ((z[0][0] + 2 * z[0][1] + z[0][2]) - (z[2][0] + 2 * z[2][1] + z[2][2])) / (
        8 * pixel_height_m
    )

    slope_rad = math.atan(math.sqrt(dzdx**2 + dzdy**2))
    slope_deg = math.degrees(slope_rad)

    # Aspect: direction of steepest descent (degrees from north, clockwise)
    aspect_rad = math.atan2(-dzdx, -dzdy)
    aspect_deg = (math.degrees(aspect_rad) + 360) % 360

    return slope_deg, aspect_deg


def solar_elevation_angle(lat: float, declination: float, hour_angle: float) -> float:
    """Solar elevation angle (degrees above horizon)."""
    lat_r = math.radians(lat)
    dec_r = math.radians(declination)
    ha_r = math.radians(hour_angle)

    sin_elev = math.sin(lat_r) * math.sin(declination) + math.cos(lat_r) * math.cos(
        declination
    ) * math.cos(hour_angle)
    return math.degrees(math.asin(max(-1, min(1, sin_elev))))


def solar_declination(ls: float) -> float:
    """
    Solar declination from solar longitude (Ls).

    Args:
        ls: Solar longitude in degrees (0-360)

    Returns:
        Declination in degrees
    """
    obliquity = 25.19  # Mars obliquity
    return math.degrees(
        math.asin(math.sin(math.radians(obliquity)) * math.sin(math.radians(ls)))
    )


def equation_of_time(ls: float) -> float:
    """
    Equation of time for Mars (difference between apparent and mean solar time).

    Returns:
        Minutes of time correction
    """
    # Simplified: Mars has no significant eccentricity correction like Earth
    # Mainly due to obliquity
    obliquity = math.radians(25.19)
    return (
        math.degrees(
            math.atan(math.tan(math.radians(ls)) * math.cos(obliquity))
            - math.radians(ls)
        )
        * 4
    )


def solar_longitude(date: datetime) -> float:
    """
    Approximate solar longitude (Ls) for a given UTC date.

    Args:
        date: UTC datetime

    Returns:
        Solar longitude in degrees (0-360)
    """
    # Mars Year 1 started April 11, 1955 (Ls=0)
    # Mars year = 668.6 sols
    # Reference: MY 36 started Feb 7, 2021

    my1_start = datetime(1955, 4, 11)
    mars_year_length = 668.5991  # sols

    days_since = (date - my1_start).total_seconds() / 86400
    mars_sols = days_since / 1.02749125  # Earth days to Mars sols

    ls = (mars_sols / mars_year_length * 360) % 360
    return ls


def mars_season(ls: float) -> str:
    """Get Mars season from solar longitude."""
    if 0 <= ls < 90:
        return "northern_spring"
    elif 90 <= ls < 180:
        return "northern_summer"
    elif 180 <= ls < 270:
        return "northern_autumn"
    else:
        return "northern_winter"


def mars_sol_number(date: datetime) -> int:
    """
    Get Mars sol number for a date (relative to MSL landing Sol 0 = Aug 6, 2012).
    """
    msl_landing = datetime(2012, 8, 6)
    days_diff = (date - msl_landing).total_seconds() / 88775.244  # Mars sol in seconds
    return int(days_diff)


def format_mars_time(date: datetime) -> str:
    """Format datetime as Mars local solar time (approximate)."""
    # Very rough approximation
    ls = solar_longitude(date)
    sol = mars_sol_number(date)
    return f"Sol {sol}, Ls={ls:.1f}°"


# Coordinate system validation
def validate_planetocentric_lat_lon(lat: float, lon: float) -> Tuple[float, float]:
    """Validate and normalize planetocentric coordinates."""
    if not -90 <= lat <= 90:
        raise ValueError(f"Latitude {lat} out of range [-90, 90]")
    if not -180 <= lon <= 180 and not 0 <= lon <= 360:
        raise ValueError(f"Longitude {lon} out of range [-180, 180] or [0, 360]")

    # Normalize to 0-360
    if lon < 0:
        lon += 360
    return lat, lon


def planetographic_to_planetocentric(
    lat_pg: float, lon_pg: float, a: float = MARS_RADIUS, b: float = 3376200
) -> Tuple[float, float]:
    """
    Convert planetographic to planetocentric coordinates.

    Args:
        lat_pg: Planetographic latitude
        lon_pg: Planetographic longitude (usually same as planetocentric)
        a: Equatorial radius
        b: Polar radius

    Returns:
        (lat_pc, lon_pc)
    """
    # For Mars, planetographic and planetocentric longitude are the same
    # Latitude conversion: tan(lat_pc) = (b^2/a^2) * tan(lat_pg)
    e2 = 1 - (b**2 / a**2)
    lat_pg_r = math.radians(lat_pg)
    lat_pc_r = math.atan((1 - e2) * math.tan(lat_pg_r))
    return math.degrees(lat_pc_r), lon_pg


def planetocentric_to_planetographic(
    lat_pc: float, lon_pc: float, a: float = MARS_RADIUS, b: float = 3376200
) -> Tuple[float, float]:
    """Convert planetocentric to planetographic coordinates."""
    e2 = 1 - (b**2 / a**2)
    lat_pc_r = math.radians(lat_pc)
    lat_pg_r = math.atan(math.tan(lat_pc_r) / (1 - e2))
    return math.degrees(lat_pg_r), lon_pc
