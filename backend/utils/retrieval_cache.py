from __future__ import annotations

import hashlib
import time
from typing import Any, Dict, List, Optional, Tuple

# Simple in-process TTL cache (async-safe enough for single uvicorn worker / demo).
_TTL_SEC = 300.0
_STORE: Dict[str, Tuple[float, List[Dict[str, Any]]]] = {}


def _key(query: str) -> str:
    return hashlib.sha256((query or "").strip().encode("utf-8")).hexdigest()


def get_cached_papers(query: str) -> Optional[List[Dict[str, Any]]]:
    k = _key(query)
    ent = _STORE.get(k)
    if not ent:
        return None
    ts, papers = ent
    if time.time() - ts > _TTL_SEC:
        _STORE.pop(k, None)
        return None
    return [dict(p) for p in papers]


def set_cached_papers(query: str, papers: List[Dict[str, Any]]) -> None:
    k = _key(query)
    _STORE[k] = (time.time(), [dict(p) for p in papers])
