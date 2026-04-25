import os
from openai import AsyncOpenAI
from dotenv import load_dotenv
from loguru import logger

# Load environment variables
load_dotenv()

# Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
BASE_URL = "https://api.groq.com/openai/v1"
DEFAULT_MODEL = "llama-3.3-70b-versatile"

# Initialize single shared client
_client = None

def get_client():
    global _client
    if _client is None:
        if not GROQ_API_KEY:
            logger.error("GROQ_API_KEY is not set in environment variables.")
            raise ValueError("GROQ_API_KEY is missing")
        
        _client = AsyncOpenAI(
            api_key=GROQ_API_KEY,
            base_url=BASE_URL
        )
    return _client

async def call_llm(system_prompt: str, user_prompt: str, model: str = None):
    client = get_client()
    model = model or DEFAULT_MODEL
    
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Groq API Error: {e}")
        return f"Error: {str(e)}"
