from fastapi import APIRouter, HTTPException
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
from typing import Optional, Literal
import time
import io

from app.services.tts import kokoro_service, fish_service
from app.services.llm import llm_service


router = APIRouter()


class ChatMessage(BaseModel):
    """Chat message request."""
    message: str
    provider: Literal["local", "cloud"] = "cloud"
    voice_id: Optional[str] = None
    include_audio: bool = True


class ChatResponse(BaseModel):
    """Chat response with text and metrics."""
    text: str
    provider: str
    metrics: dict


class TTSTestRequest(BaseModel):
    """TTS test request."""
    text: str
    provider: Literal["local", "cloud"] = "cloud"
    voice_id: Optional[str] = None


@router.post("/generate")
async def generate_chat_response(request: ChatMessage):
    """Generate a chat response with optional TTS audio.
    
    Pipeline: Message → LLM → Text → TTS → Audio
    """
    metrics = {
        "llm_latency_ms": 0,
        "tts_latency_ms": 0,
        "total_latency_ms": 0,
        "provider": request.provider,
        "cost": "$0.00" if request.provider == "local" else "~$0.001",
        "privacy": "En Dispositivo" if request.provider == "local" else "Enviado a API"
    }
    
    total_start = time.time()
    
    # Step 1: Get LLM response
    llm_start = time.time()
    try:
        coach_response = await llm_service.get_response(request.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")
    
    metrics["llm_latency_ms"] = int((time.time() - llm_start) * 1000)
    
    # Step 2: Generate TTS audio if requested
    audio_data = None
    if request.include_audio:
        tts_start = time.time()
        
        try:
            if request.provider == "local":
                if not kokoro_service.is_initialized:
                    raise HTTPException(status_code=503, detail="Kokoro TTS not initialized")
                audio_data = await kokoro_service.generate_audio(
                    coach_response, 
                    request.voice_id
                )
            else:  # cloud
                if not fish_service.is_configured:
                    raise HTTPException(status_code=503, detail="Fish Audio not configured")
                audio_data = await fish_service.generate_audio(
                    coach_response,
                    request.voice_id
                )
            
            metrics["tts_latency_ms"] = int((time.time() - tts_start) * 1000)
            
        except Exception as e:
            print(f"TTS error: {e}")
            # Continue without audio
            audio_data = None
            metrics["tts_error"] = str(e)
    
    metrics["total_latency_ms"] = int((time.time() - total_start) * 1000)
    
    # If audio was generated, return as multipart or base64
    if audio_data:
        import base64
        return {
            "text": coach_response,
            "audio": base64.b64encode(audio_data).decode("utf-8"),
            "audio_format": "wav",
            "provider": request.provider,
            "metrics": metrics
        }
    
    return ChatResponse(
        text=coach_response,
        provider=request.provider,
        metrics=metrics
    )


@router.post("/test-tts")
async def test_tts(request: TTSTestRequest):
    """Test TTS generation directly (without LLM).
    
    Returns audio file for the given text.
    """
    start_time = time.time()
    
    try:
        if request.provider == "local":
            if not kokoro_service.is_initialized:
                raise HTTPException(
                    status_code=503, 
                    detail="Kokoro TTS not initialized. Model files may be downloading."
                )
            audio_data = await kokoro_service.generate_audio(
                request.text, 
                request.voice_id
            )
        else:  # cloud
            if not fish_service.is_configured:
                raise HTTPException(
                    status_code=503, 
                    detail="Fish Audio API key not configured"
                )
            audio_data = await fish_service.generate_audio(
                request.text,
                request.voice_id
            )
        
        latency_ms = int((time.time() - start_time) * 1000)
        
        return Response(
            content=audio_data,
            media_type="audio/wav",
            headers={
                "X-TTS-Provider": request.provider,
                "X-TTS-Latency-Ms": str(latency_ms),
                "X-TTS-Cost": "$0.00" if request.provider == "local" else "~$0.001"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compare")
async def compare_tts(text: str, voice_id: Optional[str] = None):
    """Compare TTS output from both providers.
    
    Generates audio from both Local and Cloud providers for comparison.
    """
    results = {
        "text": text,
        "local": {"status": "pending", "latency_ms": 0},
        "cloud": {"status": "pending", "latency_ms": 0}
    }
    
    import base64
    
    # Generate with Local (Kokoro)
    if kokoro_service.is_initialized:
        try:
            start = time.time()
            audio = await kokoro_service.generate_audio(text, voice_id)
            results["local"] = {
                "status": "success",
                "latency_ms": int((time.time() - start) * 1000),
                "audio": base64.b64encode(audio).decode("utf-8"),
                "cost": "$0.00",
                "privacy": "En Dispositivo"
            }
        except Exception as e:
            results["local"] = {"status": "error", "error": str(e)}
    else:
        results["local"]["status"] = "not_initialized"
    
    # Generate with Cloud (Fish Audio)
    if fish_service.is_configured:
        try:
            start = time.time()
            audio = await fish_service.generate_audio(text, voice_id)
            results["cloud"] = {
                "status": "success",
                "latency_ms": int((time.time() - start) * 1000),
                "audio": base64.b64encode(audio).decode("utf-8"),
                "cost": "~$0.001",
                "privacy": "Enviado a API"
            }
        except Exception as e:
            results["cloud"] = {"status": "error", "error": str(e)}
    else:
        results["cloud"]["status"] = "not_configured"
    
    return results
