"""
Water Resources View for MARSCOPE.
"""

import { render, h } from 'preact';

export function WaterView() {
  return (
    <div class="water-view">
      <div class="view-header">
        <h2>Water Resources</h2>
        <p class="view-description">Explore water ice deposits, hydrated minerals, and extraction potential</p>
      </div>

      <div class="water-tabs">
        <button class="active">Surface Ice</button>
        <button>Subsurface Ice</button>
        <button>Hydrated Minerals</button>
        <button>RSL (Recurring Slope Lineae)</button>
        <button>Extraction Feasibility</button>
      </div>

      <div class="water-content">
        <div class="water-sidebar">
          <h3>Data Layers</h3>
          <div class="layer-list">
            <label class="layer-item">
              <input type="checkbox" checked />
              <span>Polar Ice Caps</span>
              <span class="layer-meta">MOLA + SHARAD, >80° lat</span>
            </label>
            <label class="layer-item">
              <input type="checkbox" />
              <span>Mid-latitude Glaciers</span>
              <span class="layer-meta">SHARAD, 30°-60° lat</span>
            </label>
            <label class="layer-item">
              <input type="checkbox" />
              <span>Subsurface Ice (SHARAD)</span>
              <span class="layer-meta">3-10 km resolution</span>
            </label>
            <label class="layer-item">
              <input type="checkbox" />
              <span>Hydrated Minerals (CRISM)</span>
              <span class="layer-meta">18 m/px, Targeted</span>
            </label>
            <label class="layer-item">
              <input type="checkbox" />
              <span>Recurring Slope Lineae</span>
              <span class="layer-meta">HiRISE, 25°-40° lat</span>
            </label>
            <label class="layer-item">
              <input type="checkbox" />
              <span>Neutron Spectrometer (HEND/NS)</span>
              <span class="layer-meta">~300 km/pixel</span>
            </label>
          </div>

          <h3>Known Ice Deposits</h3>
          <div class="feature-list">
            <div class="feature-item">
              <strong>North Polar Cap</strong>
              <span>1.6M km³, 2-3 km thick</span>
            </div>
            <div class="feature-item">
              <strong>South Polar Cap</strong>
              <span>1.6M km³, 2-3 km thick, CO₂ cap</span>
            </div>
            <div class="feature-item">
              <strong>Mid-latitude Glaciers</strong>
              <span>~1000 km³, 30°-60° lat</span>
            </div>
            <div class="feature-item">
              <strong>Arcadia Planitia</strong>
              <span>Shallow ice, <1m depth</span>
            </div>
            <div class="feature-item">
              <strong>Deuteronilus Mensae</strong>
              <span>Lobate debris aprons, ice-rich</span>
            </div>
          </div>

          <h3>Extraction Feasibility</h3>
          <table class="data-table">
            <thead>
              <tr><th>Source</th><th>Energy (MJ/kg)</th><th>Equipment</th><th>Yield (kg/sol)</th></tr>
            </thead>
            <tbody>
              <tr><td>Surface Ice</td><td>2.8</td><td>Excavator + Heater</td><td>1000 kg/sol</td></tr>
              <tr><td>Subsurface Ice</td><td>3.5</td><td>Drill + Heater</td><td>500 kg/sol</td></tr>
              <tr><td>Hydrated Minerals</td><td>15</td><td>Oven + Crusher</td><td>100 kg/sol</td></tr>
            </tbody>
          </table>
        </div>

        <div class="map-placeholder">
          <div class="map-info">
            <h3>Water Resources Map</h3>
            <p>Click on map to inspect water ice deposits and extraction potential</p>
            <div class="layer-legend">
              <h4>Active Layers</h4>
              <ul>
                <li>Polar Ice Caps (base)</li>
                <li>Subsurface Ice Probability (overlay)</li>
                <li>Hydrated Minerals (points)</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="water-info-panel">
          <h3>Water Resource Details</h3>
          <p class="hint">Click on the map to inspect a water resource</p>
          
          <div class="resource-info-placeholder">
            <p>Click on a water feature to see:</p>
            <ul>
              <li>Type: Surface ice / Subsurface ice / Hydrated mineral / RSL</li>
              <li>Estimated volume / abundance</li>
              <li>Depth / accessibility</li>
              <li>Extraction energy requirements</li>
              <li>SHARAD/CRISM detection confidence</li>
              <li>Reference publication</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WaterView;