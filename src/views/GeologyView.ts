// @ts-nocheck
/**
 * Surface Geology View for MARSCOPE.
 */

import { h } from 'preact';

export function GeologyView() {
  return h('div', { class: 'geology-view' }, [
    h('div', { class: 'view-header' }, [
      h('h2', null, 'Surface Geology'),
      h('p', { class: 'view-description' }, 'Explore Mars geological units, mineralogy, and stratigraphy')
    ]),

    h('div', { class: 'geology-tabs' }, [
      h('button', { class: 'active' }, 'MOLA Elevation'),
      h('button', null, 'HRSC DEM'),
      h('button', null, 'CTX Mosaic'),
      h('button', null, 'HiRISE DTMs'),
      h('button', null, 'Geologic Maps'),
      h('button', null, 'Mineralogy (CRISM)')
    ]),

    h('div', { class: 'geology-content' }, [
      h('div', { class: 'geology-sidebar' }, [
        h('h3', null, 'Base Layers'),
        h('div', { class: 'layer-list' }, [
          h('label', { class: 'layer-item' }, [
            h('input', { type: 'radio', name: 'geology-base', checked: true }),
            h('span', null, 'MOLA Hillshade'),
            h('span', { class: 'layer-meta' }, '463 m/px, Global')
          ]),
          h('label', { class: 'layer-item' }, [
            h('input', { type: 'radio', name: 'geology-base' }),
            h('span', null, 'MOLA Colorized Elevation'),
            h('span', { class: 'layer-meta' }, '463 m/px, Global')
          ]),
          h('label', { class: 'layer-item' }, [
            h('input', { type: 'radio', name: 'geology-base' }),
            h('span', null, 'HRSC Blended DEM'),
            h('span', { class: 'layer-meta' }, '50-200 m/px, ~60% coverage')
          ]),
          h('label', { class: 'layer-item' }, [
            h('input', { type: 'radio', name: 'geology-base' }),
            h('span', null, 'CTX Mosaic'),
            h('span', { class: 'layer-meta' }, '5-6 m/px, >99% coverage')
          ]),
          h('label', { class: 'layer-item' }, [
            h('input', { type: 'radio', name: 'geology-base' }),
            h('span', null, 'HiRISE Orthoimages'),
            h('span', { class: 'layer-meta' }, '0.25-0.5 m/px, ~3%')
          ])
        ]),

        h('h3', null, 'Overlay Layers'),
        h('div', { class: 'layer-list' }, [
          h('label', { class: 'layer-item' }, [
            h('input', { type: 'checkbox', checked: true }),
            h('span', null, 'USGS Geologic Units'),
            h('span', { class: 'layer-meta' }, 'Vector, Public Domain')
          ]),
          h('label', { class: 'layer-item' }, [
            h('input', { type: 'checkbox' }),
            h('span', null, 'CRISM Mineralogy'),
            h('span', { class: 'layer-meta' }, '18 m/px, Targeted')
          ]),
          h('label', { class: 'layer-item' }, [
            h('input', { type: 'checkbox' }),
            h('span', null, 'THEMIS Thermal Inertia'),
            h('span', { class: 'layer-meta' }, '100 m/px, Global')
          ]),
          h('label', { class: 'layer-item' }, [
            h('input', { type: 'checkbox' }),
            h('span', null, 'HiRISE DTMs'),
            h('span', { class: 'layer-meta' }, '1 m/post, Targeted')
          ])
        ]),

        h('h3', null, 'Feature Search'),
        h('input', { type: 'text', placeholder: 'Search geologic features...' })
      ]),

      h('div', { class: 'map-placeholder' }, [
        h('div', { class: 'map-info' }, [
          h('h3', null, 'Interactive Geology Map'),
          h('p', null, 'Click on map to inspect geologic units, mineralogy, and stratigraphy'),
          h('div', { class: 'layer-legend' }, [
            h('h4', null, 'Active Layers'),
            h('ul', null, [
              h('li', null, 'MOLA Hillshade (base)'),
              h('li', null, 'USGS Geologic Units (overlay, 60% opacity)')
            ])
          ])
        ])
      ]),

      h('div', { class: 'geology-info-panel' }, [
        h('h3', null, 'Geologic Unit Information'),
        h('p', { class: 'hint' }, 'Click on the map to inspect a geologic unit'),
        h('div', { class: 'unit-info-placeholder' }, [
          h('p', null, 'Click on a geologic unit to see:'),
          h('ul', null, [
            h('li', null, 'Unit name and age'),
            h('li', null, 'Primary mineralogy'),
            h('li', null, 'Stratigraphic context'),
            h('li', null, 'Reference publication'),
            h('li', null, 'CRISM mineral detections in area'),
            h('li', null, 'HiRISE coverage')
          ])
        ])
      ])
    ])
  ]);
}

export default GeologyView;