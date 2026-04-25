from abc import ABC, abstractmethod
from backend.services.llm_service import llm_service
from typing import Any, Dict

class BaseAgent(ABC):
    def __init__(self, role: str, goal: str, backstory: str = ""):
        self.role = role
        self.goal = goal
        self.backstory = backstory
        self.system_prompt = f"""
        Role: {self.role}
        Goal: {self.goal}
        Backstory: {self.backstory}
        
        STRICT RULES:
        1. Stay strictly within your assigned role.
        2. Think step-by-step before answering.
        3. Use structured outputs.
        4. Avoid hallucination.
        5. Be concise, clear, and factual.
        """

    async def call_llm(self, prompt: str) -> str:
        return await llm_service.generate_response(prompt, self.system_prompt)

    async def call_llm_json(self, prompt: str, retries: int = 2) -> Dict[str, Any]:
        """
        JSON-mode call for production-grade structured outputs.
        """
        return await llm_service.call_json(prompt, self.system_prompt, retries=retries)

    @abstractmethod
    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        pass
