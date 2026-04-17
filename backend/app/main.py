from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.routers import voice, chat

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan handler - load models at startup."""
    print("��� Starting SubLab MVP...")
    print("☁️ Using cloud-based AI services...")
    yield

    # Cleanup
    print("��� Shutting down SubLab MVP...")

app = FastAPI(
    title=settings.project_name,
    version=settings.version,
    lifespan=lifespan
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure directories exist
os.makedirs(settings.audio_cache_path, exist_ok=True)
os.makedirs(settings.weights_path, exist_ok=True)
os.makedirs(settings.voices_path, exist_ok=True)
os.makedirs(settings.upload_path, exist_ok=True)

# Mount materials as static files
materials_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "Material")
app.mount("/api/v1/materials", StaticFiles(directory=materials_dir), name="materials")

# Include routers
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(voice.router, prefix="/api/v1/voice", tags=["voice"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.version}
