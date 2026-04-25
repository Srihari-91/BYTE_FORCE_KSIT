from backend.agents.base import BaseAgent
from typing import Any, Dict

class ActionAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Operations Lead",
            goal="Provide actionable next steps based on the final decision.",
            backstory="Expert in project management and operational execution."
        )

    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        decision = input_data.get("decision", "")
        prompt = f"Based on the final decision: {decision}, provide a list of 5 concrete, actionable next steps."
        response = await self.call_llm(prompt)
        return {"action_steps": response}
