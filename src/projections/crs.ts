/**
 * Leaflet CRS definitions for Mars
 * Registers custom projections for Mars mapping
 */

import L from 'leaflet';
import proj4 from 'proj4';
import { MARS } from '@/constants/mars';

/**
 * PROJ4 string for Mars Simple Cylindrical (Equirectangular) projection
 * Matches MOLA DEM grid: planetocentric, +East 0-360, sphere radius 3396190m
 */
export const MARS_SIMPLE_CYLINDRICAL_PROJ4 = 
  '+proj=eqc +lat_ts=0 +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +R=3396190 +units=m +no_defs';

/**
 * PROJ4 string for Mars Azimuthal Equidistant projection
 * Center point must be substituted
 */
export function marsAeqdProj4(centerLat: number, centerLon: number): string {
  return `+proj=aeqd +lat_0=${centerLat} +lon_0=${centerLon} +R=3396190 +units=m +no_defs`;
}

/**
 * Register PROJ4 definitions
 */
export function registerMarsProjections(): void {
  proj4.defs('MARS:SIMPLE_CYLINDRICAL', MARS_SIMPLE_CYLINDRICAL_PROJ4);
  // AEQD definitions are created dynamically per center point
}

/**
 * Leaflet CRS for Mars Simple Cylindrical (global view)
 * Bounds: [-180, -90] to [180, 90] in degrees
 * World size at zoom 0: 256x256 px (covers full Mars circumference)
 */
export const MarsSimpleCylindricalCRS = L.CRS.projection(
  L.Projection.Mercator, // We'll override with custom
  // Custom transformation from degrees to map pixels
  (latLng: L.LatLng) => {
    // Convert planetocentric lat/lon to map pixels at zoom 0
    // 360 degrees = 256 pixels at zoom 0
    const x = (latLng.lng + 180) / 360 * 256;
    const y = (90 - latLng.lat) / 180 * 256;
    return L.point(x, y);
  },
  (point: L.Point, zoom: number) => {
    // Inverse: map pixels to lat/lng
    const scale = 256 * Math.pow(2, zoom);
    const lng = (point.x / scale) * 360 - 180;
    const lat = 90 - (point.y / scale) * 180;
    return L.latLng(lat, lng);
  }
);

// Better: Use L.CRS.EPSG3395 as base and override
// Actually, let's create a proper simple cylindrical CRS

function createSimpleCylindricalCRS() {
  const R = MARS.RADIUS_M;
  const circum = 2 * Math.PI * R;

  return L.extend({}, L.CRS, {
    code: 'MARS:SIMPLE_CYLINDRICAL',
    projection: {
      project: (latlng: L.LatLng) => {
        // Simple cylindrical: x = lon * R, y = lat * R (at equator)
        // But Leaflet expects pixels at zoom 0
        // World width at zoom 0 = 256 px = Mars circumference
        const x = (latlng.lng + 180) / 360 * 256;
        const y = (90 - latlng.lat) / 180 * 256;
        return L.point(x, y);
      },
      unproject: (point: L.Point) => {
        const lng = (point.x / 256) * 360 - 180;
        const lat = 90 - (point.y / 256) * 180;
        return L.latLng(lat, lng);
      },
      bounds: L.bounds([-256, -256], [256, 256]),
    },
    transformation: new L.Transformation(1, 0, -1, 0), // Identity
    scale: (zoom: number) => 256 * Math.pow(2, zoom),
    zoom: (scale: number) => Math.log(scale / 256) / Math.LN2,
    distance: (latlng1: L.LatLng, latlng2: L.LatLng) => {
      // Haversine on Mars sphere
      const toRad = Math.PI / 180;
      const dLat = (latlng2.lat - latlng1.lat) * toRad;
      const dLon = (latlng2.lng - latlng1.lng) * toRad;
      const lat1 = latlng1.lat * toRad;
      const lat2 = latlng2.lat * toRad;
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
      const c = 2 * Math.asin(Math.min(1, Math.sqrt(a)));
      return MARS.RADIUS_M * c;
    },
    infinite: false,
    wrapLng: [-180, 180],
    wrapLat: [-90, 90],
  });
}

export const MarsCRS = createSimpleCylindricalCRS();

/**
 * Get tile layer URL for Mars simple cylindrical tiles
 * Expected tile scheme: {z}/{x}/{y}.png where:
 * - z = zoom level
 * - x = column (0 to 2^z - 1), 0 = -180°
 * - y = row (0 to 2^z - 1), 0 = +90° (North)
 */
export function getMarsTileUrl(
  baseUrl: string,
  subdomains?: string
): string {
  return baseUrl.replace('{s}', subdomains || '');
}

/**
 * Convert lat/lng to tile coordinates at zoom level
 */
export function latLngToTile(
  lat: number,
  lng: number,
  zoom: number
): { x: number; y: number } {
  const n = 2 ** zoom;
  const x = ((lng + 180) / 360) * n;
  const y = ((90 - lat) / 180) * n;
  return { x: Math.floor(x), y: Math.floor(y) };
}

/**
 * Convert tile coordinates to lat/lng bounds
 */
export function tileToBounds(
  x: number,
  y: number,
  zoom: number
): { north: number; south: number; east: number; west: number } {
  const n = 2 ** zoom;
  const west = (x / n) * 360 - 180;
  const east = ((x + 1) / n) * 360 - 180;
  const north = 90 - (y / n) * 180;
  const south = 90 - ((y + 1) / n) * 180;
  return { north, south, east, west };
}