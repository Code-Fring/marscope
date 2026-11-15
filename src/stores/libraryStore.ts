// Library store for MARSCOPE frontend.
// Manages scientific research library state and API interactions.

import { signal, computed } from '@preact/signals';
import { ResearchResource, LibrarySearchResponse, ResourceDetailResponse, LibraryStatsResponse } from '@/api/client';

export interface LibraryState {
  resources: any[] | null;
  currentResource: any | null;
  stats: any | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  currentPage: number;
  pageSize: number;
  totalResults: number;
  selectedCategory: string | null;
  selectedSource: string | null;
  categories: string[];
  sources: string[];
}

export const libraryState = signal<any>({
  resources: null,
  currentResource: null,
  stats: null,
  loading: false,
  error: null,
  searchQuery: '',
  currentPage: 1,
  pageSize: 20,
  totalResults: 0,
  selectedCategory: null,
  selectedSource: null,
  categories: [],
  sources: [],
});

export const libraryResources = computed(() => libraryState.value.resources);
export const currentResource = computed(() => libraryState.value.currentResource);
export const libraryLoading = computed(() => libraryState.value.loading);
export const libraryError = computed(() => libraryState.value.error);
export const librarySearchQuery = computed(() => libraryState.value.searchQuery);
export const libraryCurrentPage = computed(() => libraryState.value.currentPage);
export const libraryPageSize = computed(() => libraryState.value.pageSize);
export const libraryTotalResults = computed(() => libraryState.value.totalResults);
export const libraryCategories = computed(() => libraryState.value.categories);
export const librarySources = computed(() => libraryState.value.sources);
export const librarySelectedCategory = computed(() => libraryState.value.selectedCategory);
export const librarySelectedSource = computed(() => libraryState.value.selectedSource);

export async function searchLibrary(query: string, options?: {
  category?: string;
  source?: string;
  page?: number;
  pageSize?: number;
}) {
  libraryState.value = { ...libraryState.value, loading: true, error: null, searchQuery: query || '' };
  try {
    const { searchLibrary } = await import('@/api/client');
    const data = await searchLibrary(query, options?.category, options?.source, options?.page, options?.pageSize);
    libraryState.value = {
      ...libraryState.value,
      resources: data?.resources || [],
      totalResults: data?.total || 0,
      currentPage: data?.page || 1,
      pageSize: data?.page_size || 20,
      loading: false,
    };
  } catch (error: any) {
    libraryState.value = { ...libraryState.value, error: error.message, loading: false };
  }
}

export async function fetchResource(resourceId: string) {
  libraryState.value = { ...libraryState.value, loading: true, error: null };
  try {
    const { getResource } = await import('@/api/client');
    const data = await getResource(resourceId);
    libraryState.value = { ...libraryState.value, currentResource: data, loading: false };
    return data;
  } catch (error: any) {
    libraryState.value = { ...libraryState.value, error: error.message, loading: false };
    throw error;
  }
}

export async function fetchStats() {
  libraryState.value = { ...libraryState.value, loading: true, error: null };
  try {
    const { getLibraryStats } = await import('@/api/client');
    const data = await getLibraryStats();
    libraryState.value = { ...libraryState.value, stats: data, loading: false };
  } catch (error: any) {
    libraryState.value = { ...libraryState.value, error: error.message, loading: false };
  }
}

export async function fetchCategories() {
  try {
    const { getCategories } = await import('@/api/client');
    const data = await getCategories();
    libraryState.value = { ...libraryState.value, categories: data };
  } catch (error: any) {
    console.error('Failed to fetch categories:', error);
  }
}

export async function fetchSources() {
  try {
    const { getSources } = await import('@/api/client');
    const data = await getSources();
    libraryState.value = { ...libraryState.value, sources: data };
  } catch (error: any) {
    console.error('Failed to fetch sources:', error);
  }
}

export function setSearchQuery(query: string) {
  libraryState.value = { ...libraryState.value, searchQuery: query };
}

export function setCategory(category: string | null) {
  libraryState.value = { ...libraryState.value, selectedCategory: category };
}

export function setSource(source: string | null) {
  libraryState.value = { ...libraryState.value, selectedSource: source };
}

export function setPage(page: number) {
  libraryState.value = { ...libraryState.value, currentPage: page };
}

export function setPageSize(size: number) {
  libraryState.value = { ...libraryState.value, pageSize: size };
}

export function clearLibraryData() {
  libraryState.value = {
    resources: null,
    currentResource: null,
    stats: null,
    loading: false,
    error: null,
    searchQuery: '',
    currentPage: 1,
    pageSize: 20,
    totalResults: 0,
    selectedCategory: null,
    selectedSource: null,
    categories: [],
    sources: [],
  };
}

export const filteredResources = computed(() => {
  const resources = libraryState.value.resources || [];
  return resources;
});

export const libraryHasResults = computed(() => (libraryState.value.resources?.length || 0) > 0);
export const libraryIsEmpty = computed(() => !libraryState.value.loading && libraryState.value.searchQuery && (libraryState.value.resources?.length || 0) === 0);