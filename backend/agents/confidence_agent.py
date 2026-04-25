from __future__ import annotations

import json
from typing import Any, Dict, List

from backend.agents.base import BaseAgent


class ConfidenceAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Confidence & Risk Assessor",
            goal="Calibrate trust with an explicit, auditable rationale; align with the deterministic engine.",
            backstory="Merges model judgment with hard signals from the corpus and synthesis.",
        )

    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        papers: List[Dict[str, Any]] = input_data.get("papers") or []
        engine = input_data.get("deterministic_confidence") or {}
        insight = input_data.get("insight")
        consensus = input_data.get("consensus")
        critique = input_data.get("critique", "")
        query = input_data.get("query", "")

        prompt = (
            "You are Confidence + Answer Defense. Return STRICT JSON only.\n"
            "Align the numeric score roughly with the deterministic engine below; you may nudge by at most ±12 points, explain why if you do.\n"
            "Never invent papers. Every 'why' must reference paper_id from context when relevant.\n\n"
            "{\n"
            '  "issues_detected": [""],\n'
            '  "risk_flags": [""],\n'
            '  "confidence_score": 0,\n'
            '  "confidence_level": "LOW|MEDIUM|HIGH",\n'
            '  "confidence_justification": "",\n'
            '  "revised_conclusion": "",\n'
            '  "answer_defense": {\n'
            '     "how_to_verify": [""],\n'
            '     "where_system_might_be_wrong": [""],\n'
            '     "confidence_risks": [""]\n'
            '  },\n'
            '  "influential_paper_ids": []\n'
            "}\n\n"
            f"USER_QUERY:\n{query}\n\n"
            f"DETERMINISTIC_ENGINE:\n{json.dumps(engine, ensure_ascii=False)[:3000]}\n\n"
            f"PAPERS (subset):\n{json.dumps([{k: p.get(k) for k in ('paper_id','title','citations','year')} for p in papers[:20]], ensure_ascii=False)[:8000]}\n\n"
            f"ANALYZER:\n{json.dumps(insight, ensure_ascii=False)[:8000] if insight else {}}\n\n"
            f"CONSENSUS:\n{json.dumps(consensus, ensure_ascii=False)[:8000] if consensus else {}}\n\n"
            f"CRITIC:\n{json.dumps(critique, ensure_ascii=False)[:6000] if not isinstance(critique, str) else critique}\n"
        )
        data = await self.call_llm_json(prompt, retries=2)
        if not isinstance(data, dict) or data.get("error"):
            data = {
                "issues_detected": ["LLM confidence call failed; rely on deterministic_confidence in metadata."],
                "risk_flags": ["Model assessment unavailable"],
                "confidence_score": int(engine.get("confidence_score", 0)) if engine else 40,
                "confidence_level": "MEDIUM",
                "confidence_justification": "Fallback: deterministic engine only.",
                "revised_conclusion": "",
                "answer_defense": {
                    "how_to_verify": [
                        "Cross-check every paper_id in key_findings by opening the linked URL in the paper list",
                    ],
                    "where_system_might_be_wrong": [
                        "Abstract-level retrieval may miss nuance; LLM phrasing can misrepresent details",
                    ],
                    "confidence_risks": [
                        "Sparse citation counts",
                        "Overlapping but not identical research questions",
                    ],
                },
                "influential_paper_ids": [p.get("paper_id") for p in papers[:3] if p.get("paper_id")],
            }
        return {"confidence_assessment": data}
