from backend.agents.base import BaseAgent
from typing import Any, Dict, List


class GapAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Gap Detector",
            goal="Detect research/engineering gaps and actionable opportunities grounded in retrieved papers.",
            backstory="Expert in identifying missing capabilities and weak assumptions in literature."
        )

    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        query = input_data.get("query", "")
        papers: List[Dict[str, Any]] = input_data.get("papers") or []

        prompt = (
            "You are Gap Detector.\n"
            "CRITICAL: ONLY use REAL data in the provided papers dataset.\n"
            "Do NOT invent papers or findings.\n"
            "If papers are insufficient, respond with JSON: "
            '{"insufficient_data": true, "message": "Insufficient real research data to proceed reliably"}.\n'
            "Otherwise output JSON with keys:\n"
            "- gaps: array of {gap, impact, evidence_paper_ids}\n"
            "- opportunities: array of {opportunity, why_now, linked_gaps}\n"
            "- missing_links: array of {missing_connection, why_it_matters, candidate_paper_ids}\n\n"
            f"QUERY:\n{query}\n\n"
            f"PAPERS (JSON array):\n{papers}\n"
        )
        data = await self.call_llm_json(prompt, retries=2)
        return {"gaps": data}

