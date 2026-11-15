"""
Scientific Research Library View for MARSCOPE.
"""

import { render, h } from 'preact';
import { libraryState, searchLibrary, fetchResource, fetchStats, fetchCategories, fetchSources, clearLibraryData, setSearchQuery, setCategory, setSource, setPage, setPageSize, filteredResources, libraryHasResults, libraryIsEmpty } from '@/stores/libraryStore';

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
    // await fetchResource(resourceId);
  };

  return (
    <div class="library-view">
      <div class="view-header">
        <h2>Scientific Research Library</h2>
        <p class="view-description">Search NASA technical reports, scientific publications, and planetary datasets</p>
      </div>

      <div class="library-toolbar">
        <div class="search-bar">
          <input 
            type="text" 
            placeholder="Search NASA NTRS, OpenAlex, Zenodo, PDS..." 
            value={/* searchQuery */}
            onChange={(e) => { /* handleSearch(e.target.value) */ }}
            class="search-input"
          />
          <button class="btn-primary" disabled={/* loading */}>Search</button>
        </div>

        <div class="filters">
          <select 
            value={/* selectedCategory */} 
            onChange={(e) => { /* handleCategoryChange(e.target.value) */ }}
          >
            <option value="">All Categories</option>
            <option value="planetary_science">Planetary Science</option>
            <option value="human_spaceflight">Human Spaceflight</option>
            <option value="life_support">Life Support</option>
            <option value="isru">ISRU</option>
            <option value="habitat_engineering">Habitat Engineering</option>
            <option value="radiation_protection">Radiation Protection</option>
            <option value="mars_geology">Mars Geology</option>
            <option value="mars_climate">Mars Climate</option>
            <option value="mars_water">Mars Water</option>
            <option value="mars_atmosphere">Mars Atmosphere</option>
            <option value="mission_planning">Mission Planning</option>
            <option value="robotics">Robotics</option>
            <option value="astrobiology">Astrobiology</option>
            <option value="planetary_protection">Planetary Protection</option>
          </select>

          <select 
            value={/* selectedSource */} 
            onChange={(e) => { /* handleSourceChange(e.target.value) */ }}
          >
            <option value="">All Sources</option>
            <option value="NTRS">NASA NTRS</option>
            <option value="OpenAlex">OpenAlex</option>
            <option value="Zenodo">Zenodo</option>
            <option value="PDS">NASA PDS</option>
            <option value="ADS">ADS</option>
            <option value="arXiv">arXiv</option>
          </select>
        </div>
      </div>

      {error && <div class="error-banner">{error}</div>}
      {loading && <div class="loading-indicator">Searching...</div>}

      <div class="library-results">
        {libraryIsEmpty && (
          <div class="no-results">
            <h3>No results found</h3>
            <p>Try different search terms or adjust your filters</p>
          </div>
        )}

        {libraryHasResults && (
          <div class="results-header">
            <p>{/* totalResults */} results for "{/* searchQuery */}"</p>
            <span>Page {/* currentPage */} of {Math.ceil(/* totalResults */ / /* pageSize */)}</span>
          </div>}

          <div class="results-grid">
            {/* resources?.map(resource => (
              <article key={resource.id} class="resource-card" onClick={() => { /* handleResourceClick(resource.id) */ }}>
                <div class="resource-header">
                  <span class="resource-source">{resource.source}</span>
                  <span class="resource-category">{resource.category}</span>
                </div>
                <h3 class="resource-title">{resource.title}</h3>
                <p class="resource-authors">{resource.authors?.slice(0, 3).join(', ')}{resource.authors?.length > 3 ? ' et al.' : ''}</p>
                <p class="resource-meta">
                  {resource.publication_date && `Published: ${resource.publication_date}`} • 
                  {resource.source} • 
                  {resource.doi && `DOI: ${resource.doi}`}
                </p>
                <p class="resource-abstract">{resource.abstract?.substring(0, 200)}...</p>
                <div class="resource-tags">
                  {resource.tags?.slice(0, 5).map(tag => (
                    <span key={tag} class="tag">{tag}</span>
                  ))}
                </div>
                {resource.citation_count !== undefined && (
                  <div class="resource-citations">📖 {resource.citation_count} citations</div>
                )}
              </article>
            )) */}
          </div>

          {state.totalResults > 0 && (
            <div class="pagination">
              <button 
                class="btn-secondary" 
                disabled={/* currentPage <= 1 */}
                onClick={() => { /* setPage(currentPage - 1) */ }}
              >
                Previous
              </button>
              <span>Page {/* currentPage */} of {Math.ceil(/* totalResults */ / /* pageSize */)}</span>
              <button 
                class="btn-secondary" 
                disabled={/* currentPage * pageSize >= totalResults */}
                onClick={() => { /* setPage(currentPage + 1) */ }}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Resource Detail Modal */}
        {/* {state.currentResource && (
          <div class="modal-overlay" onClick={() => { /* setCurrentResource(null) */ }}>
            <div class="modal-content" onClick={(e) => e.stopPropagation()}>
              <button class="modal-close" onClick={() => { /* setCurrentResource(null) */ }}>×</button>
              <div class="resource-detail">
                <div class="resource-meta">
                  <span class="resource-source">{/* state.currentResource.source */}</span>
                  <span class="resource-category">{/* state.currentResource.category */}</span>
                </div>
                <h2>{/* state.currentResource.title */}</h2>
                <p class="resource-authors">{/* state.currentResource.authors?.join(', ') */}</p>
                <p class="resource-meta">
                  {state.currentResource.institution && `Institution: ${state.currentResource.institution}`} • 
                  {state.currentResource.publication_date && `Published: ${state.currentResource.publication_date}`} • 
                  {state.currentResource.doi && `DOI: ${state.currentResource.doi}`}
                </p>
                <p class="resource-abstract">{/* state.currentResource.abstract */}</p>
                <div class="resource-tags">
                  {state.currentResource.tags?.map(tag => (
                    <span key={tag} class="tag">{tag}</span>
                  ))}
                </div>
                {state.currentResource.url && (
                  <a href={state.currentResource.url} target="_blank" rel="noopener" class="btn-primary">
                    View Original
                  </a>
                )}
                {state.currentResource.citation_count !== undefined && (
                  <p class="resource-citations">📖 {/* state.currentResource.citation_count */} citations</p>
                )}
              </div>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}

export default LibraryView;