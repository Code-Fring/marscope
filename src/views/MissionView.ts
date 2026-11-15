// @ts-nocheck
/**
 * Mission Planning View for MARSCOPE.
 */

import { h } from 'preact';
import { missionState, analyzeSite, fetchCandidates, createMissionPlan, addWaypoint, removeWaypoint, clearWaypoints, setActiveTab } from '@/stores/missionStore';
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

  return h('div', { class: 'mission-view' }, [
    h('div', { class: 'view-header' }, [
      h('h2', null, 'Mission Planning'),
      h('div', { class: 'view-actions' }, [
        h('button', { class: 'btn-secondary', onClick: () => { /* clearMissionData() */ } }, 'Clear')
      ])
    ]),

    error && h('div', { class: 'error-banner' }, error),
    loading && h('div', { class: 'loading-indicator' }, 'Loading...'),

    h('div', { class: 'mission-tabs' }, [
      h('button', { class: activeTab === 'analyze' ? 'active' : '', onClick: () => setActiveTab('analyze') }, 'Analyze Site'),
      h('button', { class: activeTab === 'candidates' ? 'active' : '', onClick: () => { setActiveTab('candidates'); fetchCandidates({ min_lat: -60, max_lat: 60, min_lon: 0, max_lon: 360, limit: 20 }); } }, 'Site Candidates'),
      h('button', { class: activeTab === 'plan' ? 'active' : '', onClick: () => setActiveTab('plan') }, 'Route Planner')
    ]),

    h('div', { class: 'mission-content' }, [
      // Analyze Site Tab
      h('div', { class: 'tab-panel' }, [
        h('h3', null, 'Analyze Landing Site'),
        h('div', { class: 'analyze-form' }, [
          h('label', null, [
            'Latitude:',
            h('input', { type: 'number', step: '0.0001', min: '-90', max: '90', placeholder: 'Lat' })
          ]),
          h('label', null, [
            'Longitude:',
            h('input', { type: 'number', step: '0.0001', min: '-180', max: '360', placeholder: 'Lon (+E 0-360)' })
          ]),
          h('label', null, [
            'Analysis Radius (km):',
            h('input', { type: 'number', min: '1', max: '500', value: '50' })
          ]),
          h('button', { class: 'btn-primary', disabled: loading }, 'Analyze Site')
        ]),

        currentSite && h('div', { class: 'site-analysis-results' }, [
          h('h3', null, 'Site Analysis: ' + currentSite.name),
          h('div', { class: 'score-card' }, [
            h('h3', null, 'Overall Score: ' + currentSite.score.toFixed(1) + ' / 100')
          ]),

          h('div', { class: 'metrics-grid' }, [
            h('div', { class: 'metric-card' }, [
              h('h4', null, 'Slope Analysis'),
              h('p', null, 'Mean: ' + currentSite.slope_stats.mean_deg + '°'),
              h('p', null, 'Max: ' + currentSite.slope_stats.max_deg + '°'),
              h('p', null, '<5°: ' + currentSite.slope_stats.pct_under_5 + '%'),
              h('p', null, '<15°: ' + currentSite.slope_stats.pct_under_15 + '%'),
              h('p', null, '<30°: ' + currentSite.slope_stats.pct_under_30 + '%')
            ]),

            h('div', { class: 'metric-card' }, [
              h('h4', null, 'Geology'),
              h('p', null, 'Unit: ' + currentSite.geology.primary_unit),
              h('p', null, 'Age: ' + (currentSite.geology.unit_age || 'Unknown')),
              h('p', null, 'Mineralogy: ' + (currentSite.geology.mineralogy?.join(', ') || 'N/A'))
            ]),

            h('div', { class: 'metric-card' }, [
              h('h4', null, 'Water Access'),
              h('p', null, 'Distance to Ice: ' + (currentSite.water_access.distance_to_ice_km || 'N/A') + ' km'),
              h('p', null, 'Type: ' + (currentSite.water_access.ice_type || 'None')),
              h('p', null, 'Extraction: ' + (currentSite.water_access.extraction_difficulty || 'Unknown')),
              h('p', null, 'Est. Yield: ' + (currentSite.water_access.estimated_yield_kg_per_sol || 0) + ' kg/sol')
            ]),

            h('div', { class: 'metric-card' }, [
              h('h4', null, 'Solar Potential'),
              h('p', null, 'Annual: ' + currentSite.solar_potential.annual_insolation_kwh_m2 + ' kWh/m²'),
              h('p', null, 'Winter Min: ' + currentSite.solar_potential.worst_month_insolation_kwh_m2 + ' kWh/m²'),
              h('p', null, 'Winter Daylight: ' + currentSite.solar_potential.daylight_hours_winter + 'h'),
              h('p', null, 'Summer Daylight: ' + currentSite.solar_potential.daylight_hours_summer + 'h')
            ]),

            h('div', { class: 'metric-card' }, [
              h('h4', null, 'Communications'),
              h('p', null, 'Earth Visible: ' + currentSite.communications.earth_visible_hours_per_sol + 'h/sol'),
              h('p', null, 'Relay Passes: ' + currentSite.communications.relay_orbiter_passes_per_sol + '/sol'),
              h('p', null, 'Max Rate: ' + currentSite.communications.max_data_rate_mbps + ' Mbps')
            ]),

            h('div', { class: 'metric-card' }, [
              h('h4', null, 'Hazards'),
              h('ul', null, currentSite.hazards.map((h: any, i: number) => h('li', { key: i, class: 'hazard-' + h.severity }, [
                h('strong', null, h.type + ': '),
                h('span', null, h.description),
                h.mitigation && h('span', null, ' - Mitigation: ' + h.mitigation)
              ])))
            ])
          ]),

          h('div', { class: 'score-breakdown' }, [
            h('h3', null, 'Score Breakdown'),
            h('ul', null, Object.entries(currentSite.score_breakdown).map(([key, value]) => h('li', { key: key }, [h('strong', null, key + ': '), String(value) + '/25'])))
          ]),

          h('div', { class: 'assumptions' }, [
            h('h3', null, 'Assumptions'),
            h('ul', null, currentSite.assumptions.map((a: string, i: number) => h('li', { key: i }, a)))
          ]),

          h('div', { class: 'uncertainties' }, [
            h('h3', null, 'Uncertainties'),
            h('ul', null, Object.entries(currentSite.uncertainties).map(([key, value]) => h('li', { key: key }, [h('strong', null, key + ': '), String(value)])))
          ]),

          h('button', { class: 'btn-primary', onClick: () => { /* create plan */ } }, 'Create Mission Plan')
        ])
      ]),

      // Site Candidates Tab
      h('div', { class: 'tab-panel' }, [
        h('h3', null, 'Pre-analyzed Site Candidates'),
        h('div', { class: 'candidates-controls' }, [
          h('label', null, [ 'Min Lat: ', h('input', { type: 'number', step: '1', min: '-90', max: '90', placeholder: 'Min Lat' }) ]),
          h('label', null, [ 'Max Lat: ', h('input', { type: 'number', step: '1', min: '-90', max: '90', placeholder: 'Max Lat' }) ]),
          h('label', null, [ 'Min Lon: ', h('input', { type: 'number', step: '1', min: '0', max: '360', placeholder: 'Min Lon' }) ]),
          h('label', null, [ 'Max Lon: ', h('input', { type: 'number', step: '1', min: '0', max: '360', placeholder: 'Max Lon' }) ]),
          h('label', null, [ 'Min Score: ', h('input', { type: 'number', min: '0', max: '100', value: '0' }) ]),
          h('label', null, [ 'Limit: ', h('input', { type: 'number', min: '1', max: '100', value: '20' }) ]),
          h('button', { class: 'btn-primary', disabled: loading, onClick: handleFetchCandidates }, 'Find Candidates')
        ]),

        candidates && h('div', { class: 'candidates-list' }, [
          h('table', { class: 'data-table' }, [
            h('thead', null, h('tr', null, [
              h('th', null, 'Name'),
              h('th', null, 'Lat'),
              h('th', null, 'Lon'),
              h('th', null, 'Elev (m)'),
              h('th', null, 'Score'),
              h('th', null, 'Slope %<5°'),
              h('th', null, 'Water'),
              h('th', null, 'Action')
            ])),
            h('tbody', null, candidates.map((site: any) => h('tr', { key: site.id }, [
              h('td', null, site.name),
              h('td', null, site.lat.toFixed(4)),
              h('td', null, site.lon.toFixed(4)),
              h('td', null, site.elevation_m?.toFixed(0) || 'N/A'),
              h('td', { class: site.score >= 70 ? 'score-high' : site.score >= 40 ? 'score-medium' : 'score-low' }, site.score.toFixed(1)),
              h('td', null, site.slope_stats.pct_under_5 + '%'),
              h('td', null, site.water_access.ice_type || 'None'),
              h('td', null, [ h('button', { class: 'btn-small', onClick: () => { /* select site */ } }, 'Select') ])
            ]))
          ])
        ])
      ]),

      // Route Planner Tab
      h('div', { class: 'tab-panel' }, [
        h('h3', null, 'Route Planner'),
        h('div', { class: 'waypoints-form' }, [
          h('h4', null, 'Waypoints'),
          h('div', { class: 'waypoints-list' }, [
            waypoints.map((wp: any, i: number) => h('div', { key: i, class: 'waypoint-item' }, [
              h('input', { type: 'number', step: '0.0001', placeholder: 'Lat', value: wp.lat, onChange: (e: any) => { /* update */ } }),
              h('input', { type: 'number', step: '0.0001', placeholder: 'Lon (+E 0-360)', value: wp.lon, onChange: (e: any) => { /* update */ } }),
              h('button', { class: 'btn-danger', onClick: () => removeWp(i) }, 'Remove')
            ]))
          ]),
          h('button', { class: 'btn-secondary', onClick: () => addWp(0, 0) }, 'Add Waypoint'),
          h('button', { class: 'btn-secondary', onClick: () => clearWaypoints() }, 'Clear All'),
          h('div', { class: 'route-options' }, [
            h('label', null, [
              'Samples per Segment:',
              h('input', { type: 'number', min: '10', max: '200', value: '50' })
            ])
          ]),
          h('button', { class: 'btn-primary', disabled: loading || waypoints.length < 2 }, 'Generate Route'),

          currentPlan && h('div', { class: 'route-results' }, [
            h('h3', null, 'Route Plan: ' + currentPlan.name),
            h('div', { class: 'route-summary' }, [
              h('p', null, [ h('strong', null, 'Total Distance: '), String(currentPlan.totalDistance.toFixed(1) + ' m') ]),
              h('p', null, [ h('strong', null, 'Cumulative Ascent: '), String(currentPlan.cumulativeAscent.toFixed(1) + ' m') ]),
              h('p', null, [ h('strong', null, 'Cumulative Descent: '), String(currentPlan.cumulativeDescent.toFixed(1) + ' m') ]),
              h('p', null, [ h('strong', null, 'Max Slope: '), String(currentPlan.maxSlope.toFixed(2) + '°') ])
            ]),
            h('h4', null, 'Segments'),
            h('table', { class: 'data-table' }, [
              h('thead', null, h('tr', null, [
                h('th', null, 'From'),
                h('th', null, 'To'),
                h('th', null, 'Distance (m)'),
                h('th', null, 'Ascent (m)'),
                h('th', null, 'Descent (m)'),
                h('th', null, 'Max Slope (°)')
              ])),
              h('tbody', null, currentPlan.segments.map((seg: any, i: number) => h('tr', { key: i }, [
                h('td', null, seg.start.lat.toFixed(4) + ', ' + seg.start.lon.toFixed(4)),
                h('td', null, seg.end.lat.toFixed(4) + ', ' + seg.end.lon.toFixed(4)),
                h('td', null, seg.distance.toFixed(1)),
                h('td', null, seg.ascent.toFixed(1)),
                h('td', null, seg.descent.toFixed(1)),
                h('td', null, seg.maxSlope.toFixed(2))
              ])))
            ]),
            h('div', { class: 'caveat' }, [
              h('strong', null, '⚠ Candidate route only'),
              ' - No hazard/rock/trafficability/illumination/comms data. Based on MOLA 463m DEM only. Not a certified safe traverse.'
            ]),
            h('button', { class: 'btn-secondary' }, 'Export GeoJSON'),
            h('button', { class: 'btn-secondary' }, 'Export CSV')
          )}
        ])
      ])
    ])
  ]);
}

export default MissionView;