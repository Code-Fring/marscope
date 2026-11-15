// Survival store for MARSCOPE frontend.
// Manages survival assessment state and API interactions.

import { signal, computed } from '@preact/signals';
import { SurvivalAssessment, SurvivalComparisonResponse } from '@/api/client';
import { validate_latitude, validate_longitude } from '@/state/mapStore';

export interface SurvivalState {
  assessment: any | null;
  comparison: any | null;
  loading: boolean;
  error: string | null;
  lastLocation: { lat: number; lon: number } | null;
}

export const survivalState = signal<SurvivalState>({
  assessment: null,
  comparison: null,
  loading: false,
  error: null,
  lastLocation: null,
});

export const survivalAssessment = computed(() => survivalState.value.assessment);
export const survivalComparison = computed(() => survivalState.value.comparison);
export const survivalLoading = computed(() => survivalState.value.loading);
export const survivalError = computed(() => survivalState.value.error);

export async function fetchSurvivalAssessment(lat: number, lon: number, season?: string) {
  survivalState.value = { ...survivalState.value, loading: true, error: null, lastLocation: { lat, lon } };
  try {
    const { getSurvivalAssessment } = await import('@/api/client');
    const data = await getSurvivalAssessment(lat, lon, undefined);
    survivalState.value = { ...survivalState.value, assessment: data, loading: false };
  } catch (error: any) {
    survivalState.value = { ...survivalState.value, error: error.message, loading: false };
  }
}

export async function fetchSurvivalComparison(locations: string) {
  survivalState.value = { ...survivalState.value, loading: true, error: null };
  try {
    const { compareLocations } = await import('@/api/client');
    const data = await compareLocations(locations);
    survivalState.value = { ...survivalState.value, comparison: data, loading: false };
  } catch (error: any) {
    survivalState.value = { ...survivalState.value, error: error.message, loading: false };
  }
}

export function clearSurvivalData() {
  survivalState.value = {
    assessment: null,
    comparison: null,
    loading: false,
    error: null,
    lastLocation: null,
  };
}

export const survivalScore = computed(() => survivalState.value.assessment?.overall_survivability_score ?? 0);
export const survivalLimitingFactors = computed(() => survivalState.value.assessment?.limiting_factors ?? []);
export const survivalCategories = computed(() => {
  const a = survivalState.value.assessment;
  if (!a) return [];
  return [
    { name: 'Atmospheric', score: 20, weight: 0.2, metrics: a.atmospheric },
    { name: 'Radiation', score: 25, weight: 0.25, metrics: a.radiation },
    { name: 'Thermal', score: 20, weight: 0.2, metrics: a.thermal },
    { name: 'Water', score: 20, weight: 0.2, metrics: a.water },
    { name: 'Hazards', score: 15, weight: 0.15, metrics: a.hazards },
  ];
});