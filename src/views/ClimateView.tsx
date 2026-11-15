"""
Climate & Weather View for MARSCOPE.
Displays weather observations, climate normals, dust storms, and solar illumination.
"""

import { render, h } from 'preact';
import { climateState, fetchWeather, fetchNormals, fetchDustStorms, fetchSolarIllumination, clearClimateData } from '@/stores/climateStore';
import { validate_latitude, validate_longitude } from '@/state/mapStore';

export function ClimateView() {
  const state = climateState.value;
  const loading = state.loading;
  const error = state.error;

  const handleFetchWeather = async (lat: number, lon: number) => {
    await fetchWeather(lat, lon);
  };

  const handleFetchNormals = async (lat: number, lon: number) => {
    await fetchNormals(lat, lon);
  };

  const handleFetchDustStorms = async (lat: number, lon: number) => {
    await fetchDustStorms(lat, lon);
  };

  const handleFetchSolar = async (lat: number, lon: number, date?: string) => {
    await fetchSolarIllumination(lat, lon, undefined);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const formatTemp = (k: number) => `${(k - 273.15).toFixed(1)}°C (${k.toFixed(1)} K)`;

  const formatPressure = (pa: number) => `${(pa / 100).toFixed(1)} hPa`;

  return (
    <div class="climate-view">
      <div class="view-header">
        <h2>Climate & Weather</h2>
        <div class="view-actions">
          <button class="btn-secondary" onClick={() => { /* clearClimateData() */ }}>Clear</button>
        </div>
      </div>

      {error && <div class="error-banner">{error}</div>}
      {loading && <div class="loading-indicator">Loading...</div>}

      <div class="climate-tabs">
        <button class={/* tab === 'weather' ? 'active' : '' */} onClick={() => { /* setTab('weather') */ }}>Current Weather</button>
        <button class={/* tab === 'normals' ? 'active' : '' */} onClick={() => { /* setTab('normals') */ }}>Climate Normals</button>
        <button class={/* tab === 'dust' ? 'active' : '' */} onClick={() => { /* setTab('dust') */ }}>Dust Storms</button>
        <button class={/* tab === 'solar' ? 'active' : '' */} onClick={() => { /* setTab('solar') */ }}>Solar Illumination</button>
      </div>

      <div class="climate-content">
        {/* Weather Tab */}
        <div class="tab-panel">
          <h3>Current Weather Observations</h3>
          <div class="weather-form">
            <label>
              Latitude:
              <input type="number" step="0.0001" min="-90" max="90" placeholder="Lat" />
            </label>
            <label>
              Longitude:
              <input type="number" step="0.0001" min="-180" max="360" placeholder="Lon (+E 0-360)" />
            </label>
            <label>
              Start Date:
              <input type="datetime-local" />
            </label>
            <label>
              End Date:
              <input type="datetime-local" />
            </label>
            <label>
              Source:
              <select>
                <option value="">All</option>
                <option value="REMS">REMS (Curiosity)</option>
                <option value="MEDA">MEDA (Perseverance)</option>
                <option value="MARCI">MARCI (MRO)</option>
                <option value="MCS">MCS (MRO)</option>
              </select>
            </label>
            <button class="btn-primary" disabled={/* loading */}>Fetch Weather</button>
          </div>

          <div class="weather-results">
            <h4>Recent Observations</h4>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Time (UTC)</th>
                  <th>Temp (K)</th>
                  <th>Temp (°C)</th>
                  <th>Pressure (Pa)</th>
                  <th>Wind (m/s)</th>
                  <th>Dust (τ)</th>
                  <th>Source</th>
                </thead>
                <tbody>
                  <tr><td colspan="7" class="no-data">No data loaded. Click "Fetch Weather" to load observations.</td></tr>
                </tbody>
              </table>
            </div>
          </div>

        {/* Climate Normals Tab */}
        <div class="tab-panel">
          <h3>Climate Normals (30-Mars-Year Averages)</h3>
          <div class="normals-form">
            <label>
              Latitude:
              <input type="number" step="0.0001" min="-90" max="90" placeholder="Lat" />
            </label>
            <label>
              Longitude:
              <input type="number" step="0.0001" min="-180" max="360" placeholder="Lon (+E 0-360)" />
            </label>
            <button class="btn-primary" disabled={/* loading */}>Fetch Normals</button>
          </div>

          <div class="normals-results">
            <h4>Monthly Temperature (K)</h4>
            <div class="chart-placeholder">[Temperature chart would go here]</div>
            
            <h4>Monthly Pressure (Pa)</h4>
            <div class="chart-placeholder">[Pressure chart would go here]</div>

            <h4>Dust Storm Probability</h4>
            <div class="chart-placeholder">[Dust probability chart would go here]</div>

            <h4>Solar Illumination Hours</h4>
            <div class="chart-placeholder">[Solar illumination chart would go here]</div>

            <div class="normals-summary">
              <h4>Annual Summary</h4>
              <dl class="summary-list">
                <dt>Annual Mean Temperature</dt>
                <dd>--- K</dd>
                <dt>Annual Temperature Range</dt>
                <dd>--- K</dd>
                <dt>Annual Mean Pressure</dt>
                <dd>--- Pa</dd>
                <dt>Data Period</dt>
                <dd>MY 28-34 (approx. 2007-2020)</dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Dust Storms Tab */}
        <div class="tab-panel">
          <h3>Dust Storm Events</h3>
          <div class="dust-form">
            <label>
              Latitude:
              <input type="number" step="0.0001" min="-90" max="90" placeholder="Lat" />
            </label>
            <label>
              Longitude:
              <input type="number" step="0.0001" min="-180" max="360" placeholder="Lon (+E 0-360)" />
            </label>
            <label>
              Season:
              <select>
                <option value="">All Seasons</option>
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
                <option value="autumn">Autumn</option>
                <option value="winter">Winter</option>
              </select>
            </label>
            <button class="btn-primary" disabled={/* loading */}>Fetch Dust Storms</button>
          </div>

          <div class="dust-results">
            <h4>Known Dust Storm Events</h4>
            <div class="storm-list">
              <div class="storm-item">
                <h5>Global Dust Storm 2018</h5>
                <p>May 30 - Sep 15, 2018 | Global | Peak opacity: 10.8</p>
                <p class="source">Source: MARCI/MRO | Guzewich et al. 2019</p>
              </div>
              <div class="storm-item">
                <h5>Regional Storm 2007</h5>
                <p>Jun 15 - Jul 20, 2007 | Regional | Peak opacity: 4.2</p>
                <p class="source">Source: MARCI/MRO | Wang & Richardson 2015</p>
              </div>
            </div>
          </div>
        </div>

        {/* Solar Illumination Tab */}
        <div class="tab-panel">
          <h3>Solar Illumination Calculator</h3>
          <div class="solar-form">
            <label>
              Latitude:
              <input type="number" step="0.0001" min="-90" max="90" placeholder="Lat" />
            </label>
            <label>
              Longitude:
              <input type="number" step="0.0001" min="-180" max="360" placeholder="Lon (+E 0-360)" />
            </label>
            <label>
              Date:
              <input type="date" />
            </label>
            <button class="btn-primary" disabled={/* loading */}>Calculate</button>
          </div>

          <div class="solar-results">
            <h4>Solar Illumination</h4>
            <dl class="solar-details">
              <dt>Daylight Hours</dt>
              <dd>--- hours</dd>
              <dt>Solar Zenith at Noon</dt>
              <dd>---°</dd>
              <dt>Max Elevation Angle</dt>
              <dd>---°</dd>
              <dt>Sunrise</dt>
              <dd>---</dd>
              <dt>Sunset</dt>
              <dd>---</dd>
              <dt>Polar Day</dt>
              <dd>---</dd>
              <dt>Polar Night</dt>
              <dd>---</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClimateView;