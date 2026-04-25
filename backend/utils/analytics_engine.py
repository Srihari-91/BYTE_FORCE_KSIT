from __future__ import annotations

from collections import Counter
from statistics import fmean
from typing import Any, Dict, List


def build_citation_graph_stats(papers: List[Dict[str, Any]]) -> Dict[str, Any]:
    cits = [p.get("citations") for p in papers if isinstance(p.get("citations"), int)]
    years = [p.get("year") for p in papers if isinstance(p.get("year"), int) and p.get("year", 0) > 1900]
    if not cits and not years:
        return {"note": "insufficient paper metadata for citation/timeline stats"}
    return {
        "total_papers": len(papers),
        "citation_sum": int(sum(cits) if cits else 0),
        "citation_mean": round(fmean(cits), 3) if cits else None,
        "year_min": min(years) if years else None,
        "year_max": max(years) if years else None,
        "timeline": _timeline_counts(years),
    }


def _timeline_counts(years: List[int]) -> Dict[str, int]:
    c: Counter = Counter()
    for y in years:
        c[str(y)] += 1
    return dict(sorted(c.items()))


def influential_papers(papers: List[Dict[str, Any]], n: int = 5) -> List[Dict[str, Any]]:
    def score(p: Dict[str, Any]) -> float:
        c = p.get("citations") or 0
        r = float(p.get("normalized_recency_score") or 0.5)
        if not isinstance(c, int) or c < 0:
            c = 0
        return float(c) * 0.6 + r * 40.0

    return sorted(
        [p for p in papers if p.get("paper_id")],
        key=score,
        reverse=True,
    )[:n]
