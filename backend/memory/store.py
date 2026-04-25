from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Optional
from datetime import datetime
import uuid

from backend.config.settings import settings


class MemoryStore:
    """
    Simple JSONL persistence for hackathon -> production path.
    Each run stored as one JSON file under DATA_DIR/memory/.
    """
    def __init__(self, base_dir: Optional[Path] = None):
        self.base_dir = base_dir or settings.DATA_DIR
        self.dir = Path(self.base_dir) / "memory"
        self.dir.mkdir(parents=True, exist_ok=True)

    def save_run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        run_id = payload.get("run_id") or str(uuid.uuid4())
        now = datetime.utcnow().isoformat() + "Z"
        record = {**payload, "run_id": run_id, "saved_at": now}
        path = self.dir / f"{run_id}.json"
        path.write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8")
        return {"run_id": run_id, "path": str(path)}

    def load_run(self, run_id: str) -> Optional[Dict[str, Any]]:
        path = self.dir / f"{run_id}.json"
        if not path.exists():
            return None
        return json.loads(path.read_text(encoding="utf-8"))

