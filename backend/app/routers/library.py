"""
Scientific Research Library endpoints.
Integrates NASA NTRS, PDS, OpenAlex, Zenodo, ADS, arXiv.
"""

import asyncio
import re
from datetime import date, datetime
from typing import Annotated, Optional
from urllib.parse import quote

from fastapi import APIRouter, HTTPException, Query, Depends
import httpx

from app.dependencies import validate_latitude, validate_longitude
from app.schemas.library import (
    ResearchResource,
    LibrarySearchResponse,
    ResourceDetailResponse,
    LibraryStatsResponse,
)

router = APIRouter(prefix="/library", tags=["library"])

# HTTP client for external APIs
http_client = httpx.AsyncClient(timeout=30.0, follow_redirects=True)

# Category mapping
CATEGORIES = [
    "planetary_science",
    "human_spaceflight",
    "life_support",
    "isru",
    "habitat_engineering",
    "radiation_protection",
    "mars_geology",
    "mars_climate",
    "mars_water",
    "mars_atmosphere",
    "mission_planning",
    "robotics",
    "astrobiology",
    "planetary_protection",
]

SOURCES = ["NTRS", "PDS", "OpenAlex", "Zenodo", "ADS", "arXiv", "NASA_MISSION"]


async def search_ntrs(query: str, limit: int = 10) -> list[ResearchResource]:
    """Search NASA Technical Reports Server."""
    try:
        url = "https://ntrs.nasa.gov/api/citations/search"
        params = {
            "q": query,
            "rows": limit,
            "fl": "id,title,author,publication_date,center,doi,abstract",
        }
        resp = await http_client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

        resources = []
        for item in data.get("results", []):
            resources.append(
                ResearchResource(
                    id=f"NTRS:{item.get('id', '')}",
                    title=item.get("title", ""),
                    authors=item.get("author", "").split("; ")
                    if item.get("author")
                    else [],
                    institution=item.get("center", ""),
                    publication_date=parse_date(item.get("publication_date", "")),
                    category="planetary_science",
                    abstract=item.get("abstract", "")[:500]
                    if item.get("abstract")
                    else None,
                    source="NTRS",
                    doi=item.get("doi"),
                    url=f"https://ntrs.nasa.gov/citations/{item.get('id', '')}",
                    tags=extract_tags(
                        item.get("title", "") + " " + (item.get("abstract", "") or "")
                    ),
                )
            )
        return resources
    except Exception as e:
        print(f"NTRS search error: {e}")
        return []


async def search_openalex(query: str, limit: int = 10) -> list[ResearchResource]:
    """Search OpenAlex for scientific publications."""
    try:
        url = "https://api.openalex.org/works"
        params = {
            "filter": f"title.search:{query}",
            "per_page": limit,
            "select": "id,title,authorships,publication_date,doi,abstract_inverted_index,primary_location,concepts",
        }
        resp = await http_client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

        resources = []
        for item in data.get("results", []):
            authors = [a["author"]["display_name"] for a in item.get("authorships", [])]
            abstract = reconstruct_abstract(item.get("abstract_inverted_index", {}))

            resources.append(
                ResearchResource(
                    id=f"OPENALEX:{item.get('id', '')}",
                    title=item.get("title", ""),
                    authors=authors[:5],
                    institution=item.get("primary_location", {})
                    .get("source", {})
                    .get("display_name"),
                    publication_date=parse_date(item.get("publication_date", "")),
                    category=classify_category(item.get("concepts", [])),
                    abstract=abstract[:500] if abstract else None,
                    source="OpenAlex",
                    doi=item.get("doi"),
                    url=item.get("doi") or item.get("id"),
                    tags=extract_tags(item.get("title", "") + " " + (abstract or "")),
                    citation_count=item.get("cited_by_count"),
                )
            )
        return resources
    except Exception as e:
        print(f"OpenAlex search error: {e}")
        return []


async def search_zenodo(query: str, limit: int = 10) -> list[ResearchResource]:
    """Search Zenodo for datasets and software."""
    try:
        url = "https://zenodo.org/api/records"
        params = {"q": query, "size": limit, "all_versions": "false"}
        resp = await http_client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

        resources = []
        for item in data.get("hits", {}).get("hits", []):
            meta = item.get("metadata", {})
            resources.append(
                ResearchResource(
                    id=f"ZENODO:{item.get('id', '')}",
                    title=meta.get("title", ""),
                    authors=[c.get("name", "") for c in meta.get("creators", [])],
                    publication_date=parse_date(meta.get("publication_date", "")),
                    category="dataset"
                    if meta.get("resource_type", {}).get("type") == "dataset"
                    else "software",
                    abstract=meta.get("description", "")[:500]
                    if meta.get("description")
                    else None,
                    source="Zenodo",
                    doi=meta.get("doi"),
                    url=meta.get("doi")
                    or f"https://zenodo.org/record/{item.get('id')}",
                    tags=[k for k in meta.get("keywords", [])],
                    access_type="open",
                )
            )
        return resources
    except Exception as e:
        print(f"Zenodo search error: {e}")
        return []


async def search_pds(query: str, limit: int = 10) -> list[ResearchResource]:
    """Search NASA PDS for datasets."""
    # PDS doesn't have a simple search API, but we can use the catalog
    # This is a placeholder - in production use PDS API
    return []


def parse_date(date_str: str) -> Optional[date]:
    """Parse various date formats."""
    if not date_str:
        return None
    for fmt in [
        "%Y-%m-%d",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y/%m/%d",
        "%B %d, %Y",
    ]:
        try:
            return datetime.strptime(date_str[:19], fmt).date()
        except ValueError:
            continue
    return None


def parse_datetime(date_str: str) -> Optional[datetime]:
    if not date_str:
        return None
    for fmt in ["%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S.%fZ"]:
        try:
            return datetime.strptime(date_str[:26], fmt)
        except ValueError:
            continue
    return None


def extract_tags(text: str) -> List[str]:
    """Extract relevant tags from text."""
    mars_terms = [
        "mars",
        "martian",
        "meridiani",
        "gale",
        "jezero",
        "olympus",
        "tharsis",
        "valles",
        "hellas",
        "argyre",
        "isis",
        "elysium",
        "amazonia",
        "crater",
        "volcano",
        "dune",
        "river",
        "channel",
        "valley",
        "water",
        "ice",
        "hydrated",
        "mineral",
        "sulfate",
        "clay",
        "radiation",
        "dust",
        "storm",
        "atmosphere",
        "climate",
        "habitat",
        "isru",
        "life_support",
        "radiation",
        "shielding",
        "rover",
        "curiosity",
        "perseverance",
        "insight",
        "mro",
        "mgs",
        "odyssey",
        "express",
        "trace_gas",
        "exomars",
        "sample_return",
    ]
    text_lower = text.lower()
    found = [term for term in mars_terms if term in text_lower]
    return found[:10]


def reconstruct_abstract(inverted_index: dict) -> str:
    """Reconstruct abstract from OpenAlex inverted index."""
    if not inverted_index:
        return ""
    words = [""] * max(
        max(pos) for pos_list in inverted_index.values() for pos in pos_list
    ) + 1
    for word, positions in inverted_index.items():
        for pos in positions:
            if pos < len(words):
                words[pos] = word
    return " ".join(w for w in words if w)


def classify_category(concepts: List[dict]) -> str:
    """Classify paper category from OpenAlex concepts."""
    if not concepts:
        return "planetary_science"

    concept_names = [c.get("display_name", "").lower() for c in concepts[:5]]

    if any("life support" in c or "habitat" in c or "isru" in c for c in concepts):
        return "life_support"
    if any("human" in c and "spaceflight" in c for c in concepts):
        return "human_spaceflight"
    if any("radiation" in c or "shielding" in c for c in concepts):
        return "radiation_protection"
    if any("isru" in c or "in-situ" in c for c in concepts):
        return "isru"
    if any("habitat" in c for c in concepts):
        return "habitat_engineering"
    if any("mars" in c for c in concepts):
        return "planetary_science"
    if any("rover" in c or "lander" in c for c in concepts):
        return "robotics"
    if any("astrobiology" in c or "life" in c for c in concepts):
        return "astrobiology"

    return "planetary_science"


@router.get("/search", response_model=LibrarySearchResponse)
async def search_library(
    q: Annotated[str, Query(..., min_length=2, description="Search query")],
    category: Optional[str] = Query(None, description="Filter by category"),
    source: Optional[str] = Query(
        None, description="Filter by source: NTRS, OpenAlex, Zenodo, PDS"
    ),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Search scientific literature and datasets."""
    all_results = []

    # Search multiple sources in parallel
    tasks = []
    limit_per_source = max(5, 20 // 3)

    tasks.append(search_ntrs(q, limit_per_source))
    tasks.append(search_openalex(q, limit_per_source))
    tasks.append(search_zenodo(q, limit_per_source))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    for result in results:
        if isinstance(result, list):
            all_results.extend(result)
        elif isinstance(result, Exception):
            print(f"Search error: {result}")

    # Filter by category
    if category:
        all_results = [r for r in all_results if r.category == category]

    # Filter by source
    if source:
        all_results = [r for r in all_results if r.source == source]

    # Sort by relevance (citation count, date)
    all_results.sort(
        key=lambda x: (x.citation_count or 0, x.publication_date or date.min),
        reverse=True,
    )

    # Pagination
    total = len(all_results)
    start = (page - 1) * page_size
    end = start + page_size

    return LibrarySearchResponse(
        resources=all_results[start:end],
        total=total,
        page=page,
        page_size=page_size,
        query=q,
        categories=CATEGORIES,
        sources=SOURCES,
    )


@router.get("/{resource_id}", response_model=ResourceDetailResponse)
async def get_resource(resource_id: str):
    """Get detailed information about a specific resource."""
    # In production, query the source API by ID
    # For now, return mock detail
    raise HTTPException(
        status_code=404, detail="Resource not found. Use search to find resources."
    )


@router.get("/stats", response_model=LibraryStatsResponse)
async def get_library_stats():
    """Get library statistics."""
    # In production, query aggregated stats from database
    return LibraryStatsResponse(
        total_resources=0,
        by_category={cat: 0 for cat in CATEGORIES},
        by_source={src: 0 for src in SOURCES},
        by_year={},
        top_tags=[],
    )


@router.get("/categories", response_model=List[str])
async def get_categories():
    """Get available categories."""
    return CATEGORIES


@router.get("/sources", response_model=List[str])
async def get_sources():
    """Get available sources."""
    return SOURCES
