// @ts-nocheck
/**
 * Radiation Environment View for MARSCOPE.
 */

import { h } from 'preact';

export function RadiationView() {
  return h('div', { class: 'radiation-view' }, [
    h('div', { class: 'view-header' }, [
      h('h2', null, 'Radiation Environment'),
      h('p', { class: 'view-description' }, 'Analyze galactic cosmic rays, solar particle events, and shielding requirements')
    ]),

    h('div', { class: 'radiation-tabs' }, [
      h('button', { class: 'active' }, 'Surface Dose'),
      h('button', null, 'GCR Flux'),
      h('button', null, 'SPE Events'),
      h('button', null, 'Subsurface Shielding'),
      h('button', null, 'Mission Dose')
    ]),

    h('div', { class: 'radiation-content' }, [
      h('div', { class: 'radiation-sidebar' }, [
        h('h3', null, 'Data Layers'),
        h('div', { class: 'layer-list' }, [
          h('label', { class: 'layer-item' }, [
            h('input', { type: 'checkbox', checked: true }),
            h('span', null, 'GCR Surface Dose (RAD)'),
            h('span', { class: 'layer-meta' }, 'Curiosity, Gale Crater')
          ]),
          h('label', { class: 'layer-item' }, [
            h('input', { type: 'checkbox' }),
            h('span', null, 'Orbital Radiation (MARIE)'),
            h('span', { class: 'layer-meta' }, 'Odyssey, Global')
          ]),
          h('label', { class: 'layer-item' }, [
            h('input', { type: 'checkbox' }),
            h('span', null, 'SPE Probability Model'),
            h('span', { class: 'layer-meta' }, 'Statistical, Historical')
          ]),
          h('label', { class: 'layer-item' }, [
            h('input', { type: 'checkbox' }),
            h('span', null, 'Subsurface Dose Profile'),
            h('span', { class: 'layer-meta' }, 'Model: GCR attenuation')
          ]),
          h('label', { class: 'layer-item' }, [
            h('input', { type: 'checkbox' }),
            h('span', null, 'Regolith Shielding'),
            h('span', { class: 'layer-meta' }, '2-3m for long-term')
          ])
        ]),

        h('h3', null, 'Radiation Sources'),
        h('div', { class: 'source-list' }, [
          h('div', { class: 'source-item' }, [
            h('strong', null, 'Galactic Cosmic Rays (GCR)'),
            h('span', null, '~0.21 mGy/day surface, isotropic, high energy (GeV)')
          ]),
          h('div', { class: 'source-item' }, [
            h('strong', null, 'Solar Particle Events (SPE)'),
            h('span', null, 'Episodic, ~0.04 mGy/day avg, up to 1000x during events')
          ]),
          h('div', { class: 'source-item' }, [
            h('strong', null, 'Secondary Neutrons'),
            h('span', null, '~30% of surface dose, produced by GCR interactions')
          ]),
          h('div', { class: 'source-item' }, [
            h('strong', null, 'Albedo Protons'),
            h('span', null, 'Reflected from surface, minor component')
          ])
        ]),

        h('h3', null, 'Key Missions'),
        h('div', { class: 'mission-list' }, [
          h('div', { class: 'mission-item' }, [ h('strong', null, 'RAD (Curiosity)'), h('span', null, 'Surface dose rate, Gale Crater, 2012-present') ]),
          h('div', { class: 'mission-item' }, [ h('strong', null, 'MARIE (Odyssey)'), h('span', null, 'Orbital radiation, 2002-2003 (failed early)') ]),
          h('div', { class: 'mission-item' }, [ h('strong', null, 'MEDA (Perseverance)'), h('span', null, 'SkyCam + radiation, Jezero Crater, 2021-present') ]),
          h('div', { class: 'mission-item' }, [ h('strong', null, 'RAD (Mars 2020)'), h('span', null, 'Transit + surface, cruise + Jezero') ])
        ]),

        h('h3', null, 'Shielding Requirements'),
        h('table', { class: 'data-table' }, [
          h('thead', null, h('tr', null, [ h('th', null, 'Material'), h('th', null, 'Thickness for 50 mSv/yr'), h('th', null, 'Mass (kg/m²)') ])),
          h('tbody', null, [
            h('tr', null, [ h('td', null, 'Regolith'), h('td', null, '2-3 m'), h('td', null, '3000-4500') ]),
            h('tr', null, [ h('td', null, 'Water/Ice'), h('td', null, '1-1.5 m'), h('td', null, '1000-1500') ]),
            h('tr', null, [ h('td', null, 'Polyethylene'), h('td', null, '10-15 cm'), h('td', null, '90-135') ]),
            h('tr', null, [ h('td', null, 'Aluminum'), h('td', null, '20-30 cm'), h('td', null, '540-810') ])
          ])
        ])
      ]),

      h('div', { class: 'map-placeholder' }, [
        h('div', { class: 'map-info' }, [
          h('h3', null, 'Radiation Map'),
          h('p', null, 'Click on map to get radiation dose estimates for any location'),
          h('div', { class: 'layer-legend' }, [
            h('h4', null, 'Active Layers'),
            h('ul', null, [
              h('li', null, 'GCR Surface Dose (base)'),
              h('li', null, 'SPE Probability (overlay)')
            ])
          ])
        ])
      ]),

      h('div', { class: 'radiation-info-panel' }, [
        h('h3', null, 'Radiation Assessment'),
        h('p', { class: 'hint' }, 'Click on the map to get radiation dose estimates for any location'),
        h('div', { class: 'assessment-placeholder' }, [
          h('p', null, 'Click on the map to see:'),
          h('ul', null, [
            h('li', null, 'GCR dose rate (mGy/day)'),
            h('li', null, 'SPE probability per sol'),
            h('li', null, 'Annual dose (mSv/yr)'),
            h('li', null, 'Subsurface dose at 0.1m, 0.5m, 1m, 2m, 3m'),
            h('li', null, 'Shielding recommendations'),
            h('li', null, 'Acute vs chronic risk thresholds')
          ])
        ]),

        h('div', { class: 'dose-calculator' }, [
          h('h4', null, 'Mission Dose Calculator'),
          h('div', { class: 'calc-form' }, [
            h('label', null, [
              'Duration (sols):',
              h('input', { type: 'number', value: '500', min: '1', max: '2000' })
            ]),
            h('label', null, [
              'Shielding:',
              h('select', null, [
                h('option', { value: 'none' }, 'None (surface)'),
                h('option', { value: 'regolith_1m' }, '1m Regolith'),
                h('option', { value: 'regolith_3m' }, '3m Regolith'),
                h('option', { value: 'water_1m' }, '1m Water'),
                h('option', { value: 'polyethylene_10cm' }, '10cm Polyethylene')
              ])
            ]),
            h('label', null, [
              'Activity:',
              h('select', null, [
                h('option', { value: 'habitat' }, 'Inside habitat'),
                h('option', { value: 'eva' }, 'EVA (surface)'),
                h('option', { value: 'transit' }, 'Transit (deep space)')
              ])
            ]),
            h('button', { class: 'btn-primary' }, 'Calculate Dose')
          ]),
          h('div', { class: 'calc-result' }, [
            h('p', null, 'Estimated Dose: ', h('strong', null, '--- mSv')),
            h('p', null, 'Career Limit (NASA): ', h('strong', null, '600-1200 mSv'), ' (age/sex dependent)')
          ])
        ])
      ])
    ])
  ]);
}

export default RadiationView;