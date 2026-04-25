from backend.agents.base import BaseAgent
from typing import Any, Dict, List


class TrendAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Trend Analyst",
            goal="Identify trends and predict near-future directions grounded in retrieved papers.",
            backstory="Expert at spotting emerging patterns across literature."
        )

    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        query = input_data.get("query", "")
        papers: List[Dict[str, Any]] = input_data.get("papers") or []

        prompt = (
            "You are Trend Analyst. Use ONLY the provided papers dataset.\n"
            "Do NOT invent papers, authors, titles, or findings.\n"
            "Output JSON with keys: trends (array of {trend, evidence_paper_ids, evidence_titles}), "
            "predictions (array of {prediction, rationale, evidence_paper_ids}), "
            "signals_to_watch (array of strings).\n\n"
            f"QUERY:\n{query}\n\n"
            f"PAPERS (JSON array):\n{papers}\n"
        )
        data = await self.call_llm_json(prompt, retries=2)
        return {"trends": data}

