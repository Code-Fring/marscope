/**
 * Mars physical constants - Single source of truth for all coordinate/elevation calculations.
 * Derived from MOLA product page and IAU 2000 standards.
 * @see https://astrogeology.usgs.gov/search/map/mars_mgs_mola_dem_463m
 */

export const MARS = {
  /** Mean radius in metres (IAU 2000, MOLA product page) */
  RADIUS_M: 3_396_190,

  /** MOLA DEM resolution at equator in metres/pixel */
  MOLA_RESOLUTION_MPP: 463.0835744,

  /** MOLA DEM grid dimensions in pixels */
  MOLA_WIDTH_PX: 46_080,
  MOLA_HEIGHT_PX: 23_040,

  /** Stated vertical accuracy of MOLA DEM in metres (±3 m = areoid ±1.8m + regional) */
  VERTICAL_ACCURACY_M: 3,

  /** Stated horizontal accuracy in metres (~100 m) */
  HORIZONTAL_ACCURACY_M: 100,

  /** Maximum latitude for azimuthal equidistant projection (source grids are equirectangular) */
  MAX_ABS_LAT: 80,

  /** Maximum corner angle in radians for local projections (~2% scale error) */
  MAX_CORNER_ANGLE: 0.35,
} as const;

/**
 * MOLA DEM source metadata for attribution
 */
export const MOLA_METADATA = {
  name: 'MGS MOLA DEM 463m',
  instrument: 'Mars Orbiter Laser Altimeter (MOLA)',
  mission: 'Mars Global Surveyor (MGS)',
  team: 'MOLA Team',
  originator: 'NASA Goddard Space Flight Center',
  publisher: 'USGS Astrogeology Science Center',
  edition: '2003-03-21',
  accessConstraints: 'CC0 (public domain)',
  useConstraints: 'None',
  citation: 'MOLA Team (2003), Mars MGS MOLA DEM 463m, USGS Astrogeology Science Center. Smith, D. E., et al. (2001), J. Geophys. Res., 106(E10), 23689-23722.',
  downloadUrl: 'https://planetarymaps.usgs.gov/mosaic/Mars_MGS_MOLA_DEM_mosaic_global_463m.tif',
  productPage: 'https://astrogeology.usgs.gov/search/map/mars_mgs_mola_dem_463m',
  coordinateSystem: 'Simple Cylindrical, Planetocentric, +East 0-360',
  datum: 'Sphere, radius 3,396,190 m (IAU 2000)',
  verticalDatum: 'Areoid (GMM-2B gravity field, degree/order 50)',
} as const;

/**
 * IAU Gazetteer source metadata for attribution
 */
export const IAU_METADATA = {
  name: 'Gazetteer of Planetary Nomenclature',
  maintainer: 'USGS Astrogeology Science Center',
  authority: 'International Astronomical Union (IAU) Working Group for Planetary System Nomenclature',
  support: 'NASA under Interagency Agreement',
  url: 'https://planetarynames.wr.usgs.gov/',
  license: 'Public Domain (US Government work)',
} as const;