// @ts-nocheck
/**
 * Interplanetary Survival Assessment View for MARSCOPE.
 */

import { h } from 'preact';
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

  return h('div', { class: 'survival-view' }, [
    h('div', { class: 'view-header' }, [
      h('h2', null, 'Interplanetary Survival Assessment'),
      h('div', { class: 'view-actions' }, [
        h('button', { class: 'btn-secondary', onClick: () => { /* clearSurvivalData() */ } }, 'Clear')
      ])
    ]),

    error && h('div', { class: 'error-banner' }, error),
    loading && h('div', { class: 'loading-indicator' }, 'Loading assessment...'),

    h('div', { class: 'survival-form' }, [
      h('h3', null, 'Assess Location'),
      h('div', { class: 'form-row' }, [
        h('label', null, [
          'Latitude:',
          h('input', { type: 'number', step: '0.0001', min: '-90', max: '90', placeholder: 'Lat' })
        ]),
        h('label', null, [
          'Longitude:',
          h('input', { type: 'number', step: '0.0001', min: '-180', max: '360', placeholder: 'Lon (+E 0-360)' })
        ]),
        h('label', null, [
          'Season:',
          h('select', null, [
            h('option', { value: 'average' }, 'Average'),
            h('option', { value: 'spring' }, 'Spring'),
            h('option', { value: 'summer' }, 'Summer'),
            h('option', { value: 'autumn' }, 'Autumn'),
            h('option', { value: 'winter' }, 'Winter')
          ])
        ]),
        h('button', { class: 'btn-primary', disabled: loading }, 'Assess')
      ]),

      h('div', { class: 'compare-section' }, [
        h('h3', null, 'Compare Locations'),
        h('input', { type: 'text', placeholder: 'lat1,lon1;lat2,lon2;...', placeholder: 'e.g., 18.65,226.2;-4.5,137.4' }),
        h('button', { class: 'btn-secondary', disabled: loading }, 'Compare')
      ])
    ]),

    error && h('div', { class: 'error-banner' }, error),
    loading && h('div', { class: 'loading-indicator' }, 'Loading assessment...'),

    assessment && h('div', { class: 'assessment-results' }, [
      h('div', { class: 'score-card ' + (assessment.overall_survivability_score >= 70 ? 'score-high' : assessment.overall_survivability_score >= 40 ? 'score-medium' : 'score-low') }, [
        h('h3', null, 'Overall Survivability Score'),
        h('div', { class: 'score-value' }, assessment.overall_survivability_score.toFixed(1) + ' / 100'),
        h('p', { class: 'score-label' }, 'Higher is better for human survival')
      ]),

      h('div', { class: 'category-breakdown' }, [
        h('h3', null, 'Category Breakdown'),
        h('div', { class: 'category-grid' }, [
          h('div', { class: 'category-card' }, [
            h('h4', null, 'Atmospheric (20%)'),
            h('div', { class: 'category-metrics' }, Object.entries(assessment.atmospheric).map(([key, value]) => h('div', { class: 'metric', key: key }, [
              h('span', { class: 'metric-label' }, key.replace(/_/g, ' ') + ':'),
              h('span', { class: 'metric-value' }, typeof value === 'object' ? JSON.stringify(value) : String(value))
            ])))
          ]),
          h('div', { class: 'category-card' }, [
            h('h4', null, 'Radiation (25%)'),
            h('div', { class: 'category-metrics' }, Object.entries(assessment.radiation).map(([key, value]) => h('div', { class: 'metric', key: key }, [
              h('span', { class: 'metric-label' }, key.replace(/_/g, ' ') + ':'),
              h('span', { class: 'metric-value' }, typeof value === 'object' ? JSON.stringify(value) : String(value))
            ])))
          ]),
          h('div', { class: 'category-card' }, [
            h('h4', null, 'Thermal (20%)'),
            h('div', { class: 'category-metrics' }, Object.entries(assessment.thermal).map(([key, value]) => h('div', { class: 'metric', key: key }, [
              h('span', { class: 'metric-label' }, key.replace(/_/g, ' ') + ':'),
              h('span', { class: 'metric-value' }, typeof value === 'object' ? JSON.stringify(value) : String(value))
            ])))
          ]),
          h('div', { class: 'category-card' }, [
            h('h4', null, 'Water (20%)'),
            h('div', { class: 'category-metrics' }, Object.entries(assessment.water).map(([key, value]) => h('div', { class: 'metric', key: key }, [
              h('span', { class: 'metric-label' }, key.replace(/_/g, ' ') + ':'),
              h('span', { class: 'metric-value' }, typeof value === 'object' ? JSON.stringify(value) : String(value))
            ])))
          ]),
          h('div', { class: 'category-card' }, [
            h('h4', null, 'Hazards (15%)'),
            h('div', { class: 'category-metrics' }, Object.entries(assessment.hazards).map(([key, value]) => h('div', { class: 'metric', key: key }, [
              h('span', { class: 'metric-label' }, key.replace(/_/g, ' ') + ':'),
              h('span', { class: 'metric-value' }, typeof value === 'object' ? JSON.stringify(value) : String(value))
            ])))
          ])
        ])
      ]),

      h('div', { class: 'limiting-factors' }, [
        h('h3', null, 'Limiting Factors'),
        h('ul', null, assessment.limiting_factors.map((factor: string, i: number) => h('li', { key: i }, factor)))
      ]),

      h('div', { class: 'uncertainties' }, [
        h('h3', null, 'Uncertainties & Data Sources'),
        h('h4', null, 'Uncertainties'),
        h('ul', null, Object.entries(assessment.uncertainties).map(([key, value]) => h('li', { key: key }, [h('strong', null, key + ':'), ' ', String(value)]))),
        h('h4', null, 'Data Sources'),
        h('ul', null, assessment.data_sources.map((src: string, i: number) => h('li', { key: i }, src)))
      ]),

      h('div', { class: 'caveats' }, [
        h('h3', null, 'Important Caveats'),
        h('ul', null, assessment.caveats.map((caveat: string, i: number) => h('li', { key: i }, caveat)))
      ])
    ])
  ]);
}

export default SurvivalView;