"""
Mission Planning View for MARSCOPE.
"""

import { render, h } from 'preact';
import { missionState, analyzeSite, fetchCandidates, createMissionPlan, setActiveTab, addWaypoint, removeWaypoint, clearWaypoints, setActiveTab as setMissionTab } from '@/stores/missionStore';
import { validate_latitude, validate_longitude } from '@/state/mapStore';

export function MissionView() {
  const state = missionState.value;
  const loading = state.loading;
  const error = state.error;
  const activeTab = state.activeTab;
  const candidates = state.candidates;
  const currentSite = state.currentSite;
  const currentPlan = state.currentPlan;
  const waypoints = state.selectedWaypoints;

  const handleAnalyze = async (lat: number, lon: number, radius: number) => {
    await analyzeSite(lat, lon, radius);
  };

  const handleFetchCandidates = async () => {
    await fetchCandidates({ min_lat: -60, max_lat: 60, min_lon: 0, max_lon: 360, limit: 20 });
  };

  const handleCreatePlan = async (site: any, objectives: any[]) => {
    await createMissionPlan({ landing_site: site, science_objectives: objectives });
  };

  const addWp = (lat: number, lon: number) => {
    // addWaypoint(lat, lon);
  };

  const removeWp = (index: number) => {
    // removeWaypoint(index);
  };

  return (
    <div class="mission-view">
      <div class="view-header">
        <h2>Mission Planning</h2>
      </div>

      {error && <div class="error-banner">{error}</div>}
      {loading && <div class="loading-indicator">Loading...</div>}

      <div class="mission-tabs">
        <button class={activeTab === 'analyze' ? 'active' : ''} onClick={() => setActiveTab('analyze')}>
          Analyze Site
        </button>
        <button class={activeTab === 'candidates' ? 'active' : ''} onClick={() => { setActiveTab('candidates'); /* fetchCandidates() */ }}>
          Site Candidates
        </button>
        <button class={activeTab === 'plan' ? 'active' : ''} onClick={() => setActiveTab('plan')}>
          Route Planner
        </button>
      </div>

      <div class="mission-content">
        {/* Analyze Site Tab */}
        <div class="tab-panel">
          <h3>Analyze Landing Site</h3>
          <div class="analyze-form">
            <label>
              Latitude:
              <input type="number" step="0.0001" min="-90" max="90" placeholder="Lat" />
            </label>
            <label>
              Longitude:
              <input type="number" step="0.0001" min="-180" max="360" placeholder="Lon (+E 0-360)" />
            </label>
            <label>
              Analysis Radius (km):
              <input type="number" min="1" max="500" value="50" />
            </label>
            <button class="btn-primary" disabled={/* loading */}>Analyze Site</button>
          </div>

          {state.currentSite && (
            <div class="site-analysis-results">
              <h3>Site Analysis: {state.currentSite.name}</h3>
              <div class="score-card">
                <h3>Overall Score: {state.currentSite.score.toFixed(1)} / 100</h3>
              </div>

              <div class="metrics-grid">
                <div class="metric-card">
                  <h4>Slope Analysis</h4>
                  <p>Mean: {state.currentSite.slope_stats.mean_deg}°</p>
                  <p>Max: {state.currentSite.slope_stats.max_deg}°</p>
                  <p><5°: {state.currentSite.slope_stats.pct_under_5}%</p>
                  <p><15°: {state.currentSite.slope_stats.pct_under_15}%</p>
                  <p><30°: {state.currentSite.slope_stats.pct_under_30}%</p>
                </div>

                <div class="metric-card">
                  <h4>Geology</h4>
                  <p>Unit: {state.currentSite.geology.primary_unit}</p>
                  <p>Age: {state.currentSite.geology.unit_age || 'Unknown'}</p>
                  <p>Mineralogy: {state.currentSite.geology.mineralogy?.join(', ')}</p>
                </div>

                <div class="metric-card">
                  <h4>Water Access</h4>
                  <p>Distance to Ice: {state.currentSite.water_access.distance_to_ice_km} km</p>
                  <p>Type: {state.currentSite.water_access.ice_type || 'None'}</p>
                  <p>Extraction: {state.currentSite.water_access.extraction_difficulty || 'Unknown'}</p>
                  <p>Est. Yield: {state.currentSite.water_access.estimated_yield_kg_per_sol || 0} kg/sol</p>
                </div>

                <div class="metric-card">
                  <h4>Solar Potential</h4>
                  <p>Annual: {state.currentSite.solar_potential.annual_insolation_kwh_m2} kWh/m²</p>
                  <p>Winter Min: {state.currentSite.solar_potential.worst_month_insolation_kwh_m2} kWh/m²</p>
                  <p>Winter Daylight: {state.currentSite.solar_potential.daylight_hours_winter}h</p>
                  <p>Summer Daylight: {state.currentSite.solar_potential.daylight_hours_summer}h</p>
                </div>

                <div class="metric-card">
                  <h4>Communications</h4>
                  <p>Earth Visible: {state.currentSite.communications.earth_visible_hours_per_sol}h/sol</p>
                  <p>Relay Passes: {state.currentSite.communications.relay_orbiter_passes_per_sol}/sol</p>
                  <p>Max Rate: {state.currentSite.communications.max_data_rate_mbps} Mbps</p>
                </div>

                <div class="metric-card">
                  <h4>Hazards</h4>
                  <ul>
                    {state.currentSite.hazards.map((h: any, i: number) => (
                      <li key={i} class={`hazard-${h.severity}`}>
                        <strong>{h.type}:</strong> {h.description}
                        {h.mitigation && <span> - Mitigation: {h.mitigation}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div class="score-breakdown">
                <h3>Score Breakdown</h3>
                <ul>
                  {Object.entries(state.currentSite.score_breakdown).map(([key, value]) => (
                    <li key={key}><strong>{key}:</strong> {value}/25</li>
                  ))}
                </ul>
              </div>

              <div class="assumptions">
                <h3>Assumptions</h3>
                <ul>
                  {state.currentSite.assumptions.map((a: string, i: number) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>

              <div class="uncertainties">
                <h3>Uncertainties</h3>
                <ul>
                  {Object.entries(state.currentSite.uncertainties).map(([key, value]) => (
                    <li key={key}><strong>{key}:</strong> {value}</li>
                  ))}
                </ul>
              </div>

              <button class="btn-primary" onClick={() => { /* create plan */ }}>Create Mission Plan</button>
            </div>
          )}

        </div>

        {/* Site Candidates Tab */}
        <div class="tab-panel">
          <h3>Pre-analyzed Site Candidates</h3>
          <div class="candidates-controls">
            <label>
              Min Lat: <input type="number" step="1" min="-90" max="90" placeholder="Min Lat" />
            </label>
            <label>
              Max Lat: <input type="number" step="1" min="-90" max="90" placeholder="Max Lat" />
            </label>
            <label>
              Min Lon: <input type="number" step="1" min="0" max="360" placeholder="Min Lon" />
            </label>
            <label>
              Max Lon: <input type="number" step="1" min="0" max="360" placeholder="Max Lon" />
            </label>
            <label>
              Min Score: <input type="number" min="0" max="100" value="0" />
            </label>
            <label>
              Limit: <input type="number" min="1" max="100" value="20" />
            </label>
            <button class="btn-primary" disabled={/* loading */} onClick={() => { /* fetchCandidates */ }}>Find Candidates</button>
          </div>

          {state.candidates && (
            <div class="candidates-list">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Lat</th>
                    <th>Lon</th>
                    <th>Elev (m)</th>
                    <th>Score</th>
                    <th>Slope %<5°</th>
                    <th>Water</th>
                    <th>Action</th>
                  </tr>
                  <tbody>
                    {state.candidates.map((site: any) => (
                      <tr key={site.id}>
                        <td>{site.name}</td>
                        <td>{site.lat.toFixed(4)}</td>
                        <td>{site.lon.toFixed(4)}</td>
                        <td>{site.elevation_m?.toFixed(0)}</td>
                        <td class={site.score >= 70 ? 'score-high' : site.score >= 40 ? 'score-medium' : 'score-low'}>{site.score.toFixed(1)}</td>
                        <td>{site.slope_stats.pct_under_5}%</td>
                        <td>{site.water_access.ice_type || 'None'}</td>
                        <td><button class="btn-small" onClick={() => { /* select site */ }}>Select</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </table>
            </div>
          )}
        </div>

        {/* Route Planner Tab */}
        <div class="tab-panel">
          <h3>Route Planner</h3>
          <div class="waypoints-form">
            <h4>Waypoints</h4>
            <div class="waypoints-list">
              {state.selectedWaypoints.map((wp: any, i: number) => (
                <div key={i} class="waypoint-item">
                  <input type="number" step="0.0001" placeholder="Lat" value={wp.lat} />
                  <input type="number" step="0.0001" placeholder="Lon (+E 0-360)" value={wp.lon} />
                  <button class="btn-danger" onClick={() => { /* removeWaypoint(i) */ }}>Remove</button>
                </div>
              ))}
              <button class="btn-secondary" onClick={() => { /* addWaypoint(0, 0) */ }}>Add Waypoint</button>
              <button class="btn-secondary" onClick={() => { /* clearWaypoints */ }}>Clear All</button>
            </div>

            <div class="route-options">
              <label>
                Samples per Segment:
                <input type="number" min="10" max="200" value="50" />
              </label>
            </div>

            <button class="btn-primary" disabled={/* loading || waypoints.length < 2 */}>Generate Route</button>

            {state.currentPlan && (
              <div class="route-results">
                <h3>Route Plan: {state.currentPlan.name}</h3>
                <div class="route-summary">
                  <p><strong>Total Distance:</strong> {state.currentPlan.totalDistance.toFixed(1)} m</p>
                  <p><strong>Cumulative Ascent:</strong> {state.currentPlan.cumulativeAscent.toFixed(1)} m</p>
                  <p><strong>Cumulative Descent:</strong> {state.currentPlan.cumulativeDescent.toFixed(1)} m</p>
                  <p><strong>Max Slope:</strong> {state.currentPlan.maxSlope.toFixed(2)}°</p>
                </div>

                <h4>Segments</h4>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>From</th>
                      <th>To</th>
                      <th>Distance (m)</th>
                      <th>Ascent (m)</th>
                      <th>Descent (m)</th>
                      <th>Max Slope (°)</th>
                    </thead>
                    <tbody>
                      {state.currentPlan.segments.map((seg: any, i: number) => (
                        <tr key={i}>
                          <td>{seg.start.lat.toFixed(4)}, {seg.start.lon.toFixed(4)}</td>
                          <td>{seg.end.lat.toFixed(4)}, {seg.end.lon.toFixed(4)}</td>
                          <td>{seg.distance.toFixed(1)}</td>
                          <td>{seg.ascent.toFixed(1)}</td>
                          <td>{seg.descent.toFixed(1)}</td>
                          <td>{seg.maxSlope.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </table>

                <div class="caveat">
                  <strong>⚠ Candidate route only</strong> - No hazard/rock/trafficability/illumination/comms data.
                  Based on MOLA 463m DEM only. Not a certified safe traverse.
                </div>

                <button class="btn-secondary">Export GeoJSON</button>
                <button class="btn-secondary">Export CSV</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MissionView;