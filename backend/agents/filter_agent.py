from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List

from backend.agents.base import BaseAgent
from backend.utils.paper_normalization import normalize_paper
from backend.utils.retrieval_rerank import rerank_and_diversify


class FilterAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Research Filtering & Ranking Engine",
            goal="Select 5–10 diverse, high-quality papers using a transparent scoring + diversity pass.",
            backstory="Algorithmic re-rank with optional narrative explanation — no invented papers.",
        )

    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        query = (input_data.get("query") or "").strip()
        candidate_papers: List[Dict[str, Any]] = input_data.get("papers") or []
        for i, p in enumerate(candidate_papers):
            candidate_papers[i] = normalize_paper(p if isinstance(p, dict) else {})

        k = min(10, max(5, len(candidate_papers)))
        if len(candidate_papers) <= k:
            selected, meta = rerank_and_diversify(candidate_papers, query, k=len(candidate_papers))
        else:
            selected, meta = rerank_and_diversify(candidate_papers, query, k=k)

        current_year = datetime.utcnow().year
        # LLM only explains pre-selected set (no paper invention)
        explain_prompt = (
            "You are documenting retrieval policy for auditing.\n"
            f"Papers have ALREADY been selected by deterministic re-rank + MMR ({len(selected)} papers).\n"
            "Return ONLY JSON: {\"selection_strategy\": str} describing why that policy is defensible, "
            "in 2–4 sentences. Do NOT add titles or papers not in the preselected list.\n\n"
            f"Query:\n{query}\n\n"
            f"Top selected paper_ids in order: {[p.get('paper_id') for p in selected]}\n"
        )
        strat = await self.call_llm_json(explain_prompt, retries=1)
        strategy = (
            strat.get("selection_strategy")
            if isinstance(strat, dict) and not strat.get("error")
            else "Deterministic re-rank with TF–IDF query similarity, bibliometric and recency signals, venue quality, and MMR diversity."
        )

        ranked_meta = {
            "selected_papers": [
                {
                    "title": p.get("title"),
                    "year": p.get("year"),
                    "citationCount": p.get("citations") or 0,
                    "citation_velocity": _vel(p, current_year),
                    "relevance_score": next(
                        (
                            (m.get("score_components") or {}).get("total_score", 0)
                            for m in meta
                            if m.get("paper_id") == p.get("paper_id")
                        ),
                        0,
                    ),
                    "selection_reason": next(
                        (m.get("selection_explanation") for m in meta if m.get("paper_id") == p.get("paper_id")),
                        "Scored and diversified by the retrieval engine.",
                    ),
                    "paper_id": p.get("paper_id"),
                }
                for p in selected
            ],
            "selection_strategy": strategy,
            "per_paper_receipt": meta,
        }

        return {
            "selected_papers_meta": ranked_meta,
            "selected_papers": selected,
            "selected_papers_count": len(selected),
        }


def _vel(p: Dict[str, Any], cy: int) -> float:
    y = p.get("year")
    cc = p.get("citations")
    if not y or not isinstance(y, int) or y <= 0:
        return 0.0
    try:
        c = int(cc) if cc is not None else 0
    except (TypeError, ValueError):
        c = 0
    return round(c / (cy - y + 1.0), 4)
