from __future__ import annotations

import json
from typing import Any, Dict

from backend.agents.base import BaseAgent
from backend.utils.claim_validation import filter_synthesis_traceable


class VotingAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Consensus Voter",
            goal="Synthesize a single, evidence-locked report with explicit paper references.",
            backstory="Final editor; drops any statement without valid paper_id references.",
        )

    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        query = input_data.get("query", "")
        domain = input_data.get("domain") or input_data.get("domain_label") or ""
        topics = input_data.get("topics") or []
        insight = input_data.get("insight", "")
        papers = input_data.get("papers") or []
        gaps = input_data.get("gaps", "")
        trends = input_data.get("trends", "")
        critique = input_data.get("critique", "")

        valid = {str(p.get("paper_id")) for p in papers if p.get("paper_id")}

        prompt = (
            "You are the Synthesizer. Return ONLY JSON.\n"
            "No generic platitudes. Every key_finding, comparative line, and risk must list paper_ids (subset of allowed). "
            "Omit an item if you cannot cite it.\n"
            "If the evidence is insufficient, set executive_summary to begin with: 'Insufficient evidence found' and keep lists small or empty.\n\n"
            "{\n"
            '  "executive_summary": "",\n'
            '  "key_findings": [{"text": "", "paper_ids": []}],\n'
            '  "comparative_analysis": [{"text": "", "paper_ids": []}],\n'
            '  "contradictions": [{"text": "", "paper_ids": []}],\n'
            '  "research_gaps": [{"text": "", "paper_ids": []}],\n'
            '  "risks": [{"text": "", "paper_ids": []}],\n'
            '  "future_directions": [{"text": "", "paper_ids": []}],\n'
            '  "conclusion": ""\n'
            "}\n\n"
            f"Allowed paper_ids: {sorted(valid)[:200]}\n"
            f"QUERY:\n{query}\n\n"
            f"DOMAIN:\n{domain}\n\n"
            f"TOPICS:\n{topics}\n\n"
            f"INSIGHT:\n{json.dumps(insight, ensure_ascii=False)[:10000]}\n\n"
            f"GAPS:\n{json.dumps(gaps, ensure_ascii=False)[:4000]}\n\n"
            f"TRENDS:\n{json.dumps(trends, ensure_ascii=False)[:4000]}\n\n"
            f"CRITIC:\n{json.dumps(critique, ensure_ascii=False)[:6000]}\n"
        )
        data = await self.call_llm_json(prompt, retries=2)
        if not isinstance(data, dict) or data.get("error"):
            data = {
                "executive_summary": "Insufficient evidence found. Synthesizer could not return valid JSON.",
                "key_findings": [],
                "comparative_analysis": [],
                "contradictions": [],
                "research_gaps": [],
                "risks": [],
                "future_directions": [],
                "conclusion": "",
            }
        data = filter_synthesis_traceable(data, valid)
        legacy = {
            "final_answer": data.get("executive_summary", ""),
            "key_points": [f.get("text", "") for f in (data.get("key_findings") or []) if f.get("text")],
            "gaps": [g.get("text", "") for g in (data.get("research_gaps") or []) if g.get("text")],
            "trends": [d.get("text", "") for d in (data.get("future_directions") or []) if d.get("text")],
        }
        return {
            "consensus": {**legacy, "synthesis": data},
        }
