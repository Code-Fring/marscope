/**
 * API client for backend services
 * All endpoints are optional - graceful degradation if backend unavailable
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface ElevationResponse {
  elevation: number; // metres
  source: string;
  resolution: string;
  accuracy: string;
  method: 'direct' | 'interpolated';
}

export interface ProfilePoint {
  lat: number;
  lon: number;
  elev: number;
  dist: number; // metres from start
}

export interface ProfileResponse {
  points: ProfilePoint[];
  totalDistance: number;
  cumulativeAscent: number;
  cumulativeDescent: number;
  maxSlope: number;
  minElevation: number;
  maxElevation: number;
  source: string;
  resolution: string;
  method: string;
}

export interface SlopeResponse {
  slope: number; // degrees
  aspect: number; // degrees from north
  source: string;
  resolution: string;
  method: string;
}

export interface RouteResponse {
  waypoints: Array<{ lat: number; lon: number }>;
  totalDistance: number;
  cumulativeAscent: number;
  cumulativeDescent: number;
  maxSlope: number;
  segments: Array<{
    start: { lat: number; lon: number };
    end: { lat: number; lon: number };
    distance: number;
    ascent: number;
    descent: number;
    maxSlope: number;
  }>;
  source: string;
  resolution: string;
  caveat: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new ApiError(response.status, `API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(408, 'Request timeout');
    }
    throw new ApiError(0, `Network error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

/**
 * Get elevation at a single point
 */
export async function getElevation(lat: number, lon: number): Promise<ElevationResponse | null> {
  try {
    const url = `${API_BASE}/elevation?lat=${lat}&lon=${lon}`;
    return await fetchJson<ElevationResponse>(url);
  } catch (error) {
    console.warn('Elevation query failed:', error);
    return null;
  }
}

/**
 * Get elevation profile along a line
 * coords: "lat1,lon1;lat2,lon2;..." or "lat1,lon1,lat2,lon2,..."
 */
export async function getProfile(
  coords: string,
  samples: number = 100
): Promise<ProfileResponse | null> {
  try {
    const url = `${API_BASE}/profile?coords=${encodeURIComponent(coords)}&samples=${samples}`;
    return await fetchJson<ProfileResponse>(url);
  } catch (error) {
    console.warn('Profile query failed:', error);
    return null;
  }
}

/**
 * Get slope at a point
 */
export async function getSlope(lat: number, lon: number): Promise<SlopeResponse | null> {
  try {
    const url = `${API_BASE}/slope?lat=${lat}&lon=${lon}`;
    return await fetchJson<SlopeResponse>(url);
  } catch (error) {
    console.warn('Slope query failed:', error);
    return null;
  }
}

/**
 * Get route metrics for waypoints
 */
export async function getRoute(
  waypoints: Array<{ lat: number; lon: number }>,
  samplesPerSegment: number = 50
): Promise<RouteResponse | null> {
  try {
    const coords = waypoints.map(w => `${w.lat},${w.lon}`).join(';');
    const url = `${API_BASE}/route?coords=${encodeURIComponent(coords)}&samples=${samplesPerSegment}`;
    return await fetchJson<RouteResponse>(url);
  } catch (error) {
    console.warn('Route query failed:', error);
    return null;
  }
}

/**
 * Health check
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Format API error for display
 */
export function formatApiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return 'Backend unavailable - using fallback';
    if (error.status === 408) return 'Request timeout';
    if (error.status >= 500) return 'Server error';
    return `Error ${error.status}: ${error.message}`;
  }
  if (error instanceof Error) return error.message;
  return 'Unknown error';
}