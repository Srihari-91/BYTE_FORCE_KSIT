from __future__ import annotations

import math
from typing import Any, Dict, List, Tuple
import re
from collections import Counter


def _tok(text: str) -> List[str]:
    text = (text or "").lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return [t for t in text.split() if len(t) >= 3]


def _idf_corpus(corpus: List[str]) -> Dict[str, float]:
    N = len(corpus) or 1
    df: Counter[str] = Counter()
    for doc in corpus:
        for t in set(_tok(doc)):
            df[t] += 1
    return {t: math.log((N + 1) / (c + 1.0)) + 1.0 for t, c in df.items()}


def _vec(text: str, idf: Dict[str, float]) -> Counter:
    toks = _tok(text)
    if not toks:
        return Counter()
    tf = Counter(toks)
    m = max(tf.values()) or 1
    v: Counter = Counter()
    for t, c in tf.items():
        if t in idf:
            v[t] = (0.5 + 0.5 * c / m) * idf[t]
    return v


def _cos(a: Counter, b: Counter) -> float:
    if not a or not b:
        return 0.0
    keys = set(a) | set(b)
    num = sum(a.get(k, 0) * b.get(k, 0) for k in keys)
    da = math.sqrt(sum(x * x for x in a.values())) or 1.0
    db = math.sqrt(sum(x * x for x in b.values())) or 1.0
    return num / (da * db)


def build_graph_tfidf_cosine(
    papers: List[Dict[str, Any]], domain: str | None = None, min_sim: float = 0.08, top_k_per_node: int = 6
) -> Dict[str, Any]:
    """
    Knowledge graph edges weighted by TF–IDF cosine similarity between (title+abstract) texts.
    """
    if not papers:
        return {"nodes": [], "edges": []}
    domain = domain or "general"
    corpus = [f"{p.get('title', '')} {p.get('abstract', '')[:4000]}" for p in papers]
    idf = _idf_corpus(corpus)
    vecs: List[Counter] = [_vec(c, idf) for c in corpus]
    pids: List[str] = []
    nodes: List[Dict[str, Any]] = []
    id_fallback = 0
    for p in papers:
        pid = p.get("paper_id") or p.get("url") or p.get("title")
        if not pid:
            id_fallback += 1
            pid = f"paper:{id_fallback}"
        pid = str(pid)
        pids.append(pid)
        nodes.append(
            {
                "id": pid,
                "label": p.get("title"),
                "year": p.get("year"),
                "source": p.get("source"),
                "group": domain,
                "url": p.get("url"),
                "citations": p.get("citations"),
            }
        )
    n = len(pids)
    edges: List[Dict[str, Any]] = []
    for i in range(n):
        sims: List[Tuple[int, float]] = []
        for j in range(n):
            if i == j:
                continue
            s = _cos(vecs[i], vecs[j])
            if s >= min_sim:
                sims.append((j, s))
        sims.sort(key=lambda x: -x[1])
        for j, s in sims[:top_k_per_node]:
            if i < j:
                w = min(10.0, s * 12.0)
                edges.append({"source": pids[i], "target": pids[j], "weight": round(w, 3), "cosine": round(s, 4)})

    return {"nodes": nodes, "edges": edges, "edge_type": "tfidf_cosine"}


def build_graph(papers: List[Dict[str, Any]], domain: str | None = None) -> Dict[str, Any]:
    return build_graph_tfidf_cosine(papers, domain=domain)
