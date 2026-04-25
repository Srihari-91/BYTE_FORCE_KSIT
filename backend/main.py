from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import research
from backend.routes import export
import uvicorn

app = FastAPI(title="AI Research War Room API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(research.router, prefix="/api/research", tags=["Research"])
app.include_router(export.router, prefix="/api/export", tags=["Export"])

@app.get("/")
async def root():
    return {"message": "Welcome to the AI Research War Room API", "status": "active"}

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
    #done
