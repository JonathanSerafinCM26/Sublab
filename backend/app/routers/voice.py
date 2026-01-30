from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional
import time

from app.services.tts import kokoro_service, fish_service


router = APIRouter()


class CloneVoiceResponse(BaseModel):
    """Response from voice cloning endpoint."""
    local_id: Optional[str] = None
    cloud_id: Optional[str] = None
    local_status: str = "pending"
    cloud_status: str = "pending"
    processing_time_local: Optional[float] = None
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
    audio: UploadFile = File(..., description="Audio file (WAV, ~10 seconds)"),
    voice_name: str = "coach_voice"
):
    """Clone a voice using both Local (Kokoro) and Cloud (Fish Audio) providers.
    
    This endpoint processes the uploaded audio file with both TTS engines
    to enable comparison testing.
    """
    # Read the audio data
    audio_data = await audio.read()
    
    response = CloneVoiceResponse()
    
    # Clone with Local (Kokoro)
    if kokoro_service.is_initialized:
        try:
            start = time.time()
            local_id = await kokoro_service.clone_voice(audio_data, voice_name)
            response.local_id = local_id
            response.local_status = "success"
            response.processing_time_local = time.time() - start
        except Exception as e:
            response.local_status = f"error: {str(e)}"
    else:
        response.local_status = "not_initialized"
    
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
    
    return response


@router.get("/voices")
async def list_voices():
    """List available voices from both providers."""
    voices = {
        "local": [],
        "cloud": [],
        "local_available": kokoro_service.is_initialized,
        "cloud_available": fish_service.is_configured
    }
    
    if kokoro_service.is_initialized:
        local_voices = await kokoro_service.get_available_voices()
        voices["local"] = [
            VoiceInfo(provider="kokoro", **v).model_dump() 
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
    """Get status of TTS providers."""
    return {
        "local": {
            "provider": "kokoro",
            "initialized": kokoro_service.is_initialized,
            "is_local": True,
            "cost": "$0.00",
            "privacy": "En Dispositivo"
        },
        "cloud": {
            "provider": "fish_audio",
            "configured": fish_service.is_configured,
            "is_local": False,
            "cost": "~$0.001/request",
            "privacy": "Enviado a API"
        }
    }
