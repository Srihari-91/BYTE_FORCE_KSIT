from __future__ import annotations

import asyncio
from typing import Any, Dict, List, Optional
from loguru import logger

from backend.agents.domain_agent import DomainAgent
from backend.agents.planner_agent import PlannerAgent
from backend.agents.retriever_agent import RetrieverAgent
from backend.agents.filter_agent import FilterAgent
from backend.agents.verifier_agent import VerifierAgent
from backend.agents.analyzer_agent import AnalyzerAgent
from backend.agents.trend_agent import TrendAgent
from backend.agents.gap_agent import GapAgent
from backend.agents.voting_agent import VotingAgent
from backend.agents.critic_agent import CriticAgent
from backend.agents.confidence_agent import ConfidenceAgent
from backend.agents.recency_relevance_agent import RecencyRelevanceAgent
from backend.memory.store import MemoryStore
from backend.utils.graph_builder import build_graph
from backend.models.schemas import AgentStep
from backend.utils.confidence_engine import compute_explainable_confidence
from backend.utils.analytics_engine import build_citation_graph_stats, influential_papers


def _count_contradictions(insight: Any, critique: Any) -> int:
    n = 0
    if isinstance(insight, dict):
        cp = insight.get("cross_paper") or {}
        if isinstance(cp.get("contradictions"), list):
            n += len(cp["contradictions"])
    if isinstance(critique, dict):
        n += len(critique.get("conflicts") or [])
    return n


def _merge_confidence(
    det: Dict[str, Any], llm: Optional[Dict[str, Any]], papers: List[Dict[str, Any]]
) -> tuple[float, Dict[str, Any], Optional[str]]:
    d_score = float((det or {}).get("confidence_score", 0) or 0)
    if not llm or not isinstance(llm, dict):
        return max(0.0, min(1.0, d_score / 100.0)), {**det, "source": "deterministic"}, None
    try:
        m = float(llm.get("confidence_score", d_score))
    except (TypeError, ValueError):
        m = d_score
    blended = 0.45 * d_score + 0.55 * m
    blended = max(0.0, min(100.0, blended))
    out = {
        "deterministic": det,
        "llm": {k: v for k, v in llm.items() if k in ("confidence_justification", "confidence_level", "answer_defense", "revised_conclusion", "issues_detected", "risk_flags")},
        "blended_0_100": round(blended, 2),
    }
    revised = llm.get("revised_conclusion")
    rstr = revised.strip() if isinstance(revised, str) and revised.strip() else None
    return round(blended / 100.0, 2), out, rstr


def _planner_sub_questions(plan_block: Any) -> List[str]:
    if not isinstance(plan_block, dict):
        return []
    return [str(x) for x in (plan_block.get("sub_questions") or []) if str(x).strip()][:8]


def _insufficient_payload(agent_logs: List[AgentStep], message: str) -> Dict[str, Any]:
    return {
        "final_answer": message,
        "evidence_status": "INSUFFICIENT",
        "confidence": 0.0,
        "confidence_breakdown": {},
        "risk": "High (no retrieved papers)",
        "gaps": [],
        "synthesis": None,
        "graph": {"nodes": [], "edges": []},
        "critique": {"readable_summary": "No evidence in corpus; critique skipped."},
        "agent_logs": [l.model_dump() for l in agent_logs],
    }


class ResearchPipeline:
    def __init__(self) -> None:
        self.agents = {
            "planner": PlannerAgent(),
            "retriever": RetrieverAgent(),
            "verifier": VerifierAgent(),
            "filter": FilterAgent(),
            "domain": DomainAgent(),
            "insight": AnalyzerAgent(),
            "trend": TrendAgent(),
            "gap": GapAgent(),
            "critic": CriticAgent(),
            "voter": VotingAgent(),
            "confidence": ConfidenceAgent(),
            "recency": RecencyRelevanceAgent(),
        }
        self.memory = MemoryStore()

    async def run(
        self, *, query: str, project_title: Optional[str] = None, project_description: Optional[str] = None
    ) -> Dict[str, Any]:
        composed_query = (query or "").strip()
        if (project_title or "").strip() or (project_description or "").strip():
            composed_query = "\n".join(
                [
                    f"Project Title: {(project_title or '').strip()}",
                    f"Project Description: {(project_description or '').strip()}",
                    f"User Query: {query.strip()}",
                ]
            ).strip()

        context: Dict[str, Any] = {"query": composed_query}
        agent_logs: List[AgentStep] = []

        async def _run_step(name: str) -> Dict[str, Any]:
            logger.info(f"Running agent: {name}")
            agent = self.agents[name]
            out = await agent.process(context)
            agent_logs.append(AgentStep(agent=agent.role, thought=f"Executed {name}", output=out))
            context.update(out)
            return out

        await _run_step("planner")
        await _run_step("retriever")
        await _run_step("verifier")
        await _run_step("filter")
        await _run_step("domain")

        context["candidate_papers"] = context.get("papers") or []
        context["papers"] = context.get("selected_papers") or []
        papers = context.get("papers") or []
        if not papers:
            bad = _insufficient_payload(
                agent_logs, "Insufficient evidence found: no retrievable papers passed normalization and selection."
            )
            mem = self.memory.save_run(bad)
            bad["run_id"] = mem["run_id"]
            return bad

        await _run_step("recency")

        logger.info("Running parallel analysis agents")
        insight_task = self.agents["insight"].process(context)
        gap_task = self.agents["gap"].process(context)
        trend_task = self.agents["trend"].process(context)
        insight_out, gap_out, trend_out = await asyncio.gather(insight_task, gap_task, trend_task)
        for name, out in [("insight", insight_out), ("gap", gap_out), ("trend", trend_out)]:
            agent = self.agents[name]
            agent_logs.append(AgentStep(agent=agent.role, thought=f"Executed {name} (parallel)", output=out))
            context.update(out)

        await _run_step("critic")
        n_contra = _count_contradictions(context.get("insight"), context.get("critique"))
        det_conf = compute_explainable_confidence(
            papers, context.get("insight") if isinstance(context.get("insight"), dict) else None, n_contra
        )
        context["deterministic_confidence"] = det_conf
        context["conflicts_detected"] = context.get("conflicts_detected") or []

        await _run_step("voter")
        await _run_step("confidence")

        domain_label = (
            context.get("domain")
            or context.get("domain_label")
            or context.get("domain_analysis")
            or "general"
        )
        graph = build_graph(papers, domain=str(domain_label) if domain_label else "general")

        final_answer, key_points, gaps_structured, trends_structured, synthesis = self._parse_consensus(
            context.get("consensus")
        )

        conf = context.get("confidence_assessment") or {}
        confidence_level = conf.get("confidence_level")
        revised_conclusion = conf.get("revised_conclusion")
        risk_flags = conf.get("risk_flags") or []
        answer_defense = conf.get("answer_defense")
        if isinstance(risk_flags, str):
            risk_flags = [risk_flags]

        d_engine = det_conf
        final_conf, merged_cb, r2 = _merge_confidence(
            d_engine, conf if isinstance(conf, dict) else None, papers
        )
        if isinstance(r2, str) and r2.strip():
            final_answer = r2
        if isinstance(revised_conclusion, str) and revised_conclusion.strip() and not r2:
            final_answer = revised_conclusion.strip()

        if final_conf <= 0.02 and papers:
            final_conf = self._confidence_score(
                papers_count=int(context.get("papers_count") or len(papers)),
                conflicts=context.get("insight") or {},
            )

        risk: Optional[str] = None
        if isinstance(confidence_level, str) and confidence_level.strip():
            u = confidence_level.upper()
            risk = "Low" if u == "HIGH" else ("Medium" if u == "MEDIUM" else "High")
        if risk is None:
            risk = self._risk_label(final_conf)  # type: ignore[arg-type]

        subq = _planner_sub_questions(context.get("plan"))
        analytics = {
            "citation_and_timeline": build_citation_graph_stats(papers),
            "knowledge_graph_note": "Edges use TF–IDF cosine on title+abstract (defensible, corpus-local).",
        }
        top_infl = influential_papers(papers, n=5)
        ev_table = [
            {
                "paper_id": p.get("paper_id"),
                "title": p.get("title"),
                "year": p.get("year"),
                "citations": p.get("citations"),
                "url": p.get("url"),
            }
            for p in papers
        ]

        critique_obj = context.get("critique")
        critique_for_api = (
            (critique_obj or {}).get("readable_summary", "")
            if isinstance(critique_obj, dict)
            else str(critique_obj or "")
        )

        result: Dict[str, Any] = {
            "query": composed_query,
            "query_decomposition": {"sub_questions": subq, "planner": context.get("plan")},
            "gap_agent_output": context.get("gaps"),
            "trend_agent_output": context.get("trends"),
            "evidence_guarantee": "v2_traceability",
            "evidence_status": "OK" if papers else "INSUFFICIENT",
            "plan": context.get("plan"),
            "insight": context.get("insight"),
            "final_answer": final_answer,
            "synthesis": synthesis,
            "confidence": final_conf,
            "confidence_assessment": conf,
            "confidence_breakdown": merged_cb,
            "deterministic_confidence": det_conf,
            "risk": risk,
            "gaps": gaps_structured,
            "trends": trends_structured,
            "critique": critique_obj,
            "critique_summary": critique_for_api,
            "risk_flags": risk_flags,
            "answer_defense": answer_defense
            or (conf.get("answer_defense") if isinstance(conf, dict) else None),
            "graph": graph,
            "papers_analyzed": len(papers),
            "selection": context.get("selected_papers_meta"),
            "retrieval_receipts": (context.get("selected_papers_meta") or {})
            .get("per_paper_receipt", []),
            "evidence_table": ev_table,
            "top_papers": context.get("top_papers") or top_infl,
            "influential_papers": top_infl,
            "key_points": key_points,
            "agent_logs": [l.model_dump() for l in agent_logs],
            "analytics": analytics,
        }

        mem = self.memory.save_run(result)
        result["run_id"] = mem["run_id"]
        return result

    def _confidence_score(self, papers_count: int, conflicts: Any) -> float:
        base = 0.35
        base += min(0.45, 0.05 * max(0, papers_count - 1))
        conflict_penalty = 0.0
        if isinstance(conflicts, list) and len(conflicts) >= 3:
            conflict_penalty = 0.2
        elif isinstance(conflicts, list) and len(conflicts) > 0:
            conflict_penalty = 0.1
        elif isinstance(conflicts, dict):
            # insight dict with cross_paper
            cp = (conflicts.get("cross_paper") or {})
            ccl = len(cp.get("contradictions") or []) if isinstance(cp, dict) else 0
            if ccl >= 2:
                conflict_penalty = 0.12
        score = max(0.0, min(1.0, base - conflict_penalty))
        return round(score, 2)

    def _risk_label(self, confidence: float) -> str:
        if confidence >= 0.75:
            return "Low"
        if confidence >= 0.5:
            return "Medium"
        return "High"

    def _parse_consensus(
        self, consensus_raw: Any
    ) -> tuple[str, list, list, list, Any]:
        if not consensus_raw:
            return "", [], [], [], None
        data = consensus_raw if isinstance(consensus_raw, dict) else {"final_answer": str(consensus_raw)}
        syn = data.get("synthesis")
        return (
            data.get("final_answer") or "",
            data.get("key_points") or [],
            data.get("gaps") or [],
            data.get("trends") or [],
            syn,
        )
