/**
 * MARSCOPE - Main Entry Point
 * Interactive Martian Exploration and Mission Planning System
 */

import { render } from 'preact';
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
  render(App, document.getElementById('app')!);
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
  return (
    <div class="app">
      <header class="app-header">
        <h1>MARSCOPE</h1>
        <div class="header-status">
          <span id="backend-status" class={appError.value ? 'status-error' : 'status-ok'}>
            {appError.value ? 'Backend: Offline' : 'Backend: Online'}
          </span>
        </div>
      </header>

      <div class="app-body">
        {/* Left Sidebar */}
        <aside class="sidebar left" style={{ display: uiState.value.leftSidebarOpen ? 'flex' : 'none' }}>
          <div class="sidebar-tabs">
            <button 
              class={uiState.value.activeTab === 'layers' ? 'active' : ''}
              onClick={() => setActiveTab('layers')}
            >
              Layers
            </button>
            <button 
              class={uiState.value.activeTab === 'datasets' ? 'active' : ''}
              onClick={() => setActiveTab('datasets')}
            >
              Datasets
            </button>
            <button 
              class={uiState.value.activeTab === 'features' ? 'active' : ''}
              onClick={() => setActiveTab('features')}
            >
              Features
            </button>
          </div>

          <div class="sidebar-content">
            {uiState.value.activeTab === 'layers' && <LayersPanel />}
            {uiState.value.activeTab === 'datasets' && <DatasetsPanel />}
            {uiState.value.activeTab === 'features' && <FeaturesPanel />}
          </div>

          <button 
            class="sidebar-toggle"
            onClick={() => setLeftSidebar(false)}
            aria-label="Close sidebar"
          >
            ◀
          </button>
        </aside>

        {/* Map Container */}
        <main class="map-container">
          <div id="map" class="map"></div>
          
          {/* Right Sidebar Toggle */}
          <button 
            class="sidebar-toggle right-toggle"
            onClick={() => setRightSidebar(!uiState.value.rightSidebarOpen)}
            aria-label={uiState.value.rightSidebarOpen ? 'Close details' : 'Open details'}
          >
            {uiState.value.rightSidebarOpen ? '▶' : '◀'}
          </button>
        </main>

        {/* Right Sidebar */}
        <aside class="sidebar right" style={{ display: uiState.value.rightSidebarOpen ? 'flex' : 'none' }}>
          <RightSidebar />
          <button 
            class="sidebar-toggle"
            onClick={() => setRightSidebar(false)}
            aria-label="Close sidebar"
          >
            ▶
          </button>
        </aside>
      </div>

      {/* Bottom Panel */}
      <div class="bottom-panel" style={{ display: uiState.value.bottomPanelOpen ? 'flex' : 'none' }}>
        <BottomPanel />
        <button 
          class="panel-toggle"
          onClick={() => setBottomPanel(false)}
          aria-label="Close panel"
        >
          ▲
        </button>
      </div>

      {/* Error Toast */}
      {appError.value && (
        <div class="error-toast" onClick={clearError}>
          {appError.value}
        </div>
      )}

      {/* Attribution Bar */}
      <footer class="attribution-bar">
        <div class="attribution-items">
          <span>MOLA: {MOLA_METADATA.team}; {MOLA_METADATA.originator}; {MOLA_METADATA.publisher}</span>
          <span>Features: {IAU_METADATA.authority}</span>
          <span class="license">Code: MIT | Data: CC0/Public Domain</span>
        </div>
      </footer>
    </div>
  );
}

function LayersPanel() {
  const baseLayers = ['mola_hillshade', 'mola_color', 'mola_slope'];
  const overlayLayers = ['themis_day_ir', 'themis_night_ir', 'ctx', 'hirise'];
  const overlayNames: Record<string, string> = {
    themis_day_ir: 'THEMIS Day IR',
    themis_night_ir: 'THEMIS Night IR',
    ctx: 'CTX Mosaic',
    hirise: 'HiRISE',
  };

  return (
    <div class="panel-section">
      <h3>Base Layers</h3>
      <div class="layer-list">
        {baseLayers.map(id => (
          <label key={id} class="layer-item">
            <input
              type="radio"
              name="base-layer"
              checked={layerState.value.baseLayer === id}
              onChange={() => setBaseLayer(id)}
            />
            <span>{id.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
          </label>
        ))}
      </div>

      <h3>Overlay Layers</h3>
      <div class="layer-list">
        {overlayLayers.map(id => (
          <label key={id} class="layer-item">
            <input
              type="checkbox"
              checked={layerState.value.overlays[id] || false}
              onChange={() => toggleOverlay(id)}
            />
            <span>{overlayNames[id] || id}</span>
            {layerState.value.overlays[id] && (
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={layerState.value.opacity[id] || 1}
                onChange={(e) => setOverlayOpacity(id, parseFloat(e.target.value))}
              />
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

function DatasetsPanel() {
  return (
    <div class="panel-section">
      <h3>Integrated Datasets</h3>
      <dl class="dataset-list">
        <dt>MOLA DEM 463m</dt>
        <dd>Global elevation, 463 m/px, CC0</dd>
        
        <dt>IAU Gazetteer</dt>
        <dd>Named features, Public Domain</dd>

        <h4>Investigated Only</h4>
        <dt>HiRISE</dt>
        <dd>0.25-0.5 m/px, ~3% coverage</dd>
        <dt>CTX</dt>
        <dd>5-6 m/px, >99% coverage</dd>
        <dt>THEMIS IR</dt>
        <dd>100 m/px, Global</dd>
        <dt>CRISM</dt>
        <dd>18 m/px, Targeted</dd>
        <dt>SHARAD</dt>
        <dd>Subsurface radar</dd>
        <dt>USGS Geologic Maps</dt>
        <dd>GIS-ready, Public Domain</dd>
      </dl>
    </div>
  );
}

function FeaturesPanel() {
  return (
    <div class="panel-section">
      <h3>Feature Search</h3>
      <input
        type="text"
        placeholder="Search features..."
        class="search-input"
        onInput={(e) => {
          // TODO: Implement search
        }}
      />
      <p class="hint">Click on map or search IAU Gazetteer</p>
      <p class="hint">{allFeatures.filter(f => f.target === 'Mars').length} Mars features loaded</p>
    </div>
  );
}

function RightSidebar() {
  const loc = selectedLocation.value;
  
  if (!loc) {
    return (
      <div class="sidebar-content">
        <h2>Location Details</h2>
        <p class="hint">Click on the map to inspect a location</p>
      </div>
    );
  }

  const lon180 = loc.lon > 180 ? loc.lon - 360 : loc.lon;

  return (
    <div class="sidebar-content">
      <h2>Selected Location</h2>
      
      <dl class="detail-list">
        <dt>Latitude</dt>
        <dd>{loc.lat.toFixed(6)}° (Planetocentric)</dd>
        
        <dt>Longitude</dt>
        <dd>{loc.lon.toFixed(6)}° (+E 0-360)</dd>
        <dd>{lon180.toFixed(6)}° (±180)</dd>
        
        <dt>Elevation</dt>
        {loc.loading ? (
          <dd class="loading">Loading...</dd>
        ) : loc.elevation !== null ? (
          <dd>
            {loc.elevation.toFixed(1)} m
            <br>
            <small class="source">Source: {loc.elevationSource}</small>
            <br>
            <small class="caveat">Vertical accuracy: ±{MOLA_METADATA.VERTICAL_ACCURACY_M} m | Horizontal: ~{MOLA_METADATA.HORIZONTAL_ACCURACY_M} m</small>
          </dd>
        ) : (
          <dd class="unavailable">No data available</dd>
        )}
      </dl>

      {loc.features && loc.features.length > 0 && (
        <div class="nearby-features">
          <h3>Nearby Features</h3>
          <ul class="feature-list">
            {loc.features.slice(0, 5).map((f: any, i: number) => (
              <li key={i} onClick={() => onFeatureClick(f)}>
                <strong>{f.name}</strong> ({f.type})
                <br>
                <small>{Math.abs(f.lat - loc.lat).toFixed(4)}°, {Math.abs(f.lon - loc.lon).toFixed(4)}° away</small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function BottomPanel() {
  const measure = measurement.value;
  const rt = routeStore.value;

  return (
    <div class="bottom-panel-content">
      <div class="panel-tabs">
        <button class={measure ? 'active' : ''} onClick={() => setMeasurement({ type: 'distance', coordinates: [], results: null, loading: false })}>
          Measure Distance
        </button>
        <button class={measure?.type === 'profile' ? 'active' : ''} onClick={() => setMeasurement({ type: 'profile', coordinates: [], results: null, loading: false })}>
          Elevation Profile
        </button>
        <button class={rt ? 'active' : ''} onClick={() => setRoute({ waypoints: [], results: null, loading: false })}>
          Route Planner
        </button>
      </div>

      <div class="panel-content">
        {measure && measure.type === 'distance' && <DistanceMeasure />}
        {measure && measure.type === 'profile' && <ProfileMeasure />}
        {rt && <RoutePlanner />}
      </div>
    </div>
  );
}

function DistanceMeasure() {
  // TODO: Implement click-to-add distance measurement
  return (
    <div class="measure-tool">
      <h4>Distance Measurement</h4>
      <p class="hint">Click on map to add points. Double-click to finish.</p>
      <p class="hint">Uses Mars great-circle distance (R = 3,396.19 km)</p>
      <button onClick={() => setMeasurement(null)}>Clear</button>
    </div>
  );
}

function ProfileMeasure() {
  return (
    <div class="measure-tool">
      <h4>Elevation Profile</h4>
      <p class="hint">Click on map to draw a line. Elevation sampled from MOLA DEM.</p>
      <p class="hint">Derived measurement - limited by 463m source resolution</p>
      <button onClick={() => setMeasurement(null)}>Clear</button>
    </div>
  );
}

function RoutePlanner() {
  return (
    <div class="measure-tool">
      <h4>Route Planner</h4>
      <p class="hint">Shift+Click to add waypoints. Computes distance, ascent/descent, max slope.</p>
      <p class="hint" style="color: #ffaa00;">⚠ Candidate route only - no hazard/rock/trafficability data</p>
      <button onClick={() => setRoute(null)}>Clear Route</button>
    </div>
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
  actions: { setMapCenter, setMapZoom, setBaseLayer, toggleOverlay },
};