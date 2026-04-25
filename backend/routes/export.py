from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from backend.memory.store import MemoryStore
from backend.utils.report_generator import generate_pdf_report

router = APIRouter()


@router.post("/", response_class=Response)
async def export_report(payload: dict):
    """
    Body can be:
    - {"run_id": "..."} to export a previous run
    - or a full research result payload to export directly
    """
    store = MemoryStore()
    run_id = payload.get("run_id")
    if run_id:
        record = store.load_run(run_id)
        if not record:
            raise HTTPException(status_code=404, detail="run_id not found")
        pdf_bytes = generate_pdf_report(record)
        return Response(content=pdf_bytes, media_type="application/pdf", headers={
            "Content-Disposition": f'attachment; filename="research-report-{run_id}.pdf"'
        })

    if not payload.get("final_answer"):
        raise HTTPException(status_code=400, detail="Provide run_id or full result payload")
    pdf_bytes = generate_pdf_report(payload)
    return Response(content=pdf_bytes, media_type="application/pdf", headers={
        "Content-Disposition": 'attachment; filename="research-report.pdf"'
    })

