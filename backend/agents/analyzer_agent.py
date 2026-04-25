from __future__ import annotations

import json
from typing import Any, Dict, List

from backend.agents.base import BaseAgent
from backend.utils.claim_validation import filter_insight_traceable


class AnalyzerAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Insight Analyzer",
            goal="Extract claim-locked, paper-grounded analysis. No unreferenced assertions.",
            backstory="Analyst team lead; rejects any statement not tied to a paper_id in the corpus.",
        )

    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        query = input_data.get("query", "")
        qplan = input_data.get("plan") or {}
        query_analysis = input_data.get("query_analysis") or {}
        papers: List[Dict[str, Any]] = input_data.get("papers") or []
        subq = (qplan.get("sub_questions") if isinstance(qplan, dict) else None) or []

        id_block = [
            {
                "paper_id": p.get("paper_id"),
                "title": p.get("title"),
                "year": p.get("year"),
                "citations": p.get("citations"),
            }
            for p in papers
        ]

        prompt = (
            "You are the Deep Analyzer. Every factual or interpretive claim MUST be traceable to one or more "
            "paper_id values from the list below. If you cannot support a claim from these papers, OMIT it.\n"
            "If evidence is too thin, set final_answer to exactly: 'Insufficient evidence found' and do not fabricate content.\n\n"
            "Return ONLY strict JSON with this schema (no extra keys, no commentary):\n"
            "{\n"
            '  "query_understanding": {"interpreted_intent": "", "key_focus_areas": [] },\n'
            '  "per_paper": [\n'
            "     {\n"
            '       "paper_id": "<from list>",\n'
            '       "title": "<must match provided title for that id>",\n'
            '       "problem": "",\n'
            '       "method": "",\n'
            '       "dataset": "",\n'
            '       "experimental_setup": "",\n'
            '       "results": "",\n'
            '       "limitations": ""\n'
            "     }\n"
            "  ],\n"
            '  "cross_paper": {\n'
            '     "agreements": [{"statement": "", "paper_ids": ["..."]}],\n'
            '     "contradictions": [{"statement": "", "paper_ids": ["..."], "resolution_note": ""}],\n'
            '     "trends": [{"note": "", "paper_ids": ["..."]}],\n'
            '     "gaps": [{"note": "", "paper_ids": ["..."]}]\n'
            "  },\n"
            '  "strong_insights": [{"insight": "", "paper_ids": [""], "strength": "high|medium|low"}],\n'
            '  "weak_or_preliminary": [{"insight": "", "paper_ids": [""] }],\n'
            '  "unknowns": [""],\n'
            '  "evidence_strength": { "level": "high|medium|low", "justification": "" },\n'
            '  "final_answer": "",\n'
            '  "confidence_reasoning": { "num_papers_used": 0, "consistency": "", "limitations": "" }\n'
            "}\n\n"
            "Rules: paper_ids in every field that makes a claim must be non-empty and subset of the allowed IDs. "
            "For contradictions, include at least two IDs when the tension is between papers, else one ID is acceptable only for internal limitations.\n\n"
            f"User query: {query}\n\n"
            f"Sub-questions to address: {json.dumps(subq, ensure_ascii=False)}\n\n"
            f"Query analysis: {json.dumps(query_analysis, ensure_ascii=False)[:2000]}\n\n"
            f"Allowed paper_id list (STRICT): {[p.get('paper_id') for p in papers]}\n"
            f"Title/id reference: {json.dumps(id_block, ensure_ascii=False)}\n"
        )

        data = await self.call_llm_json(prompt, retries=2)
        if not isinstance(data, dict) or data.get("error"):
            data = {
                "final_answer": "Insufficient evidence found (analyzer could not return valid JSON).",
                "query_understanding": {"interpreted_intent": str(query)[:200], "key_focus_areas": []},
                "per_paper": [],
                "cross_paper": {
                    "agreements": [],
                    "contradictions": [],
                    "trends": [],
                    "gaps": [],
                },
            }

        if "paper_analysis" not in data and data.get("per_paper"):
            data["paper_analysis"] = data["per_paper"]
        if data.get("cross_paper", {}).get("agreements") and "agreements" not in data:
            data["agreements"] = [
                x.get("statement", str(x)) for x in (data.get("cross_paper") or {}).get("agreements", []) if isinstance(x, dict)
            ]
        data = filter_insight_traceable(data, papers)
        return {"insight": data}
