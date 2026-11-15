"""
Radiation Environment View for MARSCOPE.
"""

import { render, h } from 'preact';

export function RadiationView() {
  return (
    <div class="radiation-view">
      <div class="view-header">
        <h2>Radiation Environment</h2>
        <p class="view-description">Analyze galactic cosmic rays, solar particle events, and shielding requirements</p>
      </div>

      <div class="radiation-tabs">
        <button class="active">Surface Dose</button>
        <button>GCR Flux</button>
        <button>SPE Events</button>
        <button>Subsurface Shielding</button>
        <button>Mission Dose</button>
      </div>

      <div class="radiation-content">
        <div class="radiation-sidebar">
          <h3>Data Layers</h3>
          <div class="layer-list">
            <label class="layer-item">
              <input type="checkbox" checked />
              <span>GCR Surface Dose (RAD)</span>
              <span class="layer-meta">Curiosity, Gale Crater</span>
            </label>
            <label class="layer-item">
              <input type="checkbox" />
              <span>Orbital Radiation (MARIE)</span>
              <span class="layer-meta">Odyssey, Global</span>
            </label>
            <label class="layer-item">
              <input type="checkbox" />
              <span>SPE Probability Model</span>
              <span class="layer-meta">Statistical, Historical</span>
            </label>
            <label class="layer-item">
              <input type="checkbox" />
              <span>Subsurface Dose Profile</span>
              <span class="layer-meta">Model: GCR attenuation</span>
            </label>
            <label class="layer-item">
              <input type="checkbox" />
              <span>Regolith Shielding</span>
              <span class="layer-meta">2-3m for long-term</span>
            </label>
          </div>

          <h3>Radiation Sources</h3>
          <div class="source-list">
            <div class="source-item">
              <strong>Galactic Cosmic Rays (GCR)</strong>
              <span>~0.21 mGy/day surface, isotropic, high energy (GeV)</span>
            </div>
            <div class="source-item">
              <strong>Solar Particle Events (SPE)</strong>
              <span>Episodic, ~0.04 mGy/day avg, up to 1000x during events</span>
            </div>
            <div class="source-item">
              <strong>Secondary Neutrons</strong>
              <span>~30% of surface dose, produced by GCR interactions</span>
            </div>
            <div class="source-item">
              <strong>Albedo Protons</strong>
              <span>Reflected from surface, minor component</span>
            </div>
          </div>

          <h3>Key Missions</h3>
          <div class="mission-list">
            <div class="mission-item">
              <strong>RAD (Curiosity)</strong>
              <span>Surface dose rate, Gale Crater, 2012-present</span>
            </div>
            <div class="mission-item">
              <strong>MARIE (Odyssey)</strong>
              <span>Orbital radiation, 2002-2003 (failed early)</span>
            </div>
            <div class="mission-item">
              <strong>MEDA (Perseverance)</strong>
              <span>SkyCam + radiation, Jezero Crater, 2021-present</span>
            </div>
            <div class="mission-item">
              <strong>RAD (Mars 2020)</strong>
              <span>Transit + surface, cruise + Jezero</span>
            </div>
          </div>

          <h3>Shielding Requirements</h3>
          <table class="data-table">
            <thead>
              <tr><th>Material</th><th>Thickness for 50 mSv/yr</th><th>Mass (kg/m²)</th></tr>
            </thead>
            <tbody>
              <tr><td>Regolith</td><td>2-3 m</td><td>3000-4500</td></tr>
              <tr><td>Water/Ice</td><td>1-1.5 m</td><td>1000-1500</td></tr>
              <tr><td>Polyethylene</td><td>10-15 cm</td><td>90-135</td></tr>
              <tr><td>Aluminum</td><td>20-30 cm</td><td>540-810</td></tr>
            </tbody>
          </table>
        </div>

        <div class="map-placeholder">
          <div class="map-info">
            <h3>Radiation Map</h3>
            <p>Click on map to get radiation dose estimates for any location</p>
            <div class="layer-legend">
              <h4>Active Layers</h4>
              <ul>
                <li>GCR Surface Dose (base)</li>
                <li>SPE Probability (overlay)</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="radiation-info-panel">
          <h3>Radiation Assessment</h3>
          <p class="hint">Click on the map to get radiation dose estimates</p>
          
          <div class="assessment-placeholder">
            <p>Click on the map to see:</p>
            <ul>
              <li>GCR dose rate (mGy/day)</li>
              <li>SPE probability per sol</li>
              <li>Annual dose (mSv/yr)</li>
              <li>Subsurface dose at 0.1m, 0.5m, 1m, 2m, 3m</li>
              <li>Shielding recommendations</li>
              <li>Acute vs chronic risk thresholds</li>
            </ul>
          </div>

          <div class="dose-calculator">
            <h4>Mission Dose Calculator</h4>
            <div class="calc-form">
              <label>
                Duration (sols):
                <input type="number" value="500" min="1" max="2000" />
              </label>
              <label>
                Shielding:
                <select>
                  <option value="none">None (surface)</option>
                  <option value="regolith_1m">1m Regolith</option>
                  <option value="regolith_3m">3m Regolith</option>
                  <option value="water_1m">1m Water</option>
                  <option value="polyethylene_10cm">10cm Polyethylene</option>
                </select>
              </label>
              <label>
                Activity:
                <select>
                  <option value="habitat">Inside habitat</option>
                  <option value="eva">EVA (surface)</option>
                  <option value="transit">Transit (deep space)</option>
                </select>
              </label>
              <button class="btn-primary">Calculate Dose</button>
            </div>
            <div class="calc-result">
              <p>Estimated Dose: <strong>--- mSv</strong></p>
              <p>Career Limit (NASA): <strong>600-1200 mSv</strong> (age/sex dependent)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RadiationView;