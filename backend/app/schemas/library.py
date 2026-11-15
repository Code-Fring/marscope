"""
Pydantic schemas for scientific research library endpoints.
"""

from datetime import date
from pydantic import BaseModel, Field
from typing import Optional, List


class ResearchResource(BaseModel):
    id: str
    title: str
    authors: List[str] = Field(default_factory=list)
    institution: Optional[str] = None
    publication_date: Optional[date] = None
    category: str = Field(
        ...,
        description="Category: planetary_science, human_spaceflight, life_support, etc.",
    )
    abstract: Optional[str] = None
    source: str = Field(
        ..., description="Source: NTRS, PDS, OpenAlex, Zenodo, ADS, arXiv, etc."
    )
    doi: Optional[str] = None
    dataset_id: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    url: Optional[str] = None
    access_type: str = Field(
        default="open", description="open, restricted, public_domain"
    )
    citation_count: Optional[int] = None


class LibrarySearchResponse(BaseModel):
    resources: List[ResearchResource]
    total: int
    page: int
    page_size: int
    query: str
    categories: List[str]
    sources: List[str]


class ResourceDetailResponse(BaseModel):
    resource: ResearchResource
    related: List[ResearchResource] = Field(default_factory=list)
    citations: List[ResearchResource] = Field(default_factory=list)
    references: List[ResearchResource] = Field(default_factory=list)


class LibraryStatsResponse(BaseModel):
    total_resources: int
    by_category: Dict[str, int]
    by_source: Dict[str, int]
    by_year: Dict[str, int]
    top_tags: List[Dict[str, Any]]
