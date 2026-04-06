"""
AI Classroom Assistant - FastAPI Backend
Entry point for the server
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.connection import connect_to_mongo, close_mongo_connection
from routes.tasks import router as tasks_router
from routes.auth import router as auth_router

# Initialize FastAPI app
app = FastAPI(
    title="AI Classroom Assistant API",
    description="Real-time speech-to-task AI backend",
    version="1.0.0"
)

# ─── CORS (Allow frontend to talk to backend) ─────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # In production, restrict to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Register Routes ───────────────────────────────────────────────────────────
app.include_router(auth_router,  prefix="/auth",  tags=["Authentication"])
app.include_router(tasks_router, prefix="/tasks", tags=["Tasks"])

# ─── MongoDB Lifecycle ─────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Root"])
async def root():
    return {
        "status": "running",
        "message": "AI Classroom Assistant API is live!",
        "docs": "/docs"
    }

# ─── Process Text Endpoint (shortcut) ─────────────────────────────────────────
# The main NLP processing endpoint is at POST /tasks/process-text
# This is also accessible here for convenience
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
