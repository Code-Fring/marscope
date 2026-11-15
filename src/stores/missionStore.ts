// Mission store for MARSCOPE frontend.
// Manages mission planning state and API interactions.

import { signal, computed } from '@preact/signals';
import { LandingSiteCandidate, MissionPlan, SiteAnalysisRequest, MissionPlanRequest } from '@/api/client';
import { validate_latitude, validate_longitude } from '@/state/mapStore';

export interface MissionState {
  candidates: any[] | null;
  currentSite: any | null;
  currentPlan: any | null;
  loading: boolean;
  error: string | null;
  selectedWaypoints: any[];
  activeTab: 'analyze' | 'candidates' | 'plan';
}

export const missionState = signal<any>({
  candidates: null,
  currentSite: null,
  currentPlan: null,
  loading: false,
  error: null,
  selectedWaypoints: [],
  activeTab: 'analyze',
});

export const missionCandidates = computed(() => missionState.value.candidates);
export const currentSite = computed(() => missionState.value.currentSite);
export const currentPlan = computed(() => missionState.value.currentPlan);
export const missionLoading = computed(() => missionState.value.loading);
export const missionError = computed(() => missionState.value.error);
export const activeMissionTab = computed(() => missionState.value.activeTab);
export const selectedWaypoints = computed(() => missionState.value.selectedWaypoints);

export async function fetchCandidates(params: {
  min_lat?: number;
  max_lat?: number;
  min_lon?: number;
  max_lon?: number;
  min_score?: number;
  limit?: number;
}) {
  missionState.value = { ...missionState.value, loading: true, error: null };
  try {
    const { getCandidates } = await import('@/api/client');
    const data = await getCandidates(params);
    missionState.value = { ...missionState.value, candidates: data, loading: false };
  } catch (error: any) {
    missionState.value = { ...missionState.value, error: error.message, loading: false };
  }
}

export async function analyzeSite(request: { lat: number; lon: number; radius_km?: number }) {
  missionState.value = { ...missionState.value, loading: true, error: null };
  try {
    const { analyzeSite } = await import('@/api/client');
    const data = await analyzeSite(request);
    missionState.value = { ...missionState.value, currentSite: data, loading: false };
    return data;
  } catch (error: any) {
    missionState.value = { ...missionState.value, error: error.message, loading: false };
    throw error;
  }
}

export async function createMissionPlan(request: any) {
  missionState.value = { ...missionState.value, loading: true, error: null };
  try {
    const { createMissionPlan } = await import('@/api/client');
    const data = await createMissionPlan(request);
    missionState.value = { ...missionState.value, currentPlan: data, loading: false };
    return data;
  } catch (error: any) {
    missionState.value = { ...missionState.value, error: error.message, loading: false };
    throw error;
  }
}

export function addWaypoint(lat: number, lon: number) {
  missionState.value = {
    ...missionState.value,
    selectedWaypoints: [...missionState.value.selectedWaypoints, { lat, lon }]
  };
}

export function removeWaypoint(index: number) {
  missionState.value = {
    ...missionState.value,
    selectedWaypoints: missionState.value.selectedWaypoints.filter((_, i) => i !== index)
  };
}

export function clearWaypoints() {
  missionState.value = { ...missionState.value, selectedWaypoints: [] };
}

export function setActiveTab(tab: 'analyze' | 'candidates' | 'plan') {
  missionState.value = { ...missionState.value, activeTab: tab };
}

export function clearMissionData() {
  missionState.value = {
    candidates: null,
    currentSite: null,
    currentPlan: null,
    loading: false,
    error: null,
    selectedWaypoints: [],
    activeTab: 'analyze',
  };
}

export const candidateScores = computed(() => {
  const c = missionState.value.candidates;
  if (!c) return [];
  return c.map(c => ({
    name: c.name,
    score: c.score,
    lat: c.lat,
    lon: c.lon,
    elevation: c.elevation_m,
  })).sort((a, b) => b.score - a.score);
});