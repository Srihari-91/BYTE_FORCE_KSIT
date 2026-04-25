from backend.agents.base import BaseAgent
from typing import Any, Dict

class DomainAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Domain Specialist",
            goal="Identify the domain and context of the research query.",
            backstory="Expert in categorizing complex multi-disciplinary problems."
        )

    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        query = input_data.get("query", "")
        prompt = (
            "Return a short domain classification for the query.\n"
            "Output STRICT JSON with keys:\n"
            '- domain: one of ["Healthcare","Finance","Tech","Policy","Education","Security","Science","Other"]\n'
            "- topics: array of strings\n"
            "- query_analysis: { interpreted_intent: string, key_focus_areas: array of strings }\n\n"
            f"User Query:\n{query}\n"
        )
        data = await self.call_llm_json(prompt)
        return {
            "domain": data.get("domain"),
            "topics": data.get("topics") or [],
            "query_analysis": data.get("query_analysis") or {}
        }
