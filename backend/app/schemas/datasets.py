"""
Pydantic schemas for dataset catalog endpoints.
"""

from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class DatasetMetadata(BaseModel):
    id: str
    name: str
    description: str
    source: str
    mission: str
    instrument: str
    resolution: str
    coverage: str
    format: str
    projection: str
    coordinate_system: str
    vertical_datum: str
    license: str
    access_url: str
    citation: str
    last_updated: datetime
    spatial_resolution_m: float
    temporal_coverage: str
    uncertainties: Dict[str, Any] = Field(default_factory=dict)
    is_integrated: bool = False
    access_method: str  # "COG", "WMS", "WMTS", "API", "download"
    tags: List[str] = Field(default_factory=list)


class DatasetListResponse(BaseModel):
    datasets: List[DatasetMetadata]
    total: int
    integrated_count: int
    investigated_count: int
