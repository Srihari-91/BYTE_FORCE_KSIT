from backend.agents.base import BaseAgent
from typing import Any, Dict

class DebateAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Debate Mediator",
            goal="Simulate a debate between the Analyzer and the Critic to reach a balanced view.",
            backstory="Expert in dialectical reasoning and conflict resolution."
        )

    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        analysis = input_data.get("analysis", "")
        criticism = input_data.get("criticism", "")
        prompt = f"Simulate a debate between an Analyst (who provided: {analysis}) and a Critic (who provided: {criticism}). Summarize the key points of agreement and disagreement."
        response = await self.call_llm(prompt)
        return {"debate_summary": response}
