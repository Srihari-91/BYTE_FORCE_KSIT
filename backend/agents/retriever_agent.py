from __future__ import annotations

import re
from typing import Any, Dict, List

import httpx
import xmltodict

from backend.agents.base import BaseAgent
from backend.config.settings import settings
from backend.models.schemas import Paper
from backend.utils.openalex_client import fetch_openalex_works
from backend.utils.paper_normalization import normalize_and_dedupe_papers
from backend.utils.retrieval_cache import get_cached_papers, set_cached_papers


def _s2_authors(item: Dict[str, Any]) -> List[str]:
    out: List[str] = []
    for a in (item.get("authors") or [])[:40]:
        if isinstance(a, dict) and a.get("name"):
            out.append(str(a["name"])[:200])
    return out


class RetrieverAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Information Scout",
            goal="Retrieve relevant academic papers and data for the research query.",
            backstory="Expert in navigating arXiv, Semantic Scholar, and OpenAlex.",
        )

    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        query = input_data.get("query", "")
        limit = int(input_data.get("paper_limit") or 18)

        cached = get_cached_papers(query)
        if cached is not None:
            return {
                "papers": cached,
                "papers_count": len(cached),
                "retrieval_note": "Served from retrieval cache (TTL) — real metadata only.",
                "normalization": {"cached": True},
            }

        s2 = await self._fetch_semantic_scholar(query=query, limit=limit)
        arx = await self._fetch_arxiv(query=query, limit=max(4, limit // 2))
        oa = await fetch_openalex_works(query=query, limit=max(4, limit // 2))
        web = await self._fetch_web_results(query=query, limit=max(3, limit // 2))

        merged: List[Paper] = s2 + arx + oa + web
        merged_d: List[Dict[str, Any]] = [p.model_dump() for p in merged if p and p.title]
        norm, stat = normalize_and_dedupe_papers(merged_d)
        set_cached_papers(query, norm)

        return {
            "papers": norm,
            "papers_count": len(norm),
            "retrieval_note": "Merged arXiv + Semantic Scholar + OpenAlex (+ optional web) — normalized, deduplicated, no LLM text.",
            "normalization": stat,
        }

    async def _fetch_semantic_scholar(self, query: str, limit: int) -> List[Paper]:
        if not query.strip():
            return []
        url = "https://api.semanticscholar.org/graph/v1/paper/search"
        params = {
            "query": query,
            "limit": min(max(limit, 1), 25),
            "fields": (
                "title,abstract,year,venue,url,openAccessPdf,paperId,citationCount,"
                "influentialCitationCount,isInfluential,authors,externalIds"
            ),
        }
        headers: Dict[str, str] = {}
        api_key = getattr(settings, "SEMANTIC_SCHOLAR_API_KEY", "") or ""
        if api_key:
            headers["x-api-key"] = api_key
        async with httpx.AsyncClient(timeout=25.0) as client:
            r = await client.get(url, params=params, headers=headers)
            if r.status_code != 200:
                return []
            data = r.json() or {}
        out: List[Paper] = []
        for item in data.get("data") or []:
            title = (item.get("title") or "").strip()
            abstract = (item.get("abstract") or "").strip()
            year = item.get("year")
            venue = (item.get("venue") or "").strip() or None
            link = (item.get("url") or "").strip() or None
            if not link and item.get("openAccessPdf") and item["openAccessPdf"].get("url"):
                link = item["openAccessPdf"]["url"]
            pid = (item.get("paperId") or "").strip() or None
            authors = _s2_authors(item)
            if not title or not abstract or len(abstract) < 10:
                continue
            citations = item.get("citationCount")
            influential = item.get("influentialCitationCount")
            is_infl = item.get("isInfluential")
            out.append(
                Paper(
                    title=title,
                    abstract=abstract,
                    year=year if isinstance(year, int) else None,
                    authors=authors,
                    source=f"Semantic Scholar{f' ({venue})' if venue else ''}",
                    url=link,
                    paper_id=f"S2:{pid}" if pid else "S2:unknown",
                    citations=citations if isinstance(citations, int) else None,
                    influential_citations=influential if isinstance(influential, int) else None,
                    is_influential=is_infl if isinstance(is_infl, bool) else None,
                    verified=True,
                    source_type="journal_or_conference" if venue else "other",
                )
            )
        return out

    async def _fetch_web_results(self, query: str, limit: int) -> List[Paper]:
        api_key = getattr(settings, "SERPAPI_API_KEY", "") or ""
        if not api_key or not query.strip():
            return []
        url = "https://serpapi.com/search.json"
        params = {
            "engine": "google_scholar",
            "q": query,
            "api_key": api_key,
            "num": min(max(limit, 1), 20),
        }
        async with httpx.AsyncClient(timeout=25.0) as client:
            r = await client.get(url, params=params)
            if r.status_code != 200:
                return []
            data = r.json() or {}
        out: List[Paper] = []
        for item in data.get("organic_results") or []:
            title = (item.get("title") or "").strip()
            snippet = (item.get("snippet") or "").strip()
            link = (item.get("link") or "").strip() or None
            year = item.get("publication_info", {}).get("year")
            cits = item.get("inline_links", {}).get("cited_by", {}).get("total")
            if not title or not snippet or len(snippet) < 10:
                continue
            try:
                citations = int(cits) if cits is not None else None
            except (TypeError, ValueError):
                citations = None
            out.append(
                Paper(
                    title=title,
                    abstract=snippet,
                    year=year if isinstance(year, int) else None,
                    authors=[],
                    source="Web (Google Scholar via SerpAPI)",
                    url=link,
                    paper_id=None,
                    citations=citations,
                    source_type="web",
                    verified=True,
                )
            )
        return out

    async def _fetch_arxiv(self, query: str, limit: int) -> List[Paper]:
        if not (query or "").strip():
            return []
        q = query.replace('"', "")
        api = "http://export.arxiv.org/api/query"
        params = {
            "search_query": f"all:{q}",
            "start": 0,
            "max_results": min(max(limit, 1), 20),
            "sortBy": "relevance",
            "sortOrder": "descending",
        }
        async with httpx.AsyncClient(timeout=22.0) as client:
            r = await client.get(api, params=params)
            if r.status_code != 200:
                return []
            text = r.text
        parsed = xmltodict.parse(text) or {}
        feed = parsed.get("feed") or {}
        entries = feed.get("entry") or []
        if isinstance(entries, dict):
            entries = [entries]
        out: List[Paper] = []
        for e in entries:
            title = (e.get("title") or "").replace("\n", " ").strip()
            abstract = (e.get("summary") or "").replace("\n", " ").strip()
            published = (e.get("published") or "").strip()
            year = int(published[:4]) if published[:4].isdigit() else None
            url = None
            links = e.get("link") or []
            if isinstance(links, dict):
                links = [links]
            for link in links:
                if link.get("@type") == "application/pdf" and link.get("@href"):
                    url = link["@href"]
                    break
            if not url and isinstance(e.get("id"), str):
                url = e.get("id")
            arxiv_id = None
            if isinstance(e.get("id"), str):
                m = re.search(r"arxiv\.org/abs/([^/]+)$", e["id"])
                if m:
                    arxiv_id = m.group(1)
            if not title or not abstract or len(abstract) < 10:
                continue
            authors: List[str] = []
            auth = e.get("author")
            if isinstance(auth, list):
                for a in auth:
                    if isinstance(a, dict) and a.get("name"):
                        authors.append(str(a["name"])[:200])
            elif isinstance(auth, dict) and auth.get("name"):
                authors.append(str(auth["name"])[:200])
            out.append(
                Paper(
                    title=title,
                    abstract=abstract,
                    year=year,
                    authors=authors,
                    source="arXiv",
                    url=url,
                    paper_id=f"ARXIV:{arxiv_id}" if arxiv_id else "ARXIV:unknown",
                    citations=None,
                    verified=False,
                    source_type="preprint",
                )
            )
        return out
