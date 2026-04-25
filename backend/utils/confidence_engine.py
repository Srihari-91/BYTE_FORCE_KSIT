from __future__ import annotations

from statistics import fmean
from typing import Any, Dict, List, Optional


def compute_explainable_confidence(
    papers: List[Dict[str, Any]],
    insight: Optional[Dict[str, Any]] = None,
    num_contradictions: int = 0,
) -> Dict[str, Any]:
    """
    Deterministic 0–100 score with full breakdown. Used alongside (not against) the LLM assessor.
    """
    n = len(papers or [])
    cits = [p.get("citations") for p in (papers or []) if isinstance(p.get("citations"), int) and p.get("citations", -1) >= 0]
    avg_cit = fmean(cits) if cits else 0.0
    recs = [float(p.get("normalized_recency_score") or 0) for p in (papers or [])]
    avg_rec = fmean(recs) if recs else 0.0

    agr = 0.5
    ev = 0.5
    if isinstance(insight, dict):
        a = insight.get("agreements")
        t = insight.get("themes")
        if isinstance(a, list) and a:
            agr = min(1.0, 0.4 + 0.05 * min(len(a), 10))
        es = insight.get("evidence_strength")
        if isinstance(es, dict):
            if es.get("score") is not None:
                try:
                    s = float(es["score"])
                    ev = s if s <= 1.0 else min(1.0, s / 100.0)
                except (TypeError, ValueError):
                    pass
            elif es.get("level"):
                lvl = str(es["level"]).lower()
                ev = {"high": 0.85, "medium": 0.55, "low": 0.3}.get(lvl, ev)
        if isinstance(t, list) and t and ev == 0.5:
            ev = 0.55

    # Agreement proxy from contradictions: fewer contradictions => higher
    cpen = min(0.4, 0.08 * max(0, num_contradictions))
    agreement_score = max(0.0, min(1.0, agr - cpen * 0.3))

    # Weighted blend
    w_n = min(1.0, 0.12 * max(0, n))
    w_cit = min(1.0, (avg_cit**0.5) / 12.0)
    w_rec = avg_rec
    w_agr = agreement_score
    w_ev = ev
    total = 100.0 * (
        0.18 * w_n
        + 0.2 * w_cit
        + 0.18 * w_rec
        + 0.22 * w_agr
        + 0.22 * w_ev
    ) - 7.0 * min(4, num_contradictions)
    total = max(0.0, min(100.0, total))

    return {
        "confidence_score": round(total, 2),
        "confidence_breakdown": {
            "number_of_papers": n,
            "avg_citations": round(avg_cit, 3),
            "agreement_score": round(agreement_score, 4),
            "recency_score": round(avg_rec, 4),
            "evidence_strength_proxy": round(ev, 4),
            "citation_norm_component": round(w_cit, 4),
            "contrast_penalty_applied": num_contradictions,
        },
    }
