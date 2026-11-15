/**
 * Map state management using @preact/signals
 * Reactive state for map center, zoom, layers, and UI
 */

import { signal, computed } from '@preact/signals';
import { MarsCRS } from '@/projections/crs';
import { MARS } from '@/constants/mars';

export interface MapViewState {
  center: [number, number]; // [lat, lon] in planetocentric +E 0-360
  zoom: number;
}

export interface LayerState {
  baseLayer: string;
  overlays: Record<string, boolean>;
  opacity: Record<string, number>;
}

export interface UIState {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  bottomPanelOpen: boolean;
  activeTab: 'layers' | 'datasets' | 'features';
}

// Initial state
const initialView: MapViewState = {
  center: [0, 0], // Equator, prime meridian
  zoom: 2,
};

const initialLayers: LayerState = {
  baseLayer: 'mola_hillshade',
  overlays: {
    features: true,
    geology: false,
    routes: false,
  },
  opacity: {
    mola_hillshade: 1,
    mola_color: 1,
    mola_slope: 0.8,
    themis_day_ir: 1,
    themis_night_ir: 1,
    ctx: 1,
    hirise: 1,
  },
};

const initialUI: UIState = {
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  bottomPanelOpen: true,
  activeTab: 'layers',
};

// Signals
export const mapView = signal<MapViewState>(initialView);
export const layerState = signal<LayerState>(initialLayers);
export const uiState = signal<UIState>(initialUI);

// Selected location (from click)
export const selectedLocation = signal<{
  lat: number;
  lon: number;
  elevation: number | null;
  elevationSource: string | null;
  features: any[] | null;
  loading: boolean;
} | null>(null);

// Current measurement
export const measurement = signal<{
  type: 'distance' | 'profile' | 'slope' | 'route' | null;
  coordinates: Array<[number, number]>;
  results: any | null;
  loading: boolean;
} | null>(null);

// Current route
export const route = signal<{
  waypoints: Array<{ lat: number; lon: number }>;
  results: any | null;
  loading: boolean;
} | null>(null);

// Error state
export const appError = signal<string | null>(null);

// Computed values
export const currentCenter = computed(() => mapView.value.center);
export const currentZoom = computed(() => mapView.value.zoom);
export const activeBaseLayer = computed(() => layerState.value.baseLayer);
export const visibleOverlays = computed(() => {
  const { overlays } = layerState.value;
  return Object.entries(overlays).filter(([, v]) => v).map(([k]) => k);
});

/**
 * Actions
 */
export function setMapCenter(lat: number, lon: number): void {
  mapView.value = { ...mapView.value, center: [lat, lon] };
}

export function setMapZoom(zoom: number): void {
  mapView.value = { ...mapView.value, zoom: Math.max(0, Math.min(12, zoom)) };
}

export function setBaseLayer(layerId: string): void {
  layerState.value = { ...layerState.value, baseLayer: layerId };
}

export function toggleOverlay(overlayId: string): void {
  const overlays = { ...layerState.value.overlays };
  overlays[overlayId] = !overlays[overlayId];
  layerState.value = { ...layerState.value, overlays };
}

export function setOverlayOpacity(layerId: string, opacity: number): void {
  const opacityMap = { ...layerState.value.opacity };
  opacityMap[layerId] = Math.max(0, Math.min(1, opacity));
  layerState.value = { ...layerState.value, opacity: opacityMap };
}

export function setLeftSidebar(open: boolean): void {
  uiState.value = { ...uiState.value, leftSidebarOpen: open };
}

export function setRightSidebar(open: boolean): void {
  uiState.value = { ...uiState.value, rightSidebarOpen: open };
}

export function setBottomPanel(open: boolean): void {
  uiState.value = { ...uiState.value, bottomPanelOpen: open };
}

export function setActiveTab(tab: UIState['activeTab']): void {
  uiState.value = { ...uiState.value, activeTab: tab };
}

export function setSelectedLocation(data: typeof selectedLocation.value): void {
  selectedLocation.value = data;
}

export function setMeasurement(data: typeof measurement.value): void {
  measurement.value = data;
}

export function setRoute(data: typeof route.value): void {
  route.value = data;
}

export function setError(error: string | null): void {
  appError.value = error;
}

export function clearError(): void {
  appError.value = null;
}

/**
 * Convert map click coordinates to planetocentric +E 0-360
 * Leaflet with MarsCRS returns lat/lon in [-90,90] x [-180,180]
 */
export function leafletToMarsCoords(latlng: L.LatLng): [number, number] {
  let lon = latlng.lng;
  if (lon < 0) lon += 360; // Convert -180..180 to 0..360
  return [latlng.lat, lon];
}

/**
 * Convert Mars coords (0-360) to Leaflet coords (-180..180)
 */
export function marsToLeafletCoords(lat: number, lon: number): L.LatLng {
  let lng = lon;
  if (lng > 180) lng -= 360;
  return L.latLng(lat, lng);
}