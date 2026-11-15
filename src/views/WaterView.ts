// @ts-nocheck
/**
 * Water Resources View for MARSCOPE.
 */

import { h } from 'preact';

export function WaterView() {
  return h('div', { class: 'water-view' }, [
    h('div', { class: 'view-header' }, [
      h('h2', null, 'Water Resources'),
      h('p', { class: 'view-description' }, 'Explore water ice deposits, hydrated minerals, and extraction potential')
    ]),

    h('div', { class: 'water-tabs' }, [
      h('button', { class: 'active' }, 'Surface Ice'),
      h('button', null, 'Subsurface Ice'),
      h('button', null, 'Hydrated Minerals'),
      h('button', null, 'RSL (Recurring Slope Lineae)'),
      h('button', null, 'Extraction Feasibility')
    ]),

    h('div', { class: 'water-content' }, [
      h('div', { class: 'water-sidebar' }, [
        h('h3', null, 'Data Layers'),
        h('div', { class: 'layer-list' }, [
          h('label', { class: 'layer-item' }, [
            h('input', { type: 'checkbox', checked: true }),
            h('span', null, 'Polar Ice Caps'),
            h('span', { class: 'layer-meta' }, 'MOLA + SHARAD, >80° lat')
          ]),
          h('label', { class: 'layer-item' }, [
            h('input', { type: 'checkbox' }),
            h('span', null, 'Mid-latitude Glaciers'),
            h('span', { class: 'layer-meta' }, 'SHARAD, 30°-60° lat')
          ]),
          h('label', { class: 'layer-item' }, [
            h('input', { type: 'checkbox' }),
            h('span', null, 'Subsurface Ice (SHARAD)'),
            h('span', { class: 'layer-meta' }, '3-10 km resolution')
          ]),
          h('label', { class: 'layer-item' }, [
            h('input', { type: 'checkbox' }),
            h('span', null, 'Hydrated Minerals (CRISM)'),
            h('span', { class: 'layer-meta' }, '18 m/px, Targeted')
          ]),
          h('label', { class: 'layer-item' }, [
            h('input', { type: 'checkbox' }),
            h('span', null, 'Recurring Slope Lineae'),
            h('span', { class: 'layer-meta' }, 'HiRISE, 25°-40° lat')
          ]),
          h('label', { class: 'layer-item' }, [
            h('input', { type: 'checkbox' }),
            h('span', null, 'Neutron Spectrometer (HEND/NS)'),
            h('span', { class: 'layer-meta' }, '~300 km/pixel')
          ])
        ]),

        h('h3', null, 'Known Ice Deposits'),
        h('div', { class: 'feature-list' }, [
          h('div', { class: 'feature-item' }, [ h('strong', null, 'North Polar Cap'), h('span', null, '1.6M km³, 2-3 km thick') ]),
          h('div', { class: 'feature-item' }, [ h('strong', null, 'South Polar Cap'), h('span', null, '1.6M km³, 2-3 km thick, CO₂ cap') ]),
          h('div', { class: 'feature-item' }, [ h('strong', null, 'Mid-latitude Glaciers'), h('span', null, '~1000 km³, 30°-60° lat') ]),
          h('div', { class: 'feature-item' }, [ h('strong', null, 'Arcadia Planitia'), h('span', null, 'Shallow ice, <1m depth') ]),
          h('div', { class: 'feature-item' }, [ h('strong', null, 'Deuteronilus Mensae'), h('span', null, 'Lobate debris aprons, ice-rich') ])
        ]),

        h('h3', null, 'Extraction Feasibility'),
        h('table', { class: 'data-table' }, [
          h('thead', null, h('tr', null, [
            h('th', null, 'Source'),
            h('th', null, 'Energy (MJ/kg)'),
            h('th', null, 'Equipment'),
            h('th', null, 'Yield (kg/sol)')
          ])),
          h('tbody', null, [
            h('tr', null, [ h('td', null, 'Surface Ice'), h('td', null, '2.8'), h('td', null, 'Excavator + Heater'), h('td', null, '1000 kg/sol') ]),
            h('tr', null, [ h('td', null, 'Subsurface Ice'), h('td', null, '3.5'), h('td', null, 'Drill + Heater'), h('td', null, '500 kg/sol') ]),
            h('tr', null, [ h('td', null, 'Hydrated Minerals'), h('td', null, '15'), h('td', null, 'Oven + Crusher'), h('td', null, '100 kg/sol') ])
          ])
        ])
      ]),

      h('div', { class: 'map-placeholder' }, [
        h('div', { class: 'map-info' }, [
          h('h3', null, 'Water Resources Map'),
          h('p', null, 'Click on map to inspect water ice deposits and extraction potential'),
          h('div', { class: 'layer-legend' }, [
            h('h4', null, 'Active Layers'),
            h('ul', null, [
              h('li', null, 'Polar Ice Caps (base)'),
              h('li', null, 'Subsurface Ice Probability (overlay)'),
              h('li', null, 'Hydrated Minerals (points)')
            ])
          ])
        ])
      ]),

      h('div', { class: 'water-info-panel' }, [
        h('h3', null, 'Water Resource Details'),
        h('p', { class: 'hint' }, 'Click on the map to inspect a water resource'),
        h('div', { class: 'resource-info-placeholder' }, [
          h('p', null, 'Click on a water feature to see:'),
          h('ul', null, [
            h('li', null, 'Type: Surface ice / Subsurface ice / Hydrated mineral / RSL'),
            h('li', null, 'Estimated volume / abundance'),
            h('li', null, 'Depth / accessibility'),
            h('li', null, 'Extraction energy requirements'),
            h('li', null, 'SHARAD/CRISM detection confidence'),
            h('li', null, 'Reference publication')
          ])
        ])
      ])
    ])
  ]);
}

export default WaterView;