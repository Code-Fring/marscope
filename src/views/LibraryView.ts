// @ts-nocheck
/**
 * Scientific Research Library View for MARSCOPE.
 */

import { h } from 'preact';
import { libraryState, searchLibrary, fetchResource, fetchStats, fetchCategories, fetchSources, clearLibraryData } from '@/stores/libraryStore';

export function LibraryView() {
  const state = libraryState.value;
  const loading = state.loading;
  const error = state.error;
  const resources = state.resources;
  const currentResource = state.currentResource;
  const totalResults = state.totalResults;
  const currentPage = state.currentPage;
  const pageSize = state.pageSize;
  const searchQuery = state.searchQuery;
  const selectedCategory = state.selectedCategory;
  const selectedSource = state.selectedSource;
  const categories = state.categories;
  const sources = state.sources;

  const handleSearch = async (query: string) => {
    await searchLibrary(query, {
      category: state.selectedCategory,
      source: state.selectedSource,
      page: 1,
      pageSize: state.pageSize
    });
  };

  const handleCategoryChange = (category: string | null) => {
    // setCategory(category);
  };

  const handleSourceChange = (source: string | null) => {
    // setSource(source);
  };

  const handlePageChange = (page: number) => {
    // setPage(page);
  };

  const handleResourceClick = async (resourceId: string) => {
    await fetchResource(resourceId);
  };

  const hasResults = resources && resources.length > 0;
  const isEmpty = !loading && searchQuery && (!resources || resources.length === 0);

  return h('div', { class: 'library-view' }, [
    h('div', { class: 'view-header' }, [
      h('h2', null, 'Scientific Research Library'),
      h('p', { class: 'view-description' }, 'Search NASA technical reports, scientific publications, and planetary datasets')
    ]),

    h('div', { class: 'library-toolbar' }, [
      h('div', { class: 'search-bar' }, [
        h('input', {
          type: 'text',
          placeholder: 'Search NASA NTRS, OpenAlex, Zenodo, PDS...',
          value: searchQuery,
          onChange: (e) => { /* handleSearch(e.target.value) */ },
          class: 'search-input'
        }),
        h('button', { class: 'btn-primary', disabled: loading }, 'Search')
      ]),

      h('div', { class: 'filters' }, [
        h('select', {
          value: selectedCategory || '',
          onChange: (e) => { /* handleCategoryChange(e.target.value) */ }
        }, [
          h('option', { value: '' }, 'All Categories'),
          h('option', { value: 'planetary_science' }, 'Planetary Science'),
          h('option', { value: 'human_spaceflight' }, 'Human Spaceflight'),
          h('option', { value: 'life_support' }, 'Life Support'),
          h('option', { value: 'isru' }, 'ISRU'),
          h('option', { value: 'habitat_engineering' }, 'Habitat Engineering'),
          h('option', { value: 'radiation_protection' }, 'Radiation Protection'),
          h('option', { value: 'mars_geology' }, 'Mars Geology'),
          h('option', { value: 'mars_climate' }, 'Mars Climate'),
          h('option', { value: 'mars_water' }, 'Mars Water'),
          h('option', { value: 'mars_atmosphere' }, 'Mars Atmosphere'),
          h('option', { value: 'mission_planning' }, 'Mission Planning'),
          h('option', { value: 'robotics' }, 'Robotics'),
          h('option', { value: 'astrobiology' }, 'Astrobiology'),
          h('option', { value: 'planetary_protection' }, 'Planetary Protection')
        ]),

        h('select', {
          value: selectedSource || '',
          onChange: (e) => { /* handleSourceChange(e.target.value) */ }
        }, [
          h('option', { value: '' }, 'All Sources'),
          h('option', { value: 'NTRS' }, 'NASA NTRS'),
          h('option', { value: 'OpenAlex' }, 'OpenAlex'),
          h('option', { value: 'Zenodo' }, 'Zenodo'),
          h('option', { value: 'PDS' }, 'NASA PDS'),
          h('option', { value: 'ADS' }, 'ADS'),
          h('option', { value: 'arXiv' }, 'arXiv')
        ])
      ])
    ]),

    error && h('div', { class: 'error-banner' }, error),
    loading && h('div', { class: 'loading-indicator' }, 'Searching...'),

    h('div', { class: 'library-results' }, [
      !loading && !resources && searchQuery && h('div', { class: 'no-results' }, [
        h('h3', null, 'No results found'),
        h('p', null, 'Try different search terms or adjust your filters')
      ]),

      resources && resources.length > 0 && [
        h('div', { class: 'results-header' }, [
          h('p', null, `${state.totalResults} results for "${searchQuery}"`),
          h('span', null, `Page ${state.currentPage} of ${Math.ceil(state.totalResults / state.pageSize)}`)
        ]),

        h('div', { class: 'results-grid' }, [
          resources.map(resource => h('article', {
            key: resource.id,
            class: 'resource-card',
            onClick: () => { /* handleResourceClick(resource.id) */ }
          }, [
            h('div', { class: 'resource-header' }, [
              h('span', { class: 'resource-source' }, resource.source),
              h('span', { class: 'resource-category' }, resource.category)
            ]),
            h('h3', { class: 'resource-title' }, resource.title),
            h('p', { class: 'resource-authors' }, resource.authors?.slice(0, 3).join(', ') + (resource.authors && resource.authors.length > 3 ? ' et al.' : '')),
            h('p', { class: 'resource-meta' },
              resource.publication_date && `Published: ${resource.publication_date}` + ' • ',
              resource.source + ' • ',
              resource.doi && `DOI: ${resource.doi}`
            ),
            h('p', { class: 'resource-abstract' }, resource.abstract?.substring(0, 200) + '...'),
            h('div', { class: 'resource-tags' }, [
              resource.tags?.slice(0, 5).map(tag => h('span', { key: tag, class: 'tag' }, tag))
            ]),
            resource.citation_count !== undefined && h('div', { class: 'resource-citations' }, '📖 ', resource.citation_count, ' citations')
          ]))
        ]),

        state.totalResults > 0 && h('div', { class: 'pagination' }, [
          h('button', {
            class: 'btn-secondary',
            disabled: state.currentPage <= 1,
            onClick: () => { /* setPage(state.currentPage - 1) */ }
          }, 'Previous'),
          h('span', null, `Page ${state.currentPage} of ${Math.ceil(state.totalResults / state.pageSize)}`),
          h('button', {
            class: 'btn-secondary',
            disabled: state.currentPage * state.pageSize >= state.totalResults,
            onClick: () => { /* setPage(state.currentPage + 1) */ }
          }, 'Next')
        ]
      ]
    ]),

    currentResource && h('div', { class: 'modal-overlay', onClick: () => { /* setCurrentResource(null) */ } }, [
      h('div', { class: 'modal-content', onClick: (e) => e.stopPropagation() }, [
        h('button', { class: 'modal-close', onClick: () => { /* setCurrentResource(null) */ } }, '×'),
        h('div', { class: 'resource-detail' }, [
          h('div', { class: 'resource-meta' }, [
            h('span', { class: 'resource-source' }, currentResource.source),
            h('span', { class: 'resource-category' }, currentResource.category)
          ]),
          h('h2', null, currentResource.title),
          h('p', { class: 'resource-authors' }, currentResource.authors?.join(', ')),
          h('p', { class: 'resource-meta' },
            currentResource.institution && `Institution: ${currentResource.institution}` + ' • ',
            currentResource.publication_date && `Published: ${currentResource.publication_date}` + ' • ',
            currentResource.doi && `DOI: ${currentResource.doi}`
          ),
          h('p', { class: 'resource-abstract' }, currentResource.abstract),
          h('div', { class: 'resource-tags' }, [
            currentResource.tags?.map(tag => h('span', { key: tag, class: 'tag' }, tag))
          ]),
          currentResource.url && h('a', { href: currentResource.url, target: '_blank', rel: 'noopener', class: 'btn-primary' }, 'View Original'),
          currentResource.citation_count !== undefined && h('p', { class: 'resource-citations' }, '📖 ', currentResource.citation_count, ' citations')
        ])
      ])
    ])
  ]);
}

export default LibraryView;