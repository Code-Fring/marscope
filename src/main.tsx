// @ts-nocheck
/**
 * MARSCOPE - Main Entry Point
 * Interactive Martian Exploration and Mission Planning System
 */

import { render, h, Fragment } from 'preact';
import { MarsCRS } from '@/projections/crs';
import { createBaseLayers } from '@/layers/baseLayers';
import { loadFeatures, createFeatureMarkers, Feature } from '@/layers/featureLayer';
import { getElevation, getProfile, getRoute, checkHealth, formatApiError } from '@/api/client';
import { 
  mapView, layerState, uiState, selectedLocation, measurement, route as routeStore, appError,
  setMapCenter, setMapZoom, setBaseLayer, toggleOverlay, setOverlayOpacity,
  setLeftSidebar, setRightSidebar, setBottomPanel, setActiveTab,
  setSelectedLocation, setMeasurement, setRoute, setError, clearError,
  leafletToMarsCoords, marsToLeafletCoords
} from '@/state/mapStore';
import { haversineDistance, bearing, destinationPoint } from '@/projections/aeqd';
import { IAU_METADATA, MOLA_METADATA } from '@/constants/mars';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './styles/main.css';

// Import views
import { ClimateView } from '@/views/ClimateView';
import { SurvivalView } from '@/views/SurvivalView';
import { MissionView } from '@/views/MissionView';
import { GeologyView } from '@/views/GeologyView';
import { WaterView } from '@/views/WaterView';
import { RadiationView } from '@/views/RadiationView';
import { LibraryView } from '@/views/LibraryView';
import { HabitatView } from '@/views/HabitatView';
import { DatasetsView } from '@/views/DatasetsView';

// Global references for Leaflet map and markers
let map: L.Map | null = null;
let featureMarkers: L.LayerGroup | null = null;
let allFeatures: Feature[] = [];
let measurementLayer: L.LayerGroup | null = null;
let routeLayer: L.LayerGroup | null = null;
let currentPositionMarker: L.Marker | null = null;

// Initialize app
async function init() {
  // Register Mars projections
  const { registerMarsProjections } = await import('@/projections/crs');
  registerMarsProjections();

  // Check backend health
  const healthy = await checkHealth();
  if (!healthy) {
    setError('Backend unavailable - elevation/profile/route features limited. Map tiles may not load.');
  }

  // Load features
  allFeatures = await loadFeatures();
  console.log(`Loaded ${allFeatures.length} Mars features`);

  // Create map
  createMap();

  // Render UI
  render(h(App), document.getElementById('app')!);
}

function createMap(): void {
  map = L.map('map', {
    crs: MarsCRS,
    center: [0, 0],
    zoom: 2,
    minZoom: 0,
    maxZoom: 12,
    zoomControl: false,
    attributionControl: false,
    preferCanvas: true,
  });

  // Add base layers
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const layers = createBaseLayers(apiBase);
  layers.mola_hillshade.addTo(map);

  // Store layers for switching
  (window as any).__MARS_LAYERS__ = layers;

  // Add feature markers
  featureMarkers = createFeatureMarkers(allFeatures, onFeatureClick);
  featureMarkers.addTo(map);

  // Measurement layer
  measurementLayer = L.layerGroup().addTo(map);

  // Route layer
  routeLayer = L.layerGroup().addTo(map);

  // Map click handler
  map.on('click', onMapClick);

  // Zoom control
  L.control.zoom({ position: 'topright' }).addTo(map);

  // Attribution control
  L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);

  // Coordinate display
  addCoordinateControl();
}

function addCoordinateControl(): void {
  const control = L.control({ position: 'bottomright' });
  control.onAdd = () => {
    const div = L.DomUtil.create('div', 'coordinate-display');
    div.innerHTML = '<span id="coord-display">Lat: 0.0000°, Lon: 0.0000° (+E 0-360)</span>';
    return div;
  };
  control.addTo(map!);
}

function onMapClick(e: L.LeafletMouseEvent): void {
  const [lat, lon] = leafletToMarsCoords(e.latlng);
  
  // Update coordinate display
  updateCoordinateDisplay(lat, lon);

  // Clear previous position marker
  if (currentPositionMarker) {
    currentPositionMarker.remove();
  }
  currentPositionMarker = L.marker(e.latlng, {
    icon: L.divIcon({
      className: 'position-marker',
      html: '<div class="position-marker-inner"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    }),
  }).addTo(map!);

  // Fetch elevation
  fetchElevationForDisplay(lat, lon);

  // Find nearby features
  findNearbyFeatures(lat, lon);
}

async function fetchElevationForDisplay(lat: number, lon: number): Promise<void> {
  setSelectedLocation({
    lat,
    lon,
    elevation: null,
    elevationSource: null,
    features: null,
    loading: true,
  });

  try {
    const result = await getElevation(lat, lon);
    if (result) {
      setSelectedLocation({
        lat,
        lon,
        elevation: result.elevation,
        elevationSource: `${result.source} (${result.resolution}, ${result.accuracy})`,
        features: selectedLocation.value?.features || null,
        loading: false,
      });
    } else {
      setSelectedLocation({
        lat,
        lon,
        elevation: null,
        elevationSource: 'Unavailable (backend offline)',
        features: selectedLocation.value?.features || null,
        loading: false,
      });
    }
  } catch (error) {
    setSelectedLocation({
      lat,
      lon,
      elevation: null,
      elevationSource: `Error: ${formatApiError(error)}`,
      features: selectedLocation.value?.features || null,
      loading: false,
    });
  }
}

function findNearbyFeatures(lat: number, lon: number): void {
  // Simple linear search for now (k-d tree in featureLayer.ts)
  const nearby = allFeatures
    .filter(f => f.target === 'Mars')
    .map(f => {
      const dLat = (f.lat - lat) * Math.PI / 180;
      const dLon = (f.lon - lon) * Math.PI / 180;
      const lat1 = lat * Math.PI / 180;
      const lat2 = f.lat * Math.PI / 180;
      const a = Math.sin((f.lat - lat) * Math.PI / 360)**2 + 
        Math.cos(lat * Math.PI / 180) * Math.cos(f.lat * Math.PI / 180) * 
        Math.sin((f.lon - lon) * Math.PI / 360)**2;
      const c = 2 * Math.asin(Math.min(1, Math.sqrt(a)));
      const distKm = 3396.19 * c;
      return { feature: f, distanceKm: distKm };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 10);

  setSelectedLocation({
    ...selectedLocation.value!,
    features: nearby.map(n => n.feature),
  });
}

function onFeatureClick(feature: Feature): void {
  // Center map on feature
  const latlng = marsToLeafletCoords(feature.lat, feature.lon);
  map?.setView(latlng, 6);

  // Update sidebar
  setSelectedLocation({
    lat: feature.lat,
    lon: feature.lon,
    elevation: null,
    elevationSource: null,
    features: [feature],
    loading: false,
  });
}

function updateCoordinateDisplay(lat: number, lon: number): void {
  const display = document.getElementById('coord-display');
  if (display) {
    const lon180 = lon > 180 ? lon - 360 : lon;
    display.textContent = `Lat: ${lat.toFixed(4)}°, Lon: ${lon.toFixed(4)}° (+E 0-360) | ${lon180.toFixed(4)}° (±180)`;
  }
}

/**
 * UI Components
 */

function App() {
  return h('{ class: 'app' }', 
    h('{ class: 'app-header' }', 
      h('h1', null, 'MARSCOPE'),
      h('div', { class: 'header-status' }, [
        h('span', { 
          id: 'backend-status', 
          class: appError.value ? 'status-error' : 'status-ok' 
        }, appError.value ? 'Backend: Offline' : 'Backend: Online')
      , 7137)
    , 7164),

    h('{ class: 'app-body' }', 
      // Left Sidebar - PLANETARY SCIENCE Navigation
      h('aside', { 
        class: 'sidebar left', 
        style: { display: uiState.value.leftSidebarOpen ? 'flex' : 'none' } 
      }, [
        h('{ class: 'sidebar-header' }', 
          h('h2', null, 'PLANETARY SCIENCE'),
          h('button', { 
            class: 'sidebar-close',
            onClick: () => setLeftSidebar(false),
            'aria-label': 'Close sidebar'
          }, '◀')
        , 7495),

        h('{ class: 'sidebar-nav' }', 
          h('nav', { class: 'nav-section' }, [
            h('h3', { class: 'nav-section-title' }, 'EXPLORATION'),
            h('ul', { class: 'nav-list' }, [
              h('li', null, [
                h('button', { 
                  class: uiState.value.activeView === 'explorer' ? 'active' : '',
                  onClick: () => setActiveView('explorer')
                }, [
                  h('span', { class: 'nav-icon' }, '🗺️'),
                  h('span', null, 'Mars Explorer')
                , 8008)
              , 7723)
            ])
          ]),

          h('{ class: 'nav-section' }', 
            h('h3', { class: 'nav-section-title' }, 'SURFACE & GEOLOGY'),
            h('{ class: 'nav-list' }', 
              h('li', null, [
                h('button', { 
                  class: uiState.value.activeView === 'geology' ? 'active' : '',
                  onClick: () => setActiveView('geology')
                }, [
                  h('span', { class: 'nav-icon' }, '🪨'),
                  h('span', null, 'Surface Geology')
                , 8614)
              , 8728),
              h('li', null, [
                h('{ 
                  class: uiState.value.activeView === 'water' ? 'active' : '',
                  onClick: () => setActiveView('water')
                }', 
                  h('span', { class: 'nav-icon' }, '💧'),
                  h('span', null, 'Water Resources')
                , 9185)
              ]),
              h('li', null, [
                h('{ 
                  class: uiState.value.activeView === 'radiation' ? 'active' : '',
                  onClick: () => setActiveView('radiation')
                }', 
                  h('span', { class: 'nav-icon' }, '☢️'),
                  h('span', null, 'Radiation Environment')
                , 9550)
              ])
            ])
          ]),

          h('{ class: 'nav-section' }', 
            h('h3', { class: 'nav-section-title' }, 'CLIMATE & WEATHER'),
            h('{ class: 'nav-list' }', 
              h('li', null, [
                h('button', { 
                  class: uiState.value.activeView === 'climate' ? 'active' : '',
                  onClick: () => setActiveView('climate')
                }, [
                  h('span', { class: 'nav-icon' }, '🌡️'),
                  h('span', null, 'Climate & Weather')
                , 9922)
              , 10027)
            ])
          ]),

          h('{ class: 'nav-section' }', 
            h('h3', { class: 'nav-section-title' }, 'SURVIVAL & HABITAT'),
            h('{ class: 'nav-list' }', 
              h('li', null, [
                h('button', { 
                  class: uiState.value.activeView === 'survival' ? 'active' : '',
                  onClick: () => setActiveView('survival')
                }, [
                  h('span', { class: 'nav-icon' }, '🛡️'),
                  h('span', null, 'Survival Assessment')
                , 10489)
              , 10594),
              h('li', null, [
                h('{ 
                  class: uiState.value.activeView === 'habitat' ? 'active' : '',
                  onClick: () => setActiveView('habitat')
                }', 
                  h('span', { class: 'nav-icon' }, '🏠'),
                  h('span', null, 'Habitat Engineering')
                , 11068)
              ])
            ])
          ]),

          h('{ class: 'nav-section' }', 
            h('h3', { class: 'nav-section-title' }, 'MISSION PLANNING'),
            h('{ class: 'nav-list' }', 
              h('li', null, [
                h('button', { 
                  class: uiState.value.activeView === 'mission' ? 'active' : '',
                  onClick: () => setActiveView('mission')
                }, [
                  h('span', { class: 'nav-icon' }, '🚀'),
                  h('span', null, 'Mission Planning')
                , 11434)
              , 11534)
            ])
          ]),

          h('{ class: 'nav-section' }', 
            h('h3', { class: 'nav-section-title' }, 'RESEARCH'),
            h('{ class: 'nav-list' }', 
              h('li', null, [
                h('button', { 
                  class: uiState.value.activeView === 'library' ? 'active' : '',
                  onClick: () => setActiveView('library')
                }, [
                  h('span', { class: 'nav-icon' }, '📚'),
                  h('span', null, 'Scientific Library')
                , 11998)
              , 12090)
            ])
          ]),

          h('{ class: 'nav-section' }', 
            h('h3', { class: 'nav-section-title' }, 'DATASETS'),
            h('{ class: 'nav-list' }', 
              h('li', null, [
                h('button', { 
                  class: uiState.value.activeView === 'datasets' ? 'active' : '',
                  onClick: () => setActiveView('datasets')
                }, [
                  h('span', { class: 'nav-icon' }, '📊'),
                  h('span', null, 'Dataset Catalog')
                , 12556)
              , 12648)
            ])
          ]),

          h('button', { 
            class: 'sidebar-toggle-bottom',
            onClick: () => setLeftSidebar(false),
            'aria-label': 'Close sidebar'
          }, '◀ Close')
        ]),

        // Map Container
        h('{ class: 'map-container' }', 
          h('div', { id: 'map', class: 'map' }),
          
          // Right Sidebar Toggle
          h('button', { 
            class: 'sidebar-toggle right-toggle',
            onClick: () => setRightSidebar(!uiState.value.rightSidebarOpen),
            'aria-label': uiState.value.rightSidebarOpen ? 'Close details' : 'Open details'
          }, uiState.value.rightSidebarOpen ? '▶' : '◀')
        , 13334),

        // Right Sidebar - Context Details
        h('aside', { 
          class: 'sidebar right', 
          style: { display: uiState.value.rightSidebarOpen ? 'flex' : 'none' } 
        }, [
          h('{ class: 'sidebar-header' }', 
            h('h2', null, 'Details'),
            h('button', { 
              class: 'sidebar-close',
              onClick: () => setRightSidebar(false),
              'aria-label': 'Close sidebar'
            }, '▶')
          , 13985),
          h(RightSidebar)
        ])
      ],

      // Bottom Panel - Tools
      h('div', { 
        class: 'bottom-panel', 
        style: { display: uiState.value.bottomPanelOpen ? 'flex' : 'none' } 
      }, [
        h(BottomPanel),
        h('button', { 
          class: 'panel-toggle',
          onClick: () => setBottomPanel(false),
          'aria-label': 'Close panel'
        }, '▲')
      ]),

      // Error Toast
      appError.value && h('div', { class: 'error-toast', onClick: clearError }, appError.value),

      // Attribution Bar
      h('{ class: 'attribution-bar' }', 
        h('div', { class: 'attribution-items' }, [
          h('span', null, `MOLA: ${MOLA_METADATA.team}; ${MOLA_METADATA.originator}; ${MOLA_METADATA.publisher}`),
          h('span', null, `Features: ${IAU_METADATA.authority}`),
          h('span', { class: 'license' }, 'Code: MIT | Data: CC0/Public Domain')
        , 14817)
      ]
    ]);
}

// View components - rendered based on activeView
function ActiveView() {
  const view = uiState.value.activeView || 'explorer';
  
  switch (view) {
    case 'explorer': return h(ExplorerView);
    case 'geology': return h(GeologyView);
    case 'water': return h(WaterView);
    case 'radiation': return h(RadiationView);
    case 'climate': return h(ClimateView);
    case 'survival': return h(SurvivalView);
    case 'habitat': return h(HabitatView);
    case 'mission': return h(MissionView);
    case 'library': return h(LibraryView);
    case 'datasets': return h(DatasetsView);
    default: return h(ExplorerView);
  }
}

function ExplorerView() {
  return h('{ class: 'explorer-view' }', 
    h('{ class: 'view-header' }', 
      h('h2', null, 'Mars Explorer'),
      h('p', { class: 'view-description' }, 'Interactive Mars map with MOLA elevation, feature search, and measurement tools')
    , 15869),
    h('p', { class: 'hint' }, 'Use the left sidebar to switch between different science views')
  );
}

function HabitatView() {
  return h('{ class: 'habitat-view' }', 
    h('div', { class: 'view-header' }, [
      h('h2', null, 'Habitat Engineering'),
      h('p', { class: 'view-description' }, 'Life support, ISRU, habitat design, and environmental control systems')
    , 16260),
    h('{ class: 'habitat-tabs' }', 
      h('button', { class: 'active' }, 'Life Support (ECLSS)'),
      h('button', null, 'ISRU Systems'),
      h('button', null, 'Habitat Architecture'),
      h('button', null, 'Environmental Control'),
      h('button', null, 'Waste Management')
    , 16512),
    h('{ class: 'habitat-content' }', 
      h('div', { class: 'habitat-sidebar' }, [
        h('h3', null, 'ECLSS Subsystems'),
        h('ul', null, [
          h('li', null, 'Atmosphere Revitalization'),
          h('li', null, 'Water Recovery'),
          h('li', null, 'Temperature & Humidity Control'),
          h('li', null, 'Fire Detection & Suppression')
        , 16810),
        h('h3', null, 'ISRU Processes'),
        h('ul', null, [
          h('li', null, 'Sabatier Reaction (CO₂ → CH₄ + O₂)'),
          h('li', null, 'Electrolysis (H₂O → H₂ + O₂)'),
          h('li', null, 'Regolith Processing')
        , 15886)
      ]),
      h('{ class: 'map-placeholder' }', 
        h('p', null, 'Habitat design tools coming soon...')
      , 17448)
    ])
  );
}

function DatasetsView() {
  return h('{ class: 'datasets-view' }', 
    h('{ class: 'view-header' }', 
      h('h2', null, 'Dataset Catalog'),
      h('p', { class: 'view-description' }, 'Browse all integrated and investigated datasets')
    , 17608),
    h('{ class: 'datasets-content' }', 
      h('div', { class: 'datasets-sidebar' }, [
        h('h3', null, 'Filters'),
        h('label', null, [ h('input', { type: 'checkbox' }), ' Integrated Only' , 17835),
        h('select', null, [
          h('option', { value: '' }, 'All Sources'),
          h('option', { value: 'NASA' }, 'NASA'),
          h('option', { value: 'ESA' }, 'ESA'),
          h('option', { value: 'USGS' }, 'USGS')
        , 17625),
        h('select', null, [
          h('option', { value: '' }, 'All Missions'),
          h('option', { value: 'MGS' }, 'Mars Global Surveyor'),
          h('option', { value: 'MRO' }, 'Mars Reconnaissance Orbiter'),
          h('option', { value: 'Odyssey' }, 'Mars Odyssey')
        ])
      ]),
      h('{ class: 'map-placeholder' }', 
        h('p', null, 'Dataset catalog table view coming soon...')
      , 18589)
    ])
  );
}

// Right Sidebar Component
function RightSidebar() {
  const loc = selectedLocation.value;
  
  if (!loc) {
    return h('{ class: 'sidebar-content' }', 
      h('h2', null, 'Location Details'),
      h('p', { class: 'hint' }, 'Click on the map to inspect a location')
    , 18839);
  }

  const lon180 = loc.lon > 180 ? loc.lon - 360 : loc.lon;

  return h('{ class: 'sidebar-content' }', 
    h('h2', null, 'Selected Location'),
    
    h('{ class: 'detail-list' }', 
      h('dt', null, 'Latitude'),
      h('dd', null, `${loc.lat.toFixed(6)}° (Planetocentric)`),
      
      h('dt', null, 'Longitude'),
      h('dd', null, `${loc.lon.toFixed(6)}° (+E 0-360)`),
      h('dd', null, `${lon180.toFixed(6)}° (±180)`),
      
      h('dt', null, 'Elevation'),
      loc.loading ? h('dd', { class: 'loading' }, 'Loading...') : loc.elevation !== null ? h('dd', null, [
        `${loc.elevation.toFixed(1)} m`,
        h('br', null),
        h('small', { class: 'source' }, `Source: ${loc.elevationSource}`),
        h('br', null),
        h('small', { class: 'caveat' }, `Vertical accuracy: ±${MOLA_METADATA.VERTICAL_ACCURACY_M} m | Horizontal: ~${MOLA_METADATA.HORIZONTAL_ACCURACY_M} m`)
      , 19076) : h('dd', { class: 'unavailable' }, 'No data available')
    , 19140),

    loc.features && loc.features.length > 0 && h('{ class: 'nearby-features' }', 
      h('h3', null, 'Nearby Features'),
      h('ul', { class: 'feature-list' }, loc.features.slice(0, 5).map((f: any, i: number) => h('{ 
        key: i, 
        onClick: () => onFeatureClick(f) 
      }', 
        h('strong', null, `${f.name}`), ` (${f.type})`,
        h('br', null),
        h('small', null, `${Math.abs(f.lat - loc.lat).toFixed(4)}°, ${Math.abs(f.lon - loc.lon).toFixed(4)}° away`)
      , 20041))
    , 20189)
  );
}

function BottomPanel() {
  const measure = measurement.value;
  const rt = routeStore.value;

  return h('div', { class: 'bottom-panel-content' }, [
    h('div', { class: 'panel-tabs' }, [
      h('button', { class: measure ? 'active' : '', onClick: () => setMeasurement({ type: 'distance', coordinates: [], results: null, loading: false }) }, 'Measure Distance'),
      h('button', { class: measure?.type === 'profile' ? 'active' : '', onClick: () => setMeasurement({ type: 'profile', coordinates: [], results: null, loading: false }) }, 'Elevation Profile'),
      h('button', { class: rt ? 'active' : '', onClick: () => setRoute({ waypoints: [], results: null, loading: false }) }, 'Route Planner')
    ]),

    h('{ class: 'panel-content' }', 
      measure && measure.type === 'distance' && h(DistanceMeasure),
      measure && measure.type === 'profile' && h(ProfileMeasure),
      rt && h(RoutePlanner)
    , 21231)
  );
}

function DistanceMeasure() {
  return h('{ class: 'measure-tool' }', 
    h('h4', null, 'Distance Measurement'),
    h('p', { class: 'hint' }, 'Click on map to add points. Double-click to finish.'),
    h('p', { class: 'hint' }, 'Uses Mars great-circle distance (R = 3,396.19 km)'),
    h('button', { onClick: () => setMeasurement(null) }, 'Clear')
  );
}

function ProfileMeasure() {
  return h('{ class: 'measure-tool' }', 
    h('h4', null, 'Elevation Profile'),
    h('p', { class: 'hint' }, 'Click on map to draw a line. Elevation sampled from MOLA DEM.'),
    h('p', { class: 'hint' }, 'Derived measurement - limited by 463m source resolution'),
    h('button', { onClick: () => setMeasurement(null) }, 'Clear')
  );
}

function RoutePlanner() {
  return h('div', { class: 'measure-tool' }, [
    h('h4', null, 'Route Planner'),
    h('p', { class: 'hint' }, 'Shift+Click to add waypoints. Computes distance, ascent/descent, max slope.'),
    h('p', { class: 'hint', style: { color: '#ffaa00' } }, '⚠ Candidate route only - no hazard/rock/trafficability/comms/illumination data'),
    h('button', { onClick: () => setRoute(null) }, 'Clear Route')
  );
}

// Right Sidebar Component
function RightSidebar() {
  const loc = selectedLocation.value;
  
  if (!loc) {
    return h('div', { class: 'sidebar-content' }, [
      h('h2', null, 'Location Details'),
      h('p', { class: 'hint' }, 'Click on the map to inspect a location')
    , 21485);
  }

  const lon180 = loc.lon > 180 ? loc.lon - 360 : loc.lon;

  return h('{ class: 'sidebar-content' }', 
    h('h2', null, 'Selected Location'),
    
    h('dl', { class: 'detail-list' }, [
      h('dt', null, 'Latitude'),
      h('dd', null, `${loc.lat.toFixed(6)}° (Planetocentric)`),
      
      h('dt', null, 'Longitude'),
      h('dd', null, `${loc.lon.toFixed(6)}° (+E 0-360)`),
      h('dd', null, `${lon180.toFixed(6)}° (±180)`),
      
      h('dt', null, 'Elevation'),
      loc.loading ? h('dd', { class: 'loading' }, 'Loading...') : loc.elevation !== null ? h('dd', null, [
        `${loc.elevation.toFixed(1)} m`,
        h('br', null),
        h('small', { class: 'source' }, `Source: ${loc.elevationSource}`),
        h('br', null),
        h('small', { class: 'caveat' }, `Vertical accuracy: ±${MOLA_METADATA.VERTICAL_ACCURACY_M} m | Horizontal: ~${MOLA_METADATA.HORIZONTAL_ACCURACY_M} m`)
      , 22976) : h('dd', { class: 'unavailable' }, 'No data available')
    , 21821),

    loc.features && loc.features.length > 0 && h('{ class: 'nearby-features' }', 
      h('h3', null, 'Nearby Features'),
      h('ul', { class: 'feature-list' }, loc.features.slice(0, 5).map((f: any, i: number) => h('{ 
        key: i, 
        onClick: () => onFeatureClick(f) 
      }', 
        h('strong', null, f.name), ` (${f.type})`,
        h('br', null),
        h('small', null, `${Math.abs(f.lat - loc.lat).toFixed(4)}°, ${Math.abs(f.lon - loc.lon).toFixed(4)}° away`)
      , 23941))
    , 24089)
  ]);
}

function BottomPanel() {
  const measure = measurement.value;
  const rt = routeStore.value;

  return h('div', { class: 'bottom-panel-content' }, [
    h('div', { class: 'panel-tabs' }, [
      h('button', { class: measure ? 'active' : '', onClick: () => setMeasurement({ type: 'distance', coordinates: [], results: null, loading: false }) }, 'Measure Distance'),
      h('button', { class: measure?.type === 'profile' ? 'active' : '', onClick: () => setMeasurement({ type: 'profile', coordinates: [], results: null, loading: false }) }, 'Elevation Profile'),
      h('button', { class: rt ? 'active' : '', onClick: () => setRoute({ waypoints: [], results: null, loading: false }) }, 'Route Planner')
    ]),

    h('{ class: 'panel-content' }', 
      measure && measure.type === 'distance' && h(DistanceMeasure),
      measure && measure.type === 'profile' && h(ProfileMeasure),
      rt && h(RoutePlanner)
    , 25127)
  );
}

function DistanceMeasure() {
  return h('{ class: 'measure-tool' }', 
    h('h4', null, 'Distance Measurement'),
    h('p', { class: 'hint' }, 'Click on map to add points. Double-click to finish.'),
    h('p', { class: 'hint' }, 'Uses Mars great-circle distance (R = 3,396.19 km)'),
    h('button', { onClick: () => setMeasurement(null) }, 'Clear')
  );
}

function ProfileMeasure() {
  return h('{ class: 'measure-tool' }', 
    h('h4', null, 'Elevation Profile'),
    h('p', { class: 'hint' }, 'Click on map to draw a line. Elevation sampled from MOLA DEM.'),
    h('p', { class: 'hint' }, 'Derived measurement - limited by 463m source resolution'),
    h('button', { onClick: () => setMeasurement(null) }, 'Clear')
  );
}

function RoutePlanner() {
  return h('div', { class: 'measure-tool' }, [
    h('h4', null, 'Route Planner'),
    h('p', { class: 'hint' }, 'Shift+Click to add waypoints. Computes distance, ascent/descent, max slope.'),
    h('p', { class: 'hint', style: { color: '#ffaa00' } }, '⚠ Candidate route only - no hazard/rock/trafficability/comms/illumination data'),
    h('button', { onClick: () => setRoute(null) }, 'Clear Route')
  );
}

// Right Sidebar Component
function RightSidebar() {
  const loc = selectedLocation.value;
  
  if (!loc) {
    return h('div', { class: 'sidebar-content' }, [
      h('h2', null, 'Location Details'),
      h('p', { class: 'hint' }, 'Click on the map to inspect a location')
    , 25381);
  }

  const lon180 = loc.lon > 180 ? loc.lon - 360 : loc.lon;

  return h('{ class: 'sidebar-content' }', 
    h('h2', null, 'Selected Location'),
    
    h('dl', { class: 'detail-list' }, [
      h('dt', null, 'Latitude'),
      h('dd', null, `${loc.lat.toFixed(6)}° (Planetocentric)`),
      
      h('dt', null, 'Longitude'),
      h('dd', null, `${loc.lon.toFixed(6)}° (+E 0-360)`),
      h('dd', null, `${lon180.toFixed(6)}° (±180)`),
      
      h('dt', null, 'Elevation'),
      loc.loading ? h('dd', { class: 'loading' }, 'Loading...') : loc.elevation !== null ? h('dd', null, [
        `${loc.elevation.toFixed(1)} m`,
        h('br', null),
        h('small', { class: 'source' }, `Source: ${loc.elevationSource}`),
        h('br', null),
        h('small', { class: 'caveat' }, `Vertical accuracy: ±${MOLA_METADATA.VERTICAL_ACCURACY_M} m | Horizontal: ~${MOLA_METADATA.HORIZONTAL_ACCURACY_M} m`)
      , 26872) : h('dd', { class: 'unavailable' }, 'No data available')
    , 25717),

    loc.features && loc.features.length > 0 && h('{ class: 'nearby-features' }', 
      h('h3', null, 'Nearby Features'),
      h('ul', { class: 'feature-list' }, loc.features.slice(0, 5).map((f: any, i: number) => h('{ 
        key: i, 
        onClick: () => onFeatureClick(f) 
      }', 
        h('strong', null, f.name), ` (${f.type})`,
        h('br', null),
        h('small', null, `${Math.abs(f.lat - loc.lat).toFixed(4)}°, ${Math.abs(f.lon - loc.lon).toFixed(4)}° away`)
      , 27837))
    , 27985)
  ]);
}

function BottomPanel() {
  const measure = measurement.value;
  const rt = routeStore.value;

  return h('div', { class: 'bottom-panel-content' }, [
    h('div', { class: 'panel-tabs' }, [
      h('button', { class: measure ? 'active' : '', onClick: () => setMeasurement({ type: 'distance', coordinates: [], results: null, loading: false }) }, 'Measure Distance'),
      h('button', { class: measure?.type === 'profile' ? 'active' : '', onClick: () => setMeasurement({ type: 'profile', coordinates: [], results: null, loading: false }) }, 'Elevation Profile'),
      h('button', { class: rt ? 'active' : '', onClick: () => setRoute({ waypoints: [], results: null, loading: false }) }, 'Route Planner')
    ]),

    h('{ class: 'panel-content' }', 
      measure && measure.type === 'distance' && h(DistanceMeasure),
      measure && measure.type === 'profile' && h(ProfileMeasure),
      rt && h(RoutePlanner)
    , 29023)
  );
}

function DistanceMeasure() {
  return h('div', { class: 'measure-tool' }, [
    h('h4', null, 'Distance Measurement'),
    h('p', { class: 'hint' }, 'Click on map to add points. Double-click to finish.'),
    h('p', { class: 'hint' }, 'Uses Mars great-circle distance (R = 3,396.19 km)'),
    h('button', { onClick: () => setMeasurement(null) }, 'Clear')
  );
}

function ProfileMeasure() {
  return h('div', { class: 'measure-tool' }, [
    h('h4', null, 'Elevation Profile'),
    h('p', { class: 'hint' }, 'Click on map to draw a line. Elevation sampled from MOLA DEM.'),
    h('p', { class: 'hint' }, 'Derived measurement - limited by 463m source resolution'),
    h('button', { onClick: () => setMeasurement(null) }, 'Clear')
  );
}

function RoutePlanner() {
  return h('div', { class: 'measure-tool' }, [
    h('h4', null, 'Route Planner'),
    h('p', { class: 'hint' }, 'Shift+Click to add waypoints. Computes distance, ascent/descent, max slope.'),
    h('p', { class: 'hint', style: { color: '#ffaa00' } }, '⚠ Candidate route only - no hazard/rock/trafficability/comms/illumination data'),
    h('button', { onClick: () => setRoute(null) }, 'Clear Route')
  );
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for debugging
(window as any).marscope = {
  map: () => map,
  state: { mapView, layerState, uiState, selectedLocation, measurement, route: routeStore },
  actions: { setMapCenter, setMapZoom, setBaseLayer, toggleOverlay, setActiveView },
};

// Add setActiveView to uiState
import { signal } from '@preact/signals';

// Extend uiState with activeView
uiState.value.activeView = 'explorer';

function setActiveView(view: string) {
  uiState.value = { ...uiState.value, activeView: view };
}