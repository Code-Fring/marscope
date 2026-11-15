// Climate store for MARSCOPE frontend.
// Manages climate/weather state and API interactions.

import { signal, computed } from '@preact/signals';
import { getWeather, getNormals, getDustStorms, getSolarIllumination, WeatherObservation, ClimateNormals, DustStormEvent, SolarIllumination } from '@/api/client';
import { validate_latitude, validate_longitude } from '@/state/mapStore';

export interface ClimateState {
  weather: WeatherObservation[] | null;
  normals: ClimateNormals | null;
  dustStorms: any[] | null;
  solarIllumination: any | null;
  loading: boolean;
  error: string | null;
  lastLocation: { lat: number; lon: number } | null;
  dateRange: { start: string; end: string } | null;
}

export const climateState = signal<ClimateState>({
  weather: null,
  normals: null,
  dustStorms: null,
  solarIllumination: null,
  loading: false,
  error: null,
  lastLocation: null,
  dateRange: null,
});

export const weatherObservations = computed(() => climateState.value.weather);
export const climateNormals = computed(() => climateState.value.normals);
export const dustStorms = computed(() => climateState.value.dustStorms);
export const solarIllumination = computed(() => climateState.value.solarIllumination);
export const climateLoading = computed(() => climateState.value.loading);
export const climateError = computed(() => climateState.value.error);

export async function fetchWeather(lat: number, lon: number, start?: string, end?: string, source?: string) {
  climateState.value = { ...climateState.value, loading: true, error: null, lastLocation: { lat, lon } };
  try {
    const { getWeather } = await import('@/api/client');
    const data = await getWeather(lat, lon, undefined, undefined, undefined);
    climateState.value = { ...climateState.value, weather: data?.observations || [], loading: false };
  } catch (error: any) {
    climateState.value = { ...climateState.value, error: error.message, loading: false };
  }
}

export async function fetchNormals(lat: number, lon: number) {
  climateState.value = { ...climateState.value, loading: true, error: null };
  try {
    const { getNormals } = await import('@/api/client');
    const data = await getNormals(lat, lon);
    climateState.value = { ...climateState.value, normals: data, loading: false };
  } catch (error: any) {
    climateState.value = { ...climateState.value, error: error.message, loading: false };
  }
}

export async function fetchDustStorms(lat: number, lon: number, season?: string) {
  climateState.value = { ...climateState.value, loading: true, error: null };
  try {
    const { getDustStorms } = await import('@/api/client');
    const data = await getDustStorms(lat, lon, undefined);
    climateState.value = { ...climateState.value, dustStorms: data, loading: false };
  } catch (error: any) {
    climateState.value = { ...climateState.value, error: error.message, loading: false };
  }
}

export async function fetchSolarIllumination(lat: number, lon: number, date?: string) {
  climateState.value = { ...climateState.value, loading: true, error: null };
  try {
    const { getSolarIllumination } = await import('@/api/client');
    const data = await getSolarIllumination(lat, lon, undefined);
    climateState.value = { ...climateState.value, solarIllumination: data, loading: false };
  } catch (error: any) {
    climateState.value = { ...climateState.value, error: error.message, loading: false };
  }
}

export function clearClimateData() {
  climateState.value = {
    weather: null,
    normals: null,
    dustStorms: null,
    solarIllumination: null,
    loading: false,
    error: null,
    lastLocation: null,
    dateRange: null,
  };
}