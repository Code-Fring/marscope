"""
Interplanetary Survival Assessment View for MARSCOPE.
"""

import { render, h } from 'preact';
import { survivalState, fetchSurvivalAssessment, fetchSurvivalComparison, clearSurvivalData, survivalScore, survivalLimitingFactors, survivalCategories } from '@/stores/survivalStore';
import { validate_latitude, validate_longitude } from '@/state/mapStore';

export function SurvivalView() {
  const state = survivalState.value;
  const loading = state.loading;
  const error = state.error;
  const assessment = state.assessment;

  const handleAssessment = async (lat: number, lon: number) => {
    await fetchSurvivalAssessment(lat, lon);
  };

  const handleCompare = async (locations: string) => {
    await fetchSurvivalComparison(locations);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'score-high';
    if (score >= 40) return 'score-medium';
    return 'score-low';
  };

  return (
    <div class="survival-view">
      <div class="view-header">
        <h2>Interplanetary Survival Assessment</h2>
        <div class="view-actions">
          <button class="btn-secondary" onClick={() => { /* clearSurvivalData() */ }}>Clear</button>
        </div>
      </div>

      {error && <div class="error-banner">{error}</div>}
      {loading && <div class="loading-indicator">Loading assessment...</div>}

      <div class="survival-form">
        <h3>Assess Location</h3>
        <div class="form-row">
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
              <option value="average">Average</option>
              <option value="spring">Spring</option>
              <option value="summer">Summer</option>
              <option value="autumn">Autumn</option>
              <option value="winter">Winter</option>
            </select>
          </label>
          <button class="btn-primary" disabled={/* loading */}>Assess</button>
        </div>

        <div class="compare-section">
          <h3>Compare Locations</h3>
          <input type="text" placeholder="lat1,lon1;lat2,lon2;..." placeholder="e.g., 18.65,226.2;-4.5,137.4" />
          <button class="btn-secondary" disabled={/* loading */}>Compare</button>
        </div>
      </div>

      {error && <div class="error-banner">{error}</div>}
      {loading && <div class="loading-indicator">Loading assessment...</div>}

      {assessment && (
        <div class="assessment-results">
          <div class="score-card {getScoreColor(assessment.overall_survivability_score)}">
            <h3>Overall Survivability Score</h3>
            <div class="score-value">{assessment.overall_survivability_score.toFixed(1)} / 100</div>
            <p class="score-label">Higher is better for human survival</p>
          </div>

          <div class="category-breakdown">
            <h3>Category Breakdown</h3>
            <div class="category-grid">
              {[
                { name: 'Atmospheric', weight: 20, metrics: assessment.atmospheric },
                { name: 'Radiation', weight: 25, metrics: assessment.radiation },
                { name: 'Thermal', weight: 20, metrics: assessment.thermal },
                { name: 'Water', weight: 20, metrics: assessment.water },
                { name: 'Hazards', weight: 15, metrics: assessment.hazards },
              ].map(cat => (
                <div key={cat.name} class="category-card">
                  <h4>{cat.name} ({cat.weight}%)</h4>
                  <div class="category-metrics">
                    {Object.entries(cat.metrics).map(([key, value]) => (
                      <div key={key} class="metric">
                        <span class="metric-label">{key.replace(/_/g, ' ')}:</span>
                        <span class="metric-value">{typeof value === 'object' ? JSON.stringify(value) : value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div class="limiting-factors">
            <h3>Limiting Factors</h3>
            <ul>
              {assessment.limiting_factors.map((factor: string, i: number) => (
                <li key={i}>{factor}</li>
              ))}
            </ul>
          </div>

          <div class="uncertainties">
            <h3>Uncertainties & Data Sources</h3>
            <h4>Uncertainties</h3>
            <ul>
              {Object.entries(assessment.uncertainties).map(([key, value]) => (
                <li key={key}><strong>{key}:</strong> {value}</li>
              ))}
            </ul>
            <h4>Data Sources</h3>
            <ul>
              {assessment.data_sources.map((src: string, i: number) => (
                <li key={i}>{src}</li>
              ))}
            </ul>
          </div>

          <div class="caveats">
            <h3>Important Caveats</h3>
            <ul>
              {assessment.caveats.map((caveat: string, i: number) => (
                <li key={i}>{caveat}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Comparison Results */}
      {/* TODO: Add comparison view */}
    </div>
  );
}

export default SurvivalView;