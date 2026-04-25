from __future__ import annotations

from backend.agents.base import BaseAgent
from backend.config.settings import settings
from typing import Any, Dict, List
import httpx
import re
import asyncio

class VerifierAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Verifier",
            goal="Enrich and verify paper metadata using CrossRef/Semantic Scholar signals.",
            backstory="Expert in bibliographic verification and metadata normalization."
        )

    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        papers: List[Dict[str, Any]] = input_data.get("papers") or []
        if not papers:
            return {"papers": [], "verification_summary": {"verified_count": 0, "doi_enriched": 0}}

        enriched = await self._enrich_with_crossref(papers)
        verified_count = sum(1 for p in enriched if p.get("doi") or p.get("verified") is True)
        doi_enriched = sum(1 for p in enriched if p.get("doi"))

        return {
            "papers": enriched,
            "verification_summary": {
                "verified_count": verified_count,
                "doi_enriched": doi_enriched,
                "note": "CrossRef title matching is best-effort; verify ≠ correctness."
            }
        }

    async def _enrich_with_crossref(self, papers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        For each paper, attempt to find DOI via CrossRef works?query.title=...
        We keep it conservative: only accept DOI if title similarity looks strong.
        """
        mailto = (getattr(settings, "CROSSREF_MAILTO", "") or "").strip()
        headers = {"User-Agent": f"ai-research-war-room/1.0 (mailto:{mailto})"} if mailto else {"User-Agent": "ai-research-war-room/1.0"}

        async with httpx.AsyncClient(timeout=20.0, headers=headers) as client:
            tasks = [self._crossref_lookup_one(client, p) for p in papers]
            # parallelize safely
            return list(await asyncio.gather(*tasks))

    async def _crossref_lookup_one(self, client: httpx.AsyncClient, paper: Dict[str, Any]) -> Dict[str, Any]:
        title = (paper.get("title") or "").strip()
        if not title or paper.get("doi"):
            return paper

        url = "https://api.crossref.org/works"
        params = {"query.title": title, "rows": 3, "select": "DOI,title,type,issued,container-title"}
        try:
            r = await client.get(url, params=params)
            if r.status_code != 200:
                return paper
            data = r.json() or {}
        except Exception:
            return paper

        items = (((data.get("message") or {}).get("items")) or [])
        best = None
        best_score = 0.0
        for it in items:
            cand_titles = it.get("title") or []
            cand_title = cand_titles[0] if cand_titles else ""
            score = self._title_similarity(title, cand_title)
            if score > best_score:
                best_score = score
                best = it

        # Conservative threshold
        if not best or best_score < 0.85:
            return paper

        doi = best.get("DOI")
        if not doi:
            return paper

        paper = {**paper}
        paper["doi"] = doi
        paper["verified"] = True
        # Improve source_type if CrossRef says journal-article / proceedings-article, etc.
        cr_type = (best.get("type") or "").lower()
        if "journal" in cr_type:
            paper["source_type"] = "journal"
        elif "proceedings" in cr_type or "conference" in cr_type:
            paper["source_type"] = "conference"
        return paper

    def _title_similarity(self, a: str, b: str) -> float:
        a_t = self._norm(a)
        b_t = self._norm(b)
        if not a_t or not b_t:
            return 0.0
        # token overlap Jaccard as a robust low-cost similarity
        a_set = set(a_t.split())
        b_set = set(b_t.split())
        inter = len(a_set.intersection(b_set))
        union = max(1, len(a_set.union(b_set)))
        return inter / union

    def _norm(self, s: str) -> str:
        s = (s or "").lower()
        s = re.sub(r"[^a-z0-9\\s]", " ", s)
        s = re.sub(r"\\s+", " ", s).strip()
        return s
