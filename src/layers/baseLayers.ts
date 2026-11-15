/**
 * Base layer definitions for Mars map
 * All layers use Mars CRS (Simple Cylindrical, Planetocentric, +East 0-360)
 */

import L from 'leaflet';
import { MarsCRS } from '@/projections/crs';
import { MOLA_METADATA } from '@/constants/mars';

export interface BaseLayerConfig {
  id: string;
  name: string;
  layer: L.TileLayer;
  attribution: string;
  metadata: {
    source: string;
    instrument?: string;
    resolution?: string;
    coverage?: string;
    url?: string;
  };
  visible: boolean;
  opacity: number;
}

/**
 * Create MOLA Hillshade tile layer
 * Uses backend tile service (FastAPI + rio-tiler) or fallback
 */
export function createMolaHillshadeLayer(apiBaseUrl: string): L.TileLayer {
  return L.tileLayer(`${apiBaseUrl}/tiles/mola_hillshade/{z}/{x}/{y}.png`, {
    attribution: `MOLA Hillshade | ${MOLA_METADATA.team}; ${MOLA_METADATA.originator}; ${MOLA_METADATA.publisher}`,
    maxZoom: 12,
    minZoom: 0,
    tileSize: 256,
    crossOrigin: 'anonymous',
  });
}

/**
 * Create MOLA Colorized Elevation tile layer
 */
export function createMolaColorLayer(apiBaseUrl: string): L.TileLayer {
  return L.tileLayer(`${apiBaseUrl}/tiles/mola_color/{z}/{x}/{y}.png`, {
    attribution: `MOLA Elevation | ${MOLA_METADATA.team}; ${MOLA_METADATA.originator}; ${MOLA_METADATA.publisher}`,
    maxZoom: 12,
    minZoom: 0,
    tileSize: 256,
    crossOrigin: 'anonymous',
  });
}

/**
 * Create MOLA Slope tile layer (derived)
 */
export function createMolaSlopeLayer(apiBaseUrl: string): L.TileLayer {
  return L.tileLayer(`${apiBaseUrl}/tiles/mola_slope/{z}/{x}/{y}.png`, {
    attribution: `MOLA Slope (derived) | ${MOLA_METADATA.team}; ${MOLA_METADATA.originator}; ${MOLA_METADATA.publisher}`,
    maxZoom: 12,
    minZoom: 0,
    tileSize: 256,
    crossOrigin: 'anonymous',
  });
}

/**
 * Fallback: Create a basic grid overlay when tiles unavailable
 */
export function createGridOverlay(): L.GridLayer {
  return L.gridLayer({
    maxZoom: 12,
    minZoom: 0,
    tileSize: 256,
    createTile: (coords, done) => {
      const tile = document.createElement('canvas');
      tile.width = 256;
      tile.height = 256;
      const ctx = tile.getContext('2d')!;
      
      // Draw subtle grid
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(128, 0); ctx.lineTo(128, 256);
      ctx.moveTo(0, 128); ctx.lineTo(256, 128);
      ctx.stroke();
      
      // Tile coordinates label
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.font = '10px monospace';
      ctx.fillText(`${coords.z}/${coords.x}/${coords.y}`, 5, 15);
      
      done(null, tile);
    },
  });
}

/**
 * Placeholder layers for future data sources
 * These will be replaced when tile endpoints are discovered
 */

export function createThemisDayIrLayer(_apiBaseUrl: string): L.TileLayer {
  // Placeholder - returns transparent layer
  return L.tileLayer('', {
    attribution: 'THEMIS Day IR (placeholder) | NASA/JPL/ASU',
    maxZoom: 12,
    minZoom: 0,
  });
}

export function createThemisNightIrLayer(_apiBaseUrl: string): L.TileLayer {
  return L.tileLayer('', {
    attribution: 'THEMIS Night IR (placeholder) | NASA/JPL/ASU',
    maxZoom: 12,
    minZoom: 0,
  });
}

export function createCtXLayer(_apiBaseUrl: string): L.TileLayer {
  return L.tileLayer('', {
    attribution: 'CTX (placeholder) | NASA/JPL/MSSS',
    maxZoom: 12,
    minZoom: 0,
  });
}

export function createHiRiseLayer(_apiBaseUrl: string): L.TileLayer {
  return L.tileLayer('', {
    attribution: 'HiRISE (placeholder) | NASA/JPL/UArizona',
    maxZoom: 12,
    minZoom: 0,
  });
}

/**
 * Layer registry with metadata
 */
export const BASE_LAYERS: Record<string, BaseLayerConfig> = {
  mola_hillshade: {
    id: 'mola_hillshade',
    name: 'MOLA Hillshade',
    layer: null as any, // Created at runtime with API URL
    attribution: MOLA_METADATA.citation,
    metadata: {
      source: 'MGS MOLA DEM 463m',
      instrument: 'Mars Orbiter Laser Altimeter',
      mission: 'Mars Global Surveyor',
      resolution: '463 m/pixel',
      coverage: 'Global',
      url: MOLA_METADATA.productPage,
    },
    visible: true,
    opacity: 1,
  },
  mola_color: {
    id: 'mola_color',
    name: 'MOLA Colorized Elevation',
    layer: null as any,
    attribution: MOLA_METADATA.citation,
    metadata: {
      source: 'MGS MOLA DEM 463m',
      instrument: 'Mars Orbiter Laser Altimeter',
      mission: 'Mars Global Surveyor',
      resolution: '463 m/pixel',
      coverage: 'Global',
      url: MOLA_METADATA.productPage,
    },
    visible: false,
    opacity: 1,
  },
  mola_slope: {
    id: 'mola_slope',
    name: 'MOLA Slope (Derived)',
    layer: null as any,
    attribution: `${MOLA_METADATA.citation} | Slope derived via Horn's method`,
    metadata: {
      source: 'MGS MOLA DEM 463m (derived)',
      instrument: 'Mars Orbiter Laser Altimeter',
      mission: 'Mars Global Surveyor',
      resolution: '463 m/pixel',
      coverage: 'Global',
      derivation: "Horn's method on 3x3 neighborhood",
      caveat: 'Derived measurement - limited by 463m source resolution',
    },
    visible: false,
    opacity: 0.8,
  },
  themis_day_ir: {
    id: 'themis_day_ir',
    name: 'THEMIS Day IR',
    layer: null as any,
    attribution: 'THEMIS Day IR | NASA/JPL/ASU',
    metadata: {
      source: 'Mars Odyssey THEMIS',
      instrument: 'Thermal Emission Imaging System',
      resolution: '100 m/pixel',
      coverage: 'Global',
      url: 'https://themis.asu.edu/',
    },
    visible: false,
    opacity: 1,
  },
  themis_night_ir: {
    id: 'themis_night_ir',
    name: 'THEMIS Night IR',
    layer: null as any,
    attribution: 'THEMIS Night IR | NASA/JPL/ASU',
    metadata: {
      source: 'Mars Odyssey THEMIS',
      instrument: 'Thermal Emission Imaging System',
      resolution: '100 m/pixel',
      coverage: 'Global',
      url: 'https://themis.asu.edu/',
    },
    visible: false,
    opacity: 1,
  },
  ctx: {
    id: 'ctx',
    name: 'CTX Mosaic',
    layer: null as any,
    attribution: 'CTX | NASA/JPL/MSSS',
    metadata: {
      source: 'MRO Context Camera',
      instrument: 'Context Camera',
      resolution: '5-6 m/pixel',
      coverage: '>99% Mars',
      url: 'https://pds-geosciences.wustl.edu/missions/mro/ctx.html',
    },
    visible: false,
    opacity: 1,
  },
  hirise: {
    id: 'hirise',
    name: 'HiRISE Orthoimages',
    layer: null as any,
    attribution: 'HiRISE | NASA/JPL/UArizona',
    metadata: {
      source: 'MRO HiRISE',
      instrument: 'High Resolution Imaging Science Experiment',
      resolution: '0.25-0.5 m/pixel',
      coverage: '~3% Mars (targeted)',
      url: 'https://www.uahirise.org/',
    },
    visible: false,
    opacity: 1,
  },
};

/**
 * Create all base layers with API base URL
 */
export function createBaseLayers(apiBaseUrl: string): Record<string, L.TileLayer> {
  return {
    mola_hillshade: L.tileLayer(`${apiBaseUrl}/tiles/mola_hillshade/{z}/{x}/{y}.png`, {
      attribution: `MOLA Hillshade | ${MOLA_METADATA.team}; ${MOLA_METADATA.originator}; ${MOLA_METADATA.publisher}`,
      maxZoom: 12,
      minZoom: 0,
      tileSize: 256,
      crossOrigin: 'anonymous',
    }),
    mola_color: L.tileLayer(`${apiBaseUrl}/tiles/mola_color/{z}/{x}/{y}.png`, {
      attribution: `MOLA Elevation | ${MOLA_METADATA.team}; ${MOLA_METADATA.originator}; ${MOLA_METADATA.publisher}`,
      maxZoom: 12,
      minZoom: 0,
      tileSize: 256,
      crossOrigin: 'anonymous',
    }),
    mola_slope: L.tileLayer(`${apiBaseUrl}/tiles/mola_slope/{z}/{x}/{y}.png`, {
      attribution: `MOLA Slope (derived) | ${MOLA_METADATA.team}; ${MOLA_METADATA.originator}; ${MOLA_METADATA.publisher}`,
      maxZoom: 12,
      minZoom: 0,
      tileSize: 256,
      crossOrigin: 'anonymous',
    }),
    themis_day_ir: L.tileLayer('', {
      attribution: 'THEMIS Day IR (placeholder) | NASA/JPL/ASU',
      maxZoom: 12,
      minZoom: 0,
    }),
    themis_night_ir: L.tileLayer('', {
      attribution: 'THEMIS Night IR (placeholder) | NASA/JPL/ASU',
      maxZoom: 12,
      minZoom: 0,
    }),
    ctx: L.tileLayer('', {
      attribution: 'CTX (placeholder) | NASA/JPL/MSSS',
      maxZoom: 12,
      minZoom: 0,
    }),
    hirise: L.tileLayer('', {
      attribution: 'HiRISE (placeholder) | NASA/JPL/UArizona',
      maxZoom: 12,
      minZoom: 0,
    }),
  };
}