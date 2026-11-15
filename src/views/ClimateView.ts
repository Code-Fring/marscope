// @ts-nocheck
/**
 * Climate & Weather View for MARSCOPE.
 */

import { h } from 'preact';
import { climateState, fetchWeather, fetchNormals, fetchDustStorms, fetchSolarIllumination } from '@/stores/climateStore';
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
    await fetchSolarIllumination(lat, lon, date);
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

  return h('div', { class: 'climate-view' }, [
    h('div', { class: 'view-header' }, [
      h('h2', null, 'Climate & Weather'),
      h('div', { class: 'view-actions' }, [
        h('button', { class: 'btn-secondary', onClick: () => { /* clearClimateData() */ } }, 'Clear')
      ])
    ]),
    error && h('div', { class: 'error-banner' }, error),
    loading && h('div', { class: 'loading-indicator' }, 'Loading...'),
    h('div', { class: 'climate-tabs' }, [
      h('button', { class: 'active', onClick: () => { /* setTab('weather') */ } }, 'Current Weather'),
      h('button', { onClick: () => { /* setTab('normals') */ } }, 'Climate Normals'),
      h('button', { onClick: () => { /* setTab('dust') */ } }, 'Dust Storms'),
      h('button', { onClick: () => { /* setTab('solar') */ } }, 'Solar Illumination')
    ]),
    h('div', { class: 'climate-content' }, [
      // Weather Tab
      h('div', { class: 'tab-panel' }, [
        h('h3', null, 'Current Weather Observations'),
        h('div', { class: 'weather-form' }, [
          h('label', null, [
            'Latitude:',
            h('input', { type: 'number', step: '0.0001', min: '-90', max: '90', placeholder: 'Lat' })
          ]),
          h('label', null, [
            'Longitude:',
            h('input', { type: 'number', step: '0.0001', min: '-180', max: '360', placeholder: 'Lon (+E 0-360)' })
          ]),
          h('label', null, [
            'Start Date:',
            h('input', { type: 'datetime-local' })
          ]),
          h('label', null, [
            'End Date:',
            h('input', { type: 'datetime-local' })
          ]),
          h('label', null, [
            'Source:',
            h('select', null, [
              h('option', { value: '' }, 'All'),
              h('option', { value: 'REMS' }, 'REMS (Curiosity)'),
              h('option', { value: 'MEDA' }, 'MEDA (Perseverance)'),
              h('option', { value: 'MARCI' }, 'MARCI (MRO)'),
              h('option', { value: 'MCS' }, 'MCS (MRO)')
            ])
          ]),
          h('button', { class: 'btn-primary', disabled: loading }, 'Fetch Weather')
        ]),
        h('div', { class: 'weather-results' }, [
          h('h4', null, 'Recent Observations'),
          h('table', { class: 'data-table' }, [
            h('thead', null, h('tr', null, [
              h('th', null, 'Time (UTC)'),
              h('th', null, 'Temp (K)'),
              h('th', null, 'Temp (°C)'),
              h('th', null, 'Pressure (Pa)'),
              h('th', null, 'Wind (m/s)'),
              h('th', null, 'Dust (τ)'),
              h('th', null, 'Source')
            ])),
            h('tbody', null, [
              h('tr', null, [
                h('td', { colSpan: 7, class: 'no-data' }, 'No data loaded. Click "Fetch Weather" to load observations.')
              ])
            ])
          ])
        ]),

        // Climate Normals Tab
        h('div', { class: 'tab-panel' }, [
          h('h3', null, 'Climate Normals (30-Mars-Year Averages)'),
          h('div', { class: 'normals-form' }, [
            h('label', null, [
              'Latitude:',
              h('input', { type: 'number', step: '0.0001', min: '-90', max: '90', placeholder: 'Lat' })
            ]),
            h('label', null, [
              'Longitude:',
              h('input', { type: 'number', step: '0.0001', min: '-180', max: '360', placeholder: 'Lon (+E 0-360)' })
            ]),
            h('button', { class: 'btn-primary', disabled: loading }, 'Fetch Normals')
          ]),
          h('div', { class: 'normals-results' }, [
            h('h4', null, 'Monthly Temperature (K)'),
            h('div', { class: 'chart-placeholder' }, '[Temperature chart would go here]'),
            h('h4', null, 'Monthly Pressure (Pa)'),
            h('div', { class: 'chart-placeholder' }, '[Pressure chart would go here]'),
            h('h4', null, 'Dust Storm Probability'),
            h('div', { class: 'chart-placeholder' }, '[Dust probability chart would go here]'),
            h('h4', null, 'Solar Illumination Hours'),
            h('div', { class: 'chart-placeholder' }, '[Solar illumination chart would go here]'),
            h('div', { class: 'normals-summary' }, [
              h('h4', null, 'Annual Summary'),
              h('dl', { class: 'summary-list' }, [
                h('dt', null, 'Annual Mean Temperature'), h('dd', null, '--- K'),
                h('dt', null, 'Annual Temperature Range'), h('dd', null, '--- K'),
                h('dt', null, 'Annual Mean Pressure'), h('dd', null, '--- Pa'),
                h('dt', null, 'Data Period'), h('dd', null, 'MY 28-34 (approx. 2007-2020)')
              ])
            ])
          ])
        ]),

        // Dust Storms Tab
        h('div', { class: 'tab-panel' }, [
          h('h3', null, 'Dust Storm Events'),
          h('div', { class: 'dust-form' }, [
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
                h('option', { value: '' }, 'All Seasons'),
                h('option', { value: 'spring' }, 'Spring'),
                h('option', { value: 'summer' }, 'Summer'),
                h('option', { value: 'autumn' }, 'Autumn'),
                h('option', { value: 'winter' }, 'Winter')
              ])
            ]),
            h('button', { class: 'btn-primary', disabled: loading }, 'Fetch Dust Storms')
          ]),
          h('div', { class: 'dust-results' }, [
            h('h4', null, 'Known Dust Storm Events'),
            h('div', { class: 'storm-list' }, [
              h('div', { class: 'storm-item' }, [
                h('h5', null, 'Global Dust Storm 2018'),
                h('p', null, 'May 30 - Sep 15, 2018 | Global | Peak opacity: 10.8'),
                h('p', { class: 'source' }, 'Source: MARCI/MRO | Guzewich et al. 2019')
              ]),
              h('div', { class: 'storm-item' }, [
                h('h5', null, 'Regional Storm 2007'),
                h('p', null, 'Jun 15 - Jul 20, 2007 | Regional | Peak opacity: 4.2'),
                h('p', { class: 'source' }, 'Source: MARCI/MRO | Wang & Richardson 2015')
              ])
            ])
          ])
        ]),

        // Solar Illumination Tab
        h('div', { class: 'tab-panel' }, [
          h('h3', null, 'Solar Illumination Calculator'),
          h('div', { class: 'solar-form' }, [
            h('label', null, [
              'Latitude:',
              h('input', { type: 'number', step: '0.0001', min: '-90', max: '90', placeholder: 'Lat' })
            ]),
            h('label', null, [
              'Longitude:',
              h('input', { type: 'number', step: '0.0001', min: '-180', max: '360', placeholder: 'Lon (+E 0-360)' })
            ]),
            h('label', null, [
              'Date:',
              h('input', { type: 'date' })
            ]),
            h('button', { class: 'btn-primary', disabled: loading }, 'Calculate')
          ]),
          h('div', { class: 'solar-results' }, [
            h('h4', null, 'Solar Illumination'),
            h('dl', { class: 'solar-details' }, [
              h('dt', null, 'Daylight Hours'), h('dd', null, '--- hours'),
              h('dt', null, 'Solar Zenith at Noon'), h('dd', null, '---°'),
              h('dt', null, 'Max Elevation Angle'), h('dd', null, '---°'),
              h('dt', null, 'Sunrise'), h('dd', null, '---'),
              h('dt', null, 'Sunset'), h('dd', null, '---'),
              h('dt', null, 'Polar Day'), h('dd', null, '---'),
              h('dt', null, 'Polar Night'), h('dd', null, '---')
            ])
          ])
        ])
      ])
    ])
  ]);
}

export default ClimateView;