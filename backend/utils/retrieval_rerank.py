from __future__ import annotations

import math
import re
from collections import Counter
from datetime import datetime
from typing import Any, Dict, List, Tuple

_CURRENT_YEAR = datetime.utcnow().year


def _tokens(text: str) -> List[str]:
    text = (text or "").lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return [t for t in text.split() if len(t) >= 3]


def _jaccard(a: set, b: set) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / max(1, len(a | b))


def _build_idf(corpus: List[str]) -> Dict[str, float]:
    N = len(corpus) or 1
    df: Counter[str] = Counter()
    for doc in corpus:
        seen = set(_tokens(doc))
        for t in seen:
            df[t] += 1
    idf: Dict[str, float] = {}
    for t, c in df.items():
        idf[t] = math.log((N + 1) / (c + 1.0)) + 1.0
    return idf


def _tfidf_vector(text: str, idf: Dict[str, float]) -> Counter:
    toks = _tokens(text)
    if not toks:
        return Counter()
    tf = Counter(toks)
    max_tf = max(tf.values()) or 1
    vec: Counter = Counter()
    for t, c in tf.items():
        if t in idf:
            vec[t] = (0.5 + 0.5 * c / max_tf) * idf[t]
    return vec


def _cosine_vec(a: Counter, b: Counter) -> float:
    if not a or not b:
        return 0.0
    keys = set(a) | set(b)
    num = sum(a.get(k, 0) * b.get(k, 0) for k in keys)
    da = math.sqrt(sum(v * v for v in a.values())) or 1.0
    db = math.sqrt(sum(v * v for v in b.values())) or 1.0
    return num / (da * db)


def keyword_overlap_score(query: str, paper: Dict[str, Any]) -> float:
    q = set(_tokens(query))
    d = set(_tokens(f"{paper.get('title','')} {paper.get('abstract','')}"))
    return _jaccard(q, d)


def semantic_similarity_tfidf(query: str, paper: Dict[str, Any], corpus_for_idf: List[str]) -> float:
    """
    Query–document similarity via shared TF–IDF space (no external embeddings).
    """
    doc_text = f"{paper.get('title','')} {paper.get('abstract','')}"
    docs = [query, doc_text] + corpus_for_idf[:60]
    idf = _build_idf(docs)
    vq = _tfidf_vector(query, idf)
    vd = _tfidf_vector(doc_text, idf)
    return _cosine_vec(vq, vd)


def venue_quality_score(p: Dict[str, Any]) -> float:
    st = (p.get("source_type") or "other").lower()
    s = (p.get("source") or "").lower()
    if st in ("journal", "conference") or "ieee" in s or "acm" in s or "springer" in s or "nature" in s:
        return 0.95
    if st == "preprint" or "arxiv" in s:
        return 0.75
    if st in ("web",) or "web" in s:
        return 0.45
    if "semantic" in s or "s2" in s:
        return 0.7
    return 0.6


def composite_rerank_score(
    query: str,
    paper: Dict[str, Any],
    corpus_for_idf: List[str],
) -> Dict[str, float]:
    sim = semantic_similarity_tfidf(query, paper, corpus_for_idf)
    kw = keyword_overlap_score(query, paper)
    cit = float(paper.get("normalized_citation_score") or 0.0)
    rec = float(paper.get("normalized_recency_score") or 0.0)
    vq = venue_quality_score(paper)
    total = (
        0.35 * sim
        + 0.2 * cit
        + 0.2 * rec
        + 0.1 * kw
        + 0.15 * vq
    )
    return {
        "semantic_similarity": round(sim, 4),
        "citation_score": round(cit, 4),
        "recency_score": round(rec, 4),
        "keyword_overlap": round(kw, 4),
        "venue_quality_score": round(vq, 4),
        "total_score": round(total, 4),
    }


def _diversity_mmr(
    candidates: List[Dict[str, Any]],
    k: int,
    lambda_param: float = 0.65,
) -> List[Dict[str, Any]]:
    if len(candidates) <= k:
        return candidates
    selected: List[Dict[str, Any]] = [candidates[0]]
    pool = candidates[1:]
    doc_vecs: Dict[str, Counter] = {}
    for p in candidates:
        pid = str(p.get("paper_id") or "")
        doc_vecs[pid] = Counter(_tokens(f"{p.get('title','')} {p.get('abstract','')[:800]}"))

    def sim_doc(a: Dict[str, Any], b: Dict[str, Any]) -> float:
        va = doc_vecs.get(str(a.get("paper_id")), Counter())
        vb = doc_vecs.get(str(b.get("paper_id")), Counter())
        return _cosine_vec(va, vb)

    while len(selected) < k and pool:
        best = None
        best_mmr = -1.0
        for cand in pool:
            rel = float(cand.get("_total_score", 0))
            max_sim = max((sim_doc(cand, s) for s in selected), default=0.0)
            mmr = lambda_param * rel - (1.0 - lambda_param) * max_sim
            if mmr > best_mmr:
                best_mmr = mmr
                best = cand
        if best is None:
            break
        selected.append(best)
        pool = [c for c in pool if c is not best]
    return selected


def rerank_and_diversify(
    papers: List[Dict[str, Any]],
    query: str,
    k: int = 8,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Stage 2–4: score all papers, sort, apply MMR diversity, return top k.
    `meta` is one entry per selected paper with score components (traceability).
    """
    if not papers:
        return [], []
    corpus = [f"{p.get('title','')} {p.get('abstract','')[:1200]}" for p in papers]
    scored: List[Dict[str, Any]] = []
    for p in papers:
        parts = composite_rerank_score(query, p, corpus)
        q = {**p, "rerank": parts, "_total_score": parts["total_score"]}
        scored.append(q)
    scored.sort(key=lambda x: -float(x.get("_total_score", 0)))
    top_pool = scored[: max(k * 3, k + 5)]
    selected = _diversity_mmr(top_pool, k=k)
    meta: List[Dict[str, Any]] = []
    for p in selected:
        r = p.get("rerank") or {}
        meta.append(
            {
                "paper_id": p.get("paper_id"),
                "title": p.get("title"),
                "score_components": r,
                "selection_explanation": (
                    f"Selected for composite score {r.get('total_score', 0):.3f} "
                    f"(semantic {r.get('semantic_similarity', 0):.2f}, "
                    f"citations {r.get('citation_score', 0):.2f}, recency {r.get('recency_score', 0):.2f}, "
                    f"venue {r.get('venue_quality_score', 0):.2f}) with diversity filter."
                ),
            }
        )
    out_papers = [{k: v for k, v in p.items() if not k.startswith("_")} for p in selected]
    for p in out_papers:
        p.pop("rerank", None)
    return out_papers, meta
