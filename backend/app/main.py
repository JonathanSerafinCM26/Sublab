from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.routers import voice, chat
from app.services.tts.xtts_service import xtts_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan handler - load models at startup."""
    print("🚀 Starting SubLab MVP...")
    
    # Initialize XTTS v2 (load model once)
    try:
        await xtts_service.initialize()
        print("✅ XTTS v2 initialized (Spanish voice cloning ready)")
    except Exception as e:
        print(f"⚠️ XTTS v2 not available: {e}")
        print("   TTS will use fallback")
    
    yield
    
    # Cleanup
    print("👋 Shutting down SubLab MVP...")


app = FastAPI(
    title="SubLab MVP",
    description="Voice Laboratory - Compare Local TTS (XTTS v2) vs Cloud TTS (Fish Audio)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories if they don't exist
os.makedirs(settings.voices_path, exist_ok=True)
os.makedirs(settings.audio_cache_path, exist_ok=True)

# Static files for audio
app.mount("/audio", StaticFiles(directory=settings.audio_cache_path), name="audio")

# Include routers
app.include_router(voice.router, prefix="/api/voice", tags=["Voice"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "SubLab MVP - Voice Laboratory",
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "xtts_available": xtts_service.is_initialized,
        "fish_audio_configured": bool(settings.fish_audio_api_key)
    }
