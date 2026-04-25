from __future__ import annotations

import hashlib
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

_CURRENT_YEAR = datetime.utcnow().year


def _norm_title(s: str) -> str:
    t = re.sub(r"\s+", " ", (s or "").lower()).strip()
    t = re.sub(r"^[\s:-]+|[\s:-]+$", "", t)
    return t


def _stable_paper_id(p: Dict[str, Any]) -> str:
    for k in ("paper_id", "paperId"):
        v = p.get(k)
        if v and str(v).strip() and str(v) != "ARXIV" and str(v) != "S2":
            return str(v).strip()
    t = p.get("title") or ""
    h = hashlib.sha256(_norm_title(t).encode("utf-8")).hexdigest()[:12]
    return f"gen:{h}"


def _norm_citation_score(citations: Optional[int]) -> float:
    if citations is None or not isinstance(citations, int) or citations < 0:
        return 0.0
    # Sigmoid-style squash to 0-1: sqrt scale / (sqrt + k)
    import math

    x = float(citations) ** 0.5
    return round(x / (x + 6.0), 4)


def _norm_recency_score(year: Optional[int]) -> float:
    if not isinstance(year, int) or year <= 0:
        return 0.4
    age = max(0, _CURRENT_YEAR - year)
    if age == 0:
        return 1.0
    if age <= 1:
        return 0.95
    if age <= 2:
        return 0.85
    if age <= 5:
        return 0.7
    if age <= 10:
        return 0.5
    return 0.35


def _clean_authors(raw: Any) -> List[str]:
    if raw is None:
        return []
    if isinstance(raw, list):
        out: List[str] = []
        for a in raw:
            if isinstance(a, str) and a.strip():
                out.append(a.strip()[:200])
            elif isinstance(a, dict) and a.get("name"):
                out.append(str(a["name"])[:200])
        return out[:40]
    if isinstance(raw, str) and raw.strip():
        return [s.strip()[:200] for s in raw.split(",") if s.strip()][:40]
    return []


def normalize_paper(p: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize a raw paper dict into a stable schema; preserves extra keys but ensures core fields."""
    if not p:
        return {}
    title = (p.get("title") or "").strip() or "Untitled"
    abstract = (p.get("abstract") or p.get("summary") or "").strip()
    if len(abstract) < 3:
        abstract = "(no abstract in source)"

    year = p.get("year")
    y: Optional[int] = None
    if isinstance(year, int):
        y = year
    else:
        try:
            y = int(year) if year is not None and str(year).isdigit() else None
        except Exception:
            y = None

    c = p.get("citations")
    if c is None:
        c = p.get("citationCount")
    try:
        citations = int(c) if c is not None else None
    except Exception:
        citations = None

    out = {**p}
    out["title"] = title
    out["abstract"] = abstract
    out["year"] = y
    out["citations"] = citations
    out["source"] = p.get("source") or p.get("venue") or "unknown"
    out["url"] = p.get("url") or p.get("url") or None
    out["paper_id"] = _stable_paper_id(out)
    out["authors"] = _clean_authors(p.get("authors") or p.get("author") or p.get("author_list"))
    out["normalized_citation_score"] = _norm_citation_score(citations)
    out["normalized_recency_score"] = _norm_recency_score(y)
    out["source_type"] = p.get("source_type") or "other"
    return out


def dedupe_papers(papers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen: set[str] = set()
    out: List[Dict[str, Any]] = []
    for p in papers:
        t = _norm_title(p.get("title") or "")
        if not t or t in seen:
            continue
        seen.add(t)
        out.append(p)
    return out


def normalize_and_dedupe_papers(papers: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Deduplicate by title, remove papers with unusable text, sort by citation + recency signal.
    """
    if not papers:
        return [], {"dropped": 0, "reason": "no_input"}

    norm = [normalize_paper(p) for p in papers]
    norm = [p for p in norm if p.get("title") and p.get("abstract", "").strip() and len(p.get("abstract", "")) > 2]

    by_title: Dict[str, Dict[str, Any]] = {}
    for p in norm:
        k = _norm_title(p.get("title") or "")
        if not k:
            continue
        prev = by_title.get(k)
        if not prev or (p.get("citations") or 0) > (prev.get("citations") or 0):
            by_title[k] = p

    merged = list(by_title.values())
    merged.sort(
        key=lambda x: (
            -(x.get("citations") or 0),
            -(x.get("normalized_recency_score") or 0),
        )
    )
    stat = {
        "input_count": len(papers),
        "output_count": len(merged),
        "dropped": len(papers) - len(merged) + max(0, len(norm) - len(merged)),
    }
    return merged, stat
