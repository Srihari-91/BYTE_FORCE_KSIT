from __future__ import annotations

import json
from typing import Any, Dict, List

from backend.agents.base import BaseAgent


class CriticAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Devil's Advocate",
            goal="Surface weaknesses, conflicts, and missing evidence without inventing papers.",
            backstory="Adversarial reviewer; only references paper_id from the corpus.",
        )

    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        query = input_data.get("query", "")
        papers: List[Dict[str, Any]] = input_data.get("papers") or []
        insight = input_data.get("insight", "")
        gaps = input_data.get("gaps", "")
        trends = input_data.get("trends", "")

        prompt = (
            "You are the Critic. Output ONLY valid JSON.\n"
            "Do NOT invent studies. Every risk or conflict must reference paper_id(s) from the list when possible.\n"
            "If the corpus is too thin, say so explicitly under limitations.\n\n"
            "Schema:\n"
            "{\n"
            '  "weaknesses": [{"text": "", "paper_ids": []}],\n'
            '  "conflicts": [{"text": "", "paper_ids": []}],\n'
            '  "missing_evidence": [{"text": ""}],\n'
            '  "risks": [{"text": "", "paper_ids": []}],\n'
            '  "readable_summary": ""\n'
            "}\n\n"
            f"QUERY:\n{query}\n\n"
            f"Allowed paper_id list: {[p.get('paper_id') for p in papers]}\n"
            f"INSIGHT JSON:\n{json.dumps(insight, ensure_ascii=False)[:12000]}\n\n"
            f"GAPS:\n{json.dumps(gaps, ensure_ascii=False)[:4000]}\n\n"
            f"TRENDS:\n{json.dumps(trends, ensure_ascii=False)[:4000]}\n"
        )
        data = await self.call_llm_json(prompt, retries=2)
        if not isinstance(data, dict) or data.get("error"):
            data = {
                "weaknesses": [],
                "conflicts": [],
                "missing_evidence": [{"text": "Critic pass failed to return structured JSON; treat findings cautiously."}],
                "risks": [],
                "readable_summary": "Critic pass incomplete.",
            }
        return {"critique": data, "conflicts_detected": data.get("conflicts") or []}
