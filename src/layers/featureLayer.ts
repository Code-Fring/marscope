/**
 * Feature layer for IAU Gazetteer named features
 * Loads pre-fetched feature data from local JSON
 */

import L from 'leaflet';
import { MarsCRS } from '@/projections/crs';
import { IAU_METADATA } from '@/constants/mars';

export interface Feature {
  id: number;
  name: string;
  cleanName: string;
  target: string;
  type: string;
  lat: number;
  lon: number; // Planetocentric, +East 0-360
  diameterKm?: number;
  approvalStatus: string;
  approvalDate?: string;
  origin?: string;
  reference?: string;
  quad?: string;
}

export interface FeatureSearchResult {
  feature: Feature;
  distanceKm: number;
  bearingDeg: number;
}

/**
 * Load features from local JSON file
 */
export async function loadFeatures(): Promise<Feature[]> {
  try {
    const response = await fetch('/data/mars_features.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.features || [];
  } catch (error) {
    console.error('Failed to load features:', error);
    return [];
  }
}

/**
 * Create KD-tree for fast nearest-neighbor search
 * Simple implementation for 2D points (lat, lon)
 */
export class FeatureKDTree {
  private root: KDNode | null = null;
  private features: Feature[] = [];

  constructor(features: Feature[]) {
    this.features = features.filter(f => f.target === 'Mars');
    this.build(this.features);
  }

  private build(features: Feature[], depth: number = 0): KDNode | null {
    if (features.length === 0) return null;

    const axis = depth % 2; // 0 = lat, 1 = lon
    features.sort((a, b) => (axis === 0 ? a.lat - b.lat : a.lon - b.lon));
    const median = Math.floor(features.length / 2);

    return {
      feature: features[median],
      left: this.build(features.slice(0, median), depth + 1),
      right: this.build(features.slice(median + 1), depth + 1),
      axis,
    };
  }

  /**
   * Find nearest features to a point
   */
  nearest(lat: number, lon: number, k: number = 10): FeatureSearchResult[] {
    const results: FeatureSearchResult[] = [];
    const target = { lat, lon };

    const search = (node: KDNode | null) => {
      if (!node) return;

      const feature = node.feature;
      // Haversine distance
      const dLat = (feature.lat - lat) * Math.PI / 180;
      const dLon = (feature.lon - lon) * Math.PI / 180;
      const lat1 = lat * Math.PI / 180;
      const lat2 = feature.lat * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
      const c = 2 * Math.asin(Math.min(1, Math.sqrt(a)));
      const distKm = 3396.19 * c; // Mars radius in km

      results.push({ feature, distanceKm: distKm, bearingDeg: 0 });

      // Keep only top k
      results.sort((a, b) => a.distanceKm - b.distanceKm);
      if (results.length > k) results.pop();

      const axis = node.axis;
      const diff = axis === 0 ? lat - feature.lat : lon - feature.lon;
      const first = diff <= 0 ? node.left : node.right;
      const second = diff <= 0 ? node.right : node.left;

      if (first) search(first);
      if (second && (results.length < k || Math.abs(diff) < results[results.length - 1]?.distanceKm || 0)) {
        search(second);
      }
    };

    search(this.root);
    return results;
  }
}

interface KDNode {
  feature: Feature;
  left: KDNode | null;
  right: KDNode | null;
  axis: number;
}

/**
 * Create Leaflet marker layer for features
 */
export function createFeatureMarkers(
  features: Feature[],
  onClick: (feature: Feature) => void
): L.LayerGroup {
  const group = L.layerGroup();

  features.forEach(feature => {
    const marker = L.circleMarker(
      [feature.lat, feature.lon - 180], // Convert 0-360 to -180-180 for Leaflet display
      {
        radius: 4,
        color: '#ffaa00',
        fillColor: '#ffcc00',
        fillOpacity: 0.8,
        weight: 1,
      }
    );

    marker.bindTooltip(`${feature.name} (${feature.type})`, {
      permanent: false,
      direction: 'top',
      offset: [0, -8],
    });

    marker.on('click', () => onClick(feature));
    group.addLayer(marker);
  });

  return group;
}

/**
 * Format feature for display in sidebar
 */
export function formatFeatureForDisplay(feature: Feature): string {
  const lines = [
    `<strong>${feature.name}</strong>`,
    `<span class="feature-type">${feature.type}</span>`,
    `Lat: ${feature.lat.toFixed(4)}°`,
    `Lon: ${feature.lon.toFixed(4)}° (+E 0-360)`,
    `Lon: ${(feature.lon > 180 ? feature.lon - 360 : feature.lon).toFixed(4)}° (±180)`,
  ];

  if (feature.diameterKm) {
    lines.push(`Diameter: ${feature.diameterKm.toFixed(1)} km`);
  }
  if (feature.approvalStatus) {
    lines.push(`Status: ${feature.approvalStatus}`);
  }
  if (feature.approvalDate) {
    lines.push(`Approved: ${feature.approvalDate}`);
  }
  if (feature.origin) {
    lines.push(`Origin: ${feature.origin}`);
  }
  if (feature.reference) {
    lines.push(`Ref: ${feature.reference}`);
  }

  lines.push(
    `<hr><small>Source: ${IAU_METADATA.name} | ${IAU_METADATA.authority} | ${IAU_METADATA.maintainer}</small>`
  );

  return lines.join('<br>');
}

/**
 * Search features by name (case-insensitive substring)
 */
export function searchFeaturesByName(features: Feature[], query: string): Feature[] {
  const lower = query.toLowerCase();
  return features.filter(f =>
    f.name.toLowerCase().includes(lower) ||
    f.cleanName.toLowerCase().includes(lower) ||
    f.type.toLowerCase().includes(lower)
  );
}