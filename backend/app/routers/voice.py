from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional, Any
import time

# from app.services.tts import f5_service
from app.services.tts import fish_service
from app.services.tts import xtts_service


router = APIRouter()


class LocalCloneResponse(BaseModel):
    """Details for local voice cloning response."""
    status: str = "pending"
    message: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None
    processing_time: Optional[float] = None


class CloneVoiceResponse(BaseModel):
    """Response from voice cloning endpoint."""
    local: LocalCloneResponse = LocalCloneResponse()
    cloud_id: Optional[str] = None
    cloud_status: str = "pending"
    processing_time_cloud: Optional[float] = None


class VoiceInfo(BaseModel):
    """Voice information."""
    id: str
    name: str
    provider: str
    lang: Optional[str] = None
    gender: Optional[str] = None


@router.post("/clone", response_model=CloneVoiceResponse)
async def clone_voice(
    audio: UploadFile = File(..., description="Audio file (WAV, ~10-15 seconds for voice cloning)"),
    voice_name: str = "coach_voice"
):
    """Clone a voice using both Local (XTTS-v2) and Cloud (Fish Audio) providers.
    
    This endpoint processes the uploaded audio file with both TTS engines
    to enable comparison testing.
    
    XTTS-v2 requires ~10-15 seconds of clear audio for best results.
    """
    # Read and save audio temporarily
    audio_data = await audio.read()
    
    # Save to temp file for XTTS-v2
    import tempfile
    import os
    
    temp_path = None
    response = CloneVoiceResponse()
    
    try:
        # Save audio to temp file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(audio_data)
            temp_path = f.name
        
        # Clone with Local (XTTS v2)
        if xtts_service.is_initialized:
            try:
                start = time.time()
                result = await xtts_service.clone_voice(
                    audio_path=temp_path,
                    voice_id=voice_name
                )
                elapsed = time.time() - start
                response.local.status = "success"
                response.local.message = f"Clonado en {elapsed:.2f}s"
                response.local.metadata = result
                response.local.processing_time = elapsed
            except Exception as e:
                response.local.status = "error"
                response.local.message = str(e)
            
        else:
            response.local.status = "error"
            response.local.message = "XTTS no inicializado"
        
        # Clone with Cloud (Fish Audio)
        if fish_service.is_configured:
            try:
                start = time.time()
                cloud_id = await fish_service.clone_voice(audio_data, voice_name)
                response.cloud_id = cloud_id
                response.cloud_status = "success"
                response.processing_time_cloud = time.time() - start
            except Exception as e:
                response.cloud_status = f"error: {str(e)}"
        else:
            response.cloud_status = "not_configured"
    
    finally:
        # Clean up temp file
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
    
    return response


@router.get("/voices")
async def list_voices():
    """List available voices from both providers."""
    voices = {"local": [], "cloud": []}
    
    # Local Voices (XTTS includes cloned)
    if xtts_service.is_initialized:
        local_voices = xtts_service.get_available_voices()
        voices["local"] = [
            VoiceInfo(provider="xtts-v2", **v).model_dump() 
            for v in local_voices
        ]
    
    if fish_service.is_configured:
        cloud_voices = await fish_service.get_available_voices()
        voices["cloud"] = [
            VoiceInfo(provider="fish_audio", **v).model_dump() 
            for v in cloud_voices
        ]
    
    return voices


@router.get("/status")
async def get_status():
    """Get status of TTS providers including available voices."""
    local_voices = []
    local_voices = []
    if xtts_service.is_initialized:
        local_voices = xtts_service.get_available_voices()
    
    return {
        "local": {
            "provider": "xtts-v2",
            "initialized": xtts_service.is_initialized,
            "is_local": True,
            "cost": "$0.00",
            "privacy": "En Dispositivo",
            "supports_cloning": True,
            "voices": local_voices
        },
        "cloud": {
            "provider": "fish_audio",
            "configured": fish_service.is_configured,
            "is_local": False,
            "cost": "~$0.001/request",
            "privacy": "Enviado a API",
            "supports_cloning": True
        }
    }
