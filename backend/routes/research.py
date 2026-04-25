from fastapi import APIRouter, HTTPException
from backend.models.schemas import ResearchRequest
from backend.orchestrator.pipeline import ResearchPipeline

router = APIRouter()

@router.post("/")
async def conduct_research(request: ResearchRequest):
    try:
        pipeline = ResearchPipeline()
        query = (request.query or "").strip()
        if not query and (request.project_title or request.project_description):
            query = "Generate research roadmap and decision support for the provided project."
        result = await pipeline.run(
            query=query,
            project_title=request.project_title,
            project_description=request.project_description,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
