import json
import openai
from backend.config.settings import settings
from loguru import logger
from typing import Any, Dict, Optional

class LLMService:
    def __init__(self):
        self.client = None
        self.model = ""
        
        # Prefer Groq if API key is provided
        if settings.GROQ_API_KEY:
            self.client = openai.AsyncOpenAI(
                api_key=settings.GROQ_API_KEY,
                base_url="https://api.groq.com/openai/v1"
            )
            self.model = "llama-3.3-70b-versatile"
            logger.info("LLMService initialized with Groq")
        elif settings.OPENAI_API_KEY:
            self.client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            self.model = "gpt-4o"
            logger.info("LLMService initialized with OpenAI")
        else:
            logger.warning("No LLM API keys found in settings")

    async def call(self, prompt: str, system: str, json_mode: bool = False) -> str:
        if not self.client:
            return "Error: LLM client not configured. Please set GROQ_API_KEY or OPENAI_API_KEY."
            
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"} if json_mode else None,
                temperature=0.1
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"LLM Error: {e}")
            return f"Error: {str(e)}"

    async def generate_response(self, prompt: str, system: str) -> str:
        """Alias for call method, used by BaseAgent"""
        return await self.call(prompt, system)

    async def call_json(self, prompt: str, system: str, retries: int = 2) -> Dict[str, Any]:
        for i in range(retries + 1):
            res = await self.call(prompt, system, json_mode=True)
            try:
                # Basic cleaning for some LLMs that might wrap JSON in markdown
                if "```json" in res:
                    res = res.split("```json")[1].split("```")[0].strip()
                elif "```" in res:
                    res = res.split("```")[1].split("```")[0].strip()
                
                return json.loads(res)
            except Exception as e:
                if i == retries:
                    logger.error(f"Failed to parse JSON after {retries} retries: {res}")
                    return {"error": "Invalid JSON response", "raw": res}
                continue

llm_service = LLMService()
