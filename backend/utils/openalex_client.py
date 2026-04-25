from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

import httpx

from backend.models.schemas import Paper


def _reconstruct_abstract(inv: Any) -> str:
    """
    OpenAlex stores abstract as inverted index: {word: [positions]}
    """
    if not inv or not isinstance(inv, dict):
        return ""
    positions: List[tuple[int, str]] = []
    for word, idxs in inv.items():
        if not isinstance(idxs, list):
            continue
        for i in idxs:
            if isinstance(i, int):
                positions.append((i, str(word)))
    if not positions:
        return ""
    positions.sort(key=lambda x: x[0])
    return " ".join(w for _, w in positions).strip()


async def fetch_openalex_works(query: str, limit: int = 12) -> List[Paper]:
    if not (query or "").strip():
        return []
    q = query.strip()[:500]
    url = "https://api.openalex.org/works"
    params = {
        "search": q,
        "per_page": min(max(limit, 1), 25),
        "select": "id,title,publication_year,authorships,abstract_inverted_index,doi,"
        "primary_location,cited_by_count,open_access",
    }
    try:
        async with httpx.AsyncClient(timeout=22.0) as client:
            r = await client.get(url, params=params)
            if r.status_code != 200:
                return []
            data = r.json() or {}
    except Exception:
        return []

    out: List[Paper] = []
    for item in (data.get("results") or []):
        title = (item.get("title") or "").strip()
        if not title:
            continue
        ab = _reconstruct_abstract(item.get("abstract_inverted_index"))
        if not ab or len(ab) < 30:
            continue
        year = item.get("publication_year")
        y = int(year) if isinstance(year, int) else None
        cit = item.get("cited_by_count")
        try:
            citations = int(cit) if cit is not None else None
        except Exception:
            citations = None
        doi = (item.get("doi") or "").replace("https://doi.org/", "") or None
        oa = (item.get("open_access") or {}) if isinstance(item.get("open_access"), dict) else {}
        oa_url = oa.get("oa_url")
        pl = item.get("primary_location") or {}
        landing = (pl.get("landing_page_url") or pl.get("pdf_url") or oa_url or None) if isinstance(pl, dict) else oa_url
        wid = (item.get("id") or "").rsplit("/", 1)[-1] if item.get("id") else None
        authors: List[str] = []
        for a in (item.get("authorships") or [])[:30]:
            auth = a.get("author") or {}
            if isinstance(auth, dict) and auth.get("display_name"):
                authors.append(str(auth["display_name"]))

        out.append(
            Paper(
                title=title,
                abstract=ab,
                year=y,
                authors=authors,
                source="OpenAlex",
                url=landing,
                paper_id=f"W:{wid}" if wid else "W:openalex",
                citations=citations,
                verified=bool(doi),
                source_type="journal" if (pl and isinstance(pl, dict) and pl.get("source")) else "other",
                doi=doi,
            )
        )
    return out
