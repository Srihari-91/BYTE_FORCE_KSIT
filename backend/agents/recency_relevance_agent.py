from backend.agents.base import BaseAgent
from typing import Any, Dict, List
from datetime import datetime
import re


class RecencyRelevanceAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Recency & Relevance Specialist",
            goal="Score papers for recency and relevance to the query.",
            backstory="Expert in bibliometrics and pragmatic relevance scoring."
        )

    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        query = (input_data.get("query") or "").strip()
        papers: List[Dict[str, Any]] = input_data.get("papers") or []

        scored = []
        for idx, p in enumerate(papers, start=1):
            year = p.get("year")
            recency = self._recency_score(year)
            relevance = self._relevance_score(query, p.get("title") or "", p.get("abstract") or "")
            verdict = self._verdict(recency)
            scored.append({
                **p,
                "index": idx,
                "recency_score": recency,
                "relevance_score": relevance,
                "verdict": verdict
            })

        # Sort by relevance desc, then recency desc
        top = sorted(scored, key=lambda x: (x["relevance_score"], x["recency_score"]), reverse=True)
        return {
            "scored_papers": scored,
            "top_papers": top[:5]
        }

    def _recency_score(self, year: Any) -> int:
        now = datetime.utcnow().year
        if not isinstance(year, int) or year <= 0:
            return 3
        age = max(0, now - year)
        # 0y→10, 1y→9 ... 7y→3, older→1-2
        if age <= 0:
            return 10
        if age <= 1:
            return 9
        if age <= 2:
            return 8
        if age <= 3:
            return 7
        if age <= 4:
            return 6
        if age <= 5:
            return 5
        if age <= 7:
            return 3
        if age <= 10:
            return 2
        return 1

    def _relevance_score(self, query: str, title: str, abstract: str) -> int:
        if not query:
            return 5
        q = self._tokens(query)
        if not q:
            return 5
        text = f"{title} {abstract}"
        t = self._tokens(text)
        overlap = len(q.intersection(t))
        # Map overlap to 1..10 with soft cap
        if overlap <= 0:
            return 2
        if overlap == 1:
            return 4
        if overlap == 2:
            return 6
        if overlap <= 4:
            return 8
        return 10

    def _tokens(self, s: str) -> set[str]:
        s = s.lower()
        s = re.sub(r"[^a-z0-9\\s]", " ", s)
        parts = [p for p in s.split() if len(p) >= 3]
        stop = {
            "the", "and", "for", "with", "from", "that", "this", "into", "over", "under",
            "using", "use", "based", "approach", "method", "methods", "study", "paper",
            "system", "systems", "model", "models", "data", "research", "analysis"
        }
        return {p for p in parts if p not in stop}

    def _verdict(self, recency_score: int) -> str:
        if recency_score >= 7:
            return "✅ Still valid"
        if recency_score >= 4:
            return "⚠️ Partially outdated"
        return "❌ Outdated"

