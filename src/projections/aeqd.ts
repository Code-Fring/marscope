/**
 * Azimuthal Equidistant Projection for Mars
 * Ported from planetary-dem-to-stl/src/planetary_dem_to_stl/geo.py
 * Provides accurate local mapping on Mars sphere (R=3,396,190m)
 */

import { MARS } from '@/constants/mars';

export interface Box {
  lat: number;
  lon: number;
  width_m: number;
  height_m: number;
}

export class BoxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BoxError';
  }
}

/**
 * Wrap longitude to [-180, 180) range
 */
function wrapLon(lon: number): number {
  return ((lon + 180) % 360) - 180;
}

/**
 * Create a box from center point and size
 */
export function boxFromCentre(lat: number, lon: number, sizeKm: number, heightKm?: number): Box {
  if (sizeKm <= 0 || (heightKm !== undefined && heightKm <= 0)) {
    throw new BoxError('size must be positive');
  }
  const h = heightKm ?? sizeKm;
  return {
    lat,
    lon,
    width_m: sizeKm * 1000,
    height_m: h * 1000,
  };
}

/**
 * Create a box from bounding box (west, south, east, north in degrees)
 * Width measured along middle latitude
 */
export function boxFromBbox(
  west: number,
  south: number,
  east: number,
  north: number,
  radiusM: number = MARS.RADIUS_M
): Box {
  if (!(south < north)) throw new BoxError('bbox needs south < north');
  const span = ((east - west) % 360 + 360) % 360;
  if (span === 0) throw new BoxError('bbox needs west != east');

  const latC = (south + north) / 2;
  const lonC = wrapLon(west + span / 2);
  const rad = Math.PI / 180;
  const width = span * rad * radiusM * Math.cos(latC * rad);
  const height = (north - south) * rad * radiusM;

  return { lat: latC, lon: lonC, width_m: width, height_m: height };
}

/**
 * Validate box against Mars constraints
 */
export function checkBox(box: Box, radiusM: number = MARS.RADIUS_M): void {
  if (box.lat < -90 || box.lat > 90) {
    throw new BoxError('latitude must be between -90 and 90');
  }

  const corner = Math.hypot(box.width_m, box.height_m) / 2 / radiusM;
  if (corner > MARS.MAX_CORNER_ANGLE) {
    const limitKm = (2 * MARS.MAX_CORNER_ANGLE * radiusM) / Math.sqrt(2) / 1000;
    throw new BoxError(
      `box too large: keep it under about ${limitKm.toFixed(0)} km across on this world ` +
      `(beyond that a flat model distorts the surface by more than 2%)`
    );
  }

  // Polar check on box outline
  const [lat] = inverseAeqd(...outlineXy(box), box.lat, box.lon, radiusM);
  const maxAbsLat = Math.max(...lat.map(Math.abs));
  if (maxAbsLat > MARS.MAX_ABS_LAT || Math.abs(box.lat) > MARS.MAX_ABS_LAT) {
    throw new BoxError(
      `box reaches beyond ${MARS.MAX_ABS_LAT} degrees latitude; polar regions are not supported ` +
      `(the source grids are equirectangular and wrap at the poles)`
    );
  }
}

/**
 * Generate outline points for box (for polar check)
 */
export function outlineXy(box: Box, n: number = 64): [number[], number[]] {
  const hw = box.width_m / 2;
  const hh = box.height_m / 2;
  const t = Array.from({ length: n }, (_, i) => -1 + 2 * i / (n - 1));

  const x = [
    ...t.map(v => v * hw),
    ...Array(n).fill(hw),
    ...t.map(v => -v * hw),
    ...Array(n).fill(-hw),
  ];
  const y = [
    ...Array(n).fill(-hh),
    ...t.map(v => v * hh),
    ...Array(n).fill(hh),
    ...t.map(v => -v * hh),
  ];

  return [x, y];
}

/**
 * Inverse Azimuthal Equidistant: metres -> degrees (lat, lon)
 * @param x Easting in metres
 * @param y Northing in metres
 * @param lat0 Center latitude in degrees
 * @param lon0 Center longitude in degrees
 * @param radiusM Sphere radius in metres
 * @returns [latitudes, longitudes] in degrees
 */
export function inverseAeqd(
  x: number | number[],
  y: number | number[],
  lat0: number,
  lon0: number,
  radiusM: number = MARS.RADIUS_M
): [number[], number[]] {
  const xs = Array.isArray(x) ? x : [x];
  const ys = Array.isArray(y) ? y : [y];
  const phi0 = lat0 * Math.PI / 180;
  const sinPhi0 = Math.sin(phi0);
  const cosPhi0 = Math.cos(phi0);

  const lats: number[] = [];
  const lons: number[] = [];

  for (let i = 0; i < xs.length; i++) {
    const xi = xs[i];
    const yi = ys[i];
    const rho = Math.hypot(xi, yi);
    const c = rho / radiusM;
    const sinC = Math.sin(c);
    const cosC = Math.cos(c);

    let lat: number;
    let lon: number;

    if (rho > 1e-12) {
      lat = Math.asin(Math.max(-1, Math.min(1, cosC * sinPhi0 + (yi * sinC * cosPhi0) / rho)));
      lon = lon0 * Math.PI / 180 + Math.atan2(
        xi * sinC,
        rho * cosPhi0 * cosC - yi * sinPhi0 * sinC
      );
    } else {
      lat = phi0;
      lon = lon0 * Math.PI / 180;
    }

    lats.push(lat * 180 / Math.PI);
    lons.push(wrapLon(lon * 180 / Math.PI));
  }

  return [lats, lons];
}

/**
 * Forward Azimuthal Equidistant: degrees -> metres (used in tests)
 */
export function forwardAeqd(
  lat: number | number[],
  lon: number | number[],
  lat0: number,
  lon0: number,
  radiusM: number = MARS.RADIUS_M
): [number[], number[]] {
  const lats = Array.isArray(lat) ? lat : [lat];
  const lons = Array.isArray(lon) ? lon : [lon];
  const phi0 = lat0 * Math.PI / 180;
  const lam0 = lon0 * Math.PI / 180;
  const sinPhi0 = Math.sin(phi0);
  const cosPhi0 = Math.cos(phi0);

  const xs: number[] = [];
  const ys: number[] = [];

  for (let i = 0; i < lats.length; i++) {
    const phi = lats[i] * Math.PI / 180;
    const lam = lons[i] * Math.PI / 180;

    const cosC = sinPhi0 * Math.sin(phi) + cosPhi0 * Math.cos(phi) * Math.cos(lam - lam0);
    const c = Math.acos(Math.max(-1, Math.min(1, cosC)));
    const k = c > 1e-12 ? c / Math.sin(c) : 1;

    xs.push(radiusM * k * Math.cos(phi) * Math.sin(lam - lam0));
    ys.push(radiusM * k * (cosPhi0 * Math.sin(phi) - sinPhi0 * Math.cos(phi) * Math.cos(lam - lam0)));
  }

  return [xs, ys];
}

/**
 * Generate grid coordinates for a box
 * @returns [X grid, Y grid] where X[i][j] is easting, Y[i][j] is northing
 * Row 0 = south edge, Column 0 = west edge
 */
export function gridXy(box: Box, nx: number, ny: number): [number[][], number[][]] {
  const xs = Array.from({ length: nx }, (_, i) => -box.width_m / 2 + (box.width_m * i) / (nx - 1));
  const ys = Array.from({ length: ny }, (_, i) => -box.height_m / 2 + (box.height_m * i) / (ny - 1));

  const X: number[][] = [];
  const Y: number[][] = [];

  for (let j = 0; j < ny; j++) {
    X[j] = [...xs];
    Y[j] = Array(nx).fill(ys[j]);
  }

  return [X, Y];
}

/**
 * Great-circle distance on Mars sphere (Haversine formula)
 * @param lat1 Latitude 1 in degrees
 * @param lon1 Longitude 1 in degrees
 * @param lat2 Latitude 2 in degrees
 * @param lon2 Longitude 2 in degrees
 * @param radiusM Sphere radius (default Mars)
 * @returns Distance in metres
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  radiusM: number = MARS.RADIUS_M
): number {
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const lat1Rad = lat1 * toRad;
  const lat2Rad = lat2 * toRad;

  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.asin(Math.min(1, Math.sqrt(a)));

  return radiusM * c;
}

/**
 * Bearing from point 1 to point 2 (degrees, 0 = North)
 */
export function bearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = Math.PI / 180;
  const toDeg = 180 / Math.PI;
  const lat1Rad = lat1 * toRad;
  const lat2Rad = lat2 * toRad;
  const dLon = (lon2 - lon1) * toRad;

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  const brng = Math.atan2(y, x) * toDeg;
  return (brng + 360) % 360;
}

/**
 * Destination point given start, bearing, distance
 * @param lat Start latitude
 * @param lon Start longitude
 * @param brng Bearing in degrees
 * @param dist Distance in metres
 * @param radiusM Sphere radius
 * @returns [lat, lon] of destination
 */
export function destinationPoint(
  lat: number,
  lon: number,
  brng: number,
  dist: number,
  radiusM: number = MARS.RADIUS_M
): [number, number] {
  const toRad = Math.PI / 180;
  const toDeg = 180 / Math.PI;
  const latRad = lat * toRad;
  const brngRad = brng * toRad;
  const angularDist = dist / radiusM;

  const lat2 = Math.asin(
    Math.sin(latRad) * Math.cos(angularDist) +
    Math.cos(latRad) * Math.sin(angularDist) * Math.cos(brngRad)
  );
  const lon2 = lon * toRad + Math.atan2(
    Math.sin(brngRad) * Math.sin(angularDist) * Math.cos(latRad),
    Math.cos(angularDist) - Math.sin(latRad) * Math.sin(lat2)
  );

  return [lat2 * toDeg, wrapLon(lon2 * toDeg)];
}