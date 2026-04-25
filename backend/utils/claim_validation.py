from __future__ import annotations

from typing import Any, Dict, List, Set

INSUFF_MSG = "Insufficient evidence found. Assertions below are only included where they reference a paper ID in the provided corpus."


def _as_set_valid_ids(papers: List[Dict[str, Any]]) -> Set[str]:
    s: Set[str] = set()
    for p in papers:
        pid = p.get("paper_id")
        if pid and str(pid).strip():
            s.add(str(pid).strip())
    return s


def _filter_paper_ids(ids: Any, valid: Set[str]) -> List[str]:
    if not isinstance(ids, list):
        return []
    out: List[str] = []
    for x in ids:
        sx = str(x).strip() if x is not None else ""
        if sx and sx in valid:
            out.append(sx)
    return out


def filter_insight_traceable(insight: Any, papers: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Enforce: cross-paper statements must list supporting paper_id(s) from the run.
    Removes claims without at least one valid paper_id when paper_ids is required.
    """
    if not isinstance(insight, dict):
        return {"error": "insight_not_object", "final_answer": INSUFF_MSG, "query_understanding": {"interpreted_intent": "", "key_focus_areas": []}}
    valid = _as_set_valid_ids(papers)
    out: Dict[str, Any] = dict(insight)

    def clean_list_claims(key: str) -> None:
        raw = out.get(key)
        if not isinstance(raw, list):
            return
        new_list: List[Any] = []
        for item in raw:
            if isinstance(item, dict) and "paper_ids" in item:
                pids = _filter_paper_ids(item.get("paper_ids"), valid)
                if not pids:
                    continue
                c = dict(item)
                c["paper_ids"] = pids
                new_list.append(c)
            elif isinstance(item, str) and key in ("agreements", "contradictions", "research_gaps"):
                if item.strip():
                    new_list.append(item)
            elif isinstance(item, dict) and "statement" in item:
                pids = _filter_paper_ids(item.get("paper_ids"), valid)
                if pids:
                    c = dict(item)
                    c["paper_ids"] = pids
                    new_list.append(c)
        out[key] = new_list

    for k in ("cross_paper_insights", "synthesized_claims", "trends_detected", "agreements", "contradictions"):
        if k in out:
            clean_list_claims(k)

    cp = out.get("cross_paper")
    if isinstance(cp, dict):
        for k in ("agreements", "contradictions", "trends", "gaps"):
            if k not in cp or not isinstance(cp[k], list):
                continue
            new_l: List[Any] = []
            for item in cp[k]:
                if isinstance(item, dict) and "paper_ids" in item:
                    pids = _filter_paper_ids(item.get("paper_ids"), valid)
                    if not pids and k != "gaps":
                        continue
                    if not pids and k == "gaps":
                        # gaps may be corpus-level without ids — drop if no ids to stay strict
                        continue
                    c = dict(item)
                    c["paper_ids"] = pids
                    new_l.append(c)
            cp[k] = new_l
        out["cross_paper"] = cp

    for k in ("strong_insights", "weak_or_preliminary"):
        raw = out.get(k)
        if not isinstance(raw, list):
            continue
        new_l = []
        for item in raw:
            if not isinstance(item, dict):
                continue
            pids = _filter_paper_ids(item.get("paper_ids"), valid)
            if not pids:
                continue
            c = dict(item)
            c["paper_ids"] = pids
            new_l.append(c)
        out[k] = new_l

    # paper_analysis / per_paper: keep only entries for known paper_id
    pa = out.get("paper_analysis")
    if isinstance(pa, list):
        fixed: List[Dict[str, Any]] = []
        for block in pa:
            if not isinstance(block, dict):
                continue
            bid = block.get("paper_id")
            if bid and str(bid) in valid:
                fixed.append(block)
            else:
                # try match by title
                tit = (block.get("title") or "").strip().lower()
                m = next((p for p in papers if (p.get("title") or "").strip().lower() == tit), None)
                if m and m.get("paper_id"):
                    b2 = dict(block)
                    b2["paper_id"] = m.get("paper_id")
                    fixed.append(b2)
        out["paper_analysis"] = fixed

    pp = out.get("per_paper")
    if isinstance(pp, list):
        fixed2: List[Dict[str, Any]] = []
        for block in pp:
            if not isinstance(block, dict):
                continue
            bid = block.get("paper_id")
            if bid and str(bid) in valid:
                fixed2.append(block)
        out["per_paper"] = fixed2
        if not out.get("paper_analysis"):
            out["paper_analysis"] = fixed2

    # themes: drop supporting claims without support ids if structured
    th = out.get("themes")
    if isinstance(th, list):
        for t in th:
            if not isinstance(t, dict):
                continue
            sc = t.get("supporting_claims")
            if isinstance(sc, list) and sc and isinstance(sc[0], dict) and "paper_ids" in sc[0]:
                t["supporting_claims"] = [x for x in sc if _filter_paper_ids(x.get("paper_ids"), valid)]

    if not (out.get("paper_analysis") or out.get("per_paper") or (out.get("final_answer") or "").strip()):
        out["final_answer"] = (out.get("final_answer") or "") + "\n\n" + INSUFF_MSG
    return out


def filter_synthesis_traceable(syn: Any, valid: Set[str]) -> Dict[str, Any]:
    if not isinstance(syn, dict):
        return {}
    o = dict(syn)

    def fl(items: Any) -> List[Dict[str, Any]]:
        if not isinstance(items, list):
            return []
        r: List[Dict[str, Any]] = []
        for it in items:
            if not isinstance(it, dict):
                continue
            pids = _filter_paper_ids(it.get("paper_ids"), valid)
            if pids and (it.get("text") or it.get("statement") or it.get("finding")):
                c = dict(it)
                c["paper_ids"] = pids
                c["text"] = c.get("text") or c.get("statement") or c.get("finding")
                r.append(c)
        return r

    for k in ("key_findings", "comparative_analysis", "contradictions", "research_gaps", "risks", "future_directions"):
        if k not in o:
            continue
        raw = o.get(k)
        if not isinstance(raw, list):
            o[k] = []
            continue
        if k == "comparative_analysis":
            norm: List[Dict[str, Any]] = []
            for x in raw:
                if isinstance(x, dict):
                    norm.append(x)
                else:
                    norm.append({"text": str(x), "paper_ids": []})
            o[k] = fl(norm)
        else:
            o[k] = fl(raw)

    return o
