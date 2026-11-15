"""
MARSCOPE Backend Configuration
Settings via pydantic-settings with environment variable support.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # App
    app_name: str = "MARSCOPE Backend"
    app_version: str = "0.2.0"
    debug: bool = False

    # MOLA DEM
    mola_cog_path: str = "/data/Mars_MGS_MOLA_DEM_mosaic_global_463m_cog.tif"
    mars_radius_m: int = 3_396_190

    # External APIs
    nasa_api_key: Optional[str] = None
    pds_base_url: str = "https://pds-geosciences.wustl.edu"
    usgs_base_url: str = "https://planetarymaps.usgs.gov"
    iau_base_url: str = "https://planetarynames.wr.usgs.gov"

    # Climate data APIs
    mars_weather_base_url: str = "https://api.nasa.gov"
    rems_base_url: str = "https://mars.nasa.gov/rss/api/?feed=weather"
    meda_base_url: str = "https://mars.nasa.gov/mars2020/"

    # Rate limiting
    external_api_timeout: int = 30
    external_api_max_retries: int = 3
    external_api_backoff_factor: float = 0.5

    # Caching
    cache_ttl_seconds: int = 3600
    tile_cache_ttl_seconds: int = 86400

    # CORS
    allowed_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    allowed_methods: list[str] = ["GET", "POST", "OPTIONS"]
    allowed_headers: list[str] = ["*"]
    allow_credentials: bool = True


settings = Settings()
