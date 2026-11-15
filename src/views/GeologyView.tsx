"""
Surface Geology View for MARSCOPE.
"""

import { render, h } from 'preact';

export function GeologyView() {
  return (
    <div class="geology-view">
      <div class="view-header">
        <h2>Surface Geology</h2>
        <p class="view-description">Explore Mars geological units, mineralogy, and stratigraphy</p>
      </div>

      <div class="geology-tabs">
        <button class="active">MOLA Elevation</button>
        <button>HRSC DEM</button>
        <button>CTX Mosaic</button>
        <button>HiRISE DTMs</button>
        <button>Geologic Maps</button>
        <button>Mineralogy (CRISM)</button>
      </div>

      <div class="geology-content">
        <div class="layer-controls">
          <h3>Base Layers</h3>
          <div class="layer-list">
            <label class="layer-item">
              <input type="radio" name="geology-base" checked />
              <span>MOLA Hillshade</span>
              <span class="layer-meta">463 m/px, Global</span>
            </label>
            <label class="layer-item">
              <input type="radio" name="geology-base" />
              <span>MOLA Colorized Elevation</span>
              <span class="layer-meta">463 m/px, Global</span>
            </label>
            <label class="layer-item">
              <input type="radio" name="geology-base" />
              <span>HRSC Blended DEM</span>
              <span class="layer-meta">50-200 m/px, ~60% coverage</span>
            </label>
            <label class="layer-item">
              <input type="radio" name="geology-base" />
              <span>CTX Mosaic</span>
              <span class="layer-meta">5-6 m/px, >99% coverage</span>
            </label>
            <label class="layer-item">
              <input type="radio" name="geology-base" />
              <span>HiRISE Orthoimages</span>
              <span class="layer-meta">0.25-0.5 m/px, ~3%</span>
            </label>
          </div>

          <h3>Overlay Layers</h3>
          <div class="layer-list">
            <label class="layer-item">
              <input type="checkbox" />
              <span>USGS Geologic Units</span>
              <span class="layer-meta">Vector, Public Domain</span>
            </label>
            <label class="layer-item">
              <input type="checkbox" />
              <span>CRISM Mineralogy</span>
              <span class="layer-meta">18 m/px, Targeted</span>
            </label>
            <label class="layer-item">
              <input type="checkbox" />
              <span>THEMIS Thermal Inertia</span>
              <span class="layer-meta">100 m/px, Global</span>
            </label>
            <label class="layer-item">
              <input type="checkbox" />
              <span>HiRISE DTMs</span>
              <span class="layer-meta">1 m/post, Targeted</span>
            </label>
          </div>

          <h3>Feature Search</h3>
          <input type="text" placeholder="Search geologic features..." />
        </div>

        <div class="map-placeholder">
          <div class="map-info">
            <h3>Interactive Geology Map</h3>
            <p>Click on map to inspect geologic units, mineralogy, and stratigraphy</p>
            <div class="layer-legend">
              <h4>Active Layers</h4>
              <ul>
                <li>MOLA Hillshade (base)</li>
                <li>USGS Geologic Units (overlay, 60% opacity)</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="geology-info-panel">
          <h3>Geologic Unit Information</h3>
          <p class="hint">Click on the map to inspect a geologic unit</p>
          
          <div class="unit-info-placeholder">
            <p>Click on a geologic unit to see:</p>
            <ul>
              <li>Unit name and age</li>
              <li>Primary mineralogy</li>
              <li>Stratigraphic context</li>
              <li>Reference publication</li>
              <li>CRISM mineral detections in area</li>
              <li>HiRISE coverage</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GeologyView;