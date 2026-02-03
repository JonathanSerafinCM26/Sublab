from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional, Any
import time

from app.services.tts import tts_manager, fish_service, xtts_service


router = APIRouter()


class CloneVoiceResponse(BaseModel):
    """Response from voice cloning endpoint."""
    voice_name: str
    fish: dict = {}
    xtts: dict = {}
    default_voice_id: Optional[str] = None
    processing_time: Optional[float] = None


class VoiceInfo(BaseModel):
    """Voice information."""
    id: str
    name: str
    provider: str
    lang: Optional[str] = None
    gender: Optional[str] = None


class SetDefaultVoiceRequest(BaseModel):
    """Request to set the default voice."""
    voice_id: str


@router.post("/clone", response_model=CloneVoiceResponse)
async def clone_voice(
    audio: UploadFile = File(..., description="Audio file (WAV, ~10-15 seconds for voice cloning)"),
    voice_name: str = "coach_voice"
):
    """Clone a voice using Fish Audio (primary) and XTTS (backup).
    
    This endpoint processes the uploaded audio file with both TTS engines.
    Fish Audio is used as the primary provider for voice cloning.
    The cloned voice will automatically become the default voice.
    
    Requirements:
    - WAV format recommended
    - ~10-15 seconds of clear audio for best results
    - Single speaker, minimal background noise
    """
    start_time = time.time()
    
    # Read audio data
    audio_data = await audio.read()
    
    try:
        # Use unified TTS manager for cloning
        result = await tts_manager.clone_voice(audio_data, voice_name)
        
        processing_time = time.time() - start_time
        
        return CloneVoiceResponse(
            voice_name=voice_name,
            fish=result.get("fish", {}),
            xtts=result.get("xtts", {}),
            default_voice_id=tts_manager.default_voice_id,
            processing_time=processing_time
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/voices")
async def list_voices():
    """List available voices from all providers.
    
    Returns voices from Fish Audio and XTTS, along with the current default voice.
    """
    try:
        voices = await tts_manager.get_available_voices()
        return {
            "voices": voices,
            "default_voice_id": tts_manager.default_voice_id,
            "providers": {
                "fish_audio": {
                    "configured": fish_service.is_configured,
                    "is_primary": True
                },
                "xtts": {
                    "initialized": xtts_service.is_initialized,
                    "is_fallback": True
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/set-default")
async def set_default_voice(request: SetDefaultVoiceRequest):
    """Set the default voice for TTS generation.
    
    The voice_id can be:
    - A Fish Audio reference_id (from cloning)
    - An XTTS voice directory name
    """
    try:
        tts_manager.set_default_voice(request.voice_id)
        return {
            "success": True,
            "default_voice_id": tts_manager.default_voice_id,
            "message": f"Default voice set to: {request.voice_id}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/default")
async def get_default_voice():
    """Get the current default voice ID."""
    return {
        "default_voice_id": tts_manager.default_voice_id
    }


@router.get("/status")
async def get_status():
    """Get status of TTS providers including available voices."""
    status = tts_manager.get_status()
    
    # Add more details
    local_voices = []
    if xtts_service.is_initialized:
        local_voices = xtts_service.get_available_voices()
    
    return {
        "tts_manager": status,
        "local": {
            "provider": "xtts-v2",
            "initialized": xtts_service.is_initialized,
            "is_fallback": True,
            "cost": "$0.00",
            "privacy": "En Dispositivo",
            "supports_cloning": True,
            "voices": local_voices
        },
        "cloud": {
            "provider": "fish_audio",
            "configured": fish_service.is_configured,
            "is_primary": True,
            "cost": "~$0.001/request",
            "privacy": "Enviado a API",
            "supports_cloning": True
        }
    }


class SetApiKeyRequest(BaseModel):
    """Request to set Fish Audio API key."""
    api_key: str


@router.get("/api-key/status")
async def get_api_key_status():
    """Get the current Fish Audio API key status (without revealing the full key)."""
    return fish_service.get_api_key_status()


@router.post("/api-key")
async def set_api_key(request: SetApiKeyRequest):
    """Set the Fish Audio API key.
    
    The key is persisted to a config file and will survive server restarts.
    """
    if not request.api_key or len(request.api_key) < 10:
        raise HTTPException(status_code=400, detail="API key must be at least 10 characters")
    
    try:
        fish_service.set_api_key(request.api_key)
        return {
            "success": True,
            "message": "API key configurada exitosamente",
            "status": fish_service.get_api_key_status()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
