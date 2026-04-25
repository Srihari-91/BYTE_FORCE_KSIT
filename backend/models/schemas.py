from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal

class Source(BaseModel):
    title: str
    link: str

class AgentLog(BaseModel):
    agent: str
    status: str
    message: str
    data: Optional[Any] = None

class FinalResult(BaseModel):
    summary: str
    key_findings: List[str]
    conflicts: List[str]
    confidence_score: float
    confidence_explanation: str
    sources: List[Source]

class Paper(BaseModel):
    title: str = Field(..., min_length=1)
    abstract: str = Field(..., min_length=1)
    year: Optional[int] = None
    authors: Optional[List[str]] = None
    source: Optional[str] = None
    url: Optional[str] = None
    # Stable identifier inside this run (e.g., "S2:abc123" or "ARXIV:xxxx.yyyy")
    paper_id: Optional[str] = None
    citations: Optional[int] = None
    influential_citations: Optional[int] = None
    is_influential: Optional[bool] = None
    verified: Optional[bool] = None
    source_type: Optional[str] = None  # journal / conference / preprint / web / other
    doi: Optional[str] = None

class ScoredPaper(Paper):
    recency_score: int = Field(..., ge=1, le=10)
    relevance_score: int = Field(..., ge=1, le=10)
    verdict: Literal["✅ Still valid", "⚠️ Partially outdated", "❌ Outdated"]

class ResearchState(BaseModel):
    query: str
    plan: Optional[str] = None
    raw_papers: List[Paper] = []
    claims: List[Dict[str, Any]] = []
    contradictions: List[str] = []
    iterations: int = 0
    final_result: Optional[FinalResult] = None

class ResearchRequest(BaseModel):
    # Backwards-compatible: older clients can still send `query`.
    query: Optional[str] = None
    project_title: Optional[str] = None
    project_description: Optional[str] = None

class AgentStep(BaseModel):
    agent: str
    thought: str
    output: Any

class ResearchResponse(BaseModel):
    query: str
    decision: str
    confidence_score: float
    reasoning_summary: str
    action_steps: List[str]
    agent_logs: List[AgentStep]
    risks: List[str]
