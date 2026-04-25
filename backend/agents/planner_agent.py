from backend.agents.base import BaseAgent
from typing import Any, Dict


class PlannerAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Research Strategist",
            goal="Create a detailed plan to answer the research query.",
            backstory="Expert in breaking down complex tasks into logical research steps.",
        )

    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        query = input_data.get("query", "")
        prompt = (
            "You are Planner for an evidence-locked research system.\n"
            "Return JSON with keys:\n"
            '- "plan": array of 5–8 concrete sub-steps to execute.\n'
            '- "retrieval_queries": array of 3–6 focused search query strings (no fluff).\n'
            '- "sub_questions": array of 2–5 precise sub-questions the analysis must answer (testable against papers).\n'
            '- "vague_or_ambiguous": boolean — true if the user query is underspecified, else false.\n'
            "- If vague_or_ambiguous is true, add key \"suggested_refinement_prompt\": one short string asking the user to clarify.\n"
            f"\nUser QUERY:\n{query}\n"
        )
        data = await self.call_llm_json(prompt, retries=2)
        if isinstance(data, dict) and "error" in data and data.get("raw"):
            data = {
                "plan": ["Clarify intent", "Retrieve", "Filter", "Analyze", "Synthesize"],
                "retrieval_queries": [str(query)[:200]],
                "sub_questions": [str(query)[:200]],
                "vague_or_ambiguous": True,
            }
        return {"plan": data}
