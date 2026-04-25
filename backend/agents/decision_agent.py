from backend.agents.base import BaseAgent
from typing import Any, Dict

class DecisionAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Chief Strategist",
            goal="Make the final decision based on all gathered evidence and debate.",
            backstory="Expert in high-stakes decision making and strategic leadership."
        )

    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        debate = input_data.get("debate_summary", "")
        prompt = f"Based on this debate summary and the research process: {debate}, provide a final, well-reasoned decision and a confidence score (0.0 to 1.0)."
        response = await self.call_llm(prompt)
        return {"decision": response}
