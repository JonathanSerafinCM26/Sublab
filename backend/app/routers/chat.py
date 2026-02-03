from fastapi import APIRouter, HTTPException
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
from typing import Optional, Literal
import time
import io
import base64

from app.services.tts import tts_manager, xtts_service, fish_service
from app.services.llm import llm_service


router = APIRouter()


class ChatMessage(BaseModel):
    """Chat message request."""
    message: str
    voice_id: Optional[str] = None  # Specific voice to use (optional)
    include_audio: bool = True


class ChatResponse(BaseModel):
    """Chat response with text and metrics."""
    text: str
    provider: str
    metrics: dict


class TTSTestRequest(BaseModel):
    """TTS test request."""
    text: str
    voice_id: Optional[str] = None


@router.post("/generate")
async def generate_chat_response(request: ChatMessage):
    """Generate a chat response with optional TTS audio.
    
    Pipeline: Message → LLM → Text → TTS (Fish first, XTTS fallback) → Audio
    
    The TTS provider is selected automatically:
    1. Fish Audio (cloud) - if configured
    2. XTTS (local) - as fallback
    """
    metrics = {
        "llm_latency_ms": 0,
        "tts_latency_ms": 0,
        "total_latency_ms": 0,
        "provider": "auto",
        "provider_used": None,
        "cost": "TBD",
        "privacy": "TBD"
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
        print(f"🔊 TTS: Generating audio for text ({len(coach_response)} chars)...")
        
        try:
            # Use unified TTS manager (Fish first, XTTS fallback)
            audio_data, provider_used = await tts_manager.generate_audio(
                coach_response, 
                request.voice_id
            )
            
            metrics["tts_latency_ms"] = int((time.time() - tts_start) * 1000)
            metrics["provider_used"] = provider_used
            metrics["cost"] = "$0.00" if provider_used == "xtts-v2" else "~$0.001"
            metrics["privacy"] = "En Dispositivo" if provider_used == "xtts-v2" else "Enviado a API"
            
            if audio_data:
                print(f"✅ TTS: Audio generated! Size: {len(audio_data)} bytes, Provider: {provider_used}, Latency: {metrics['tts_latency_ms']}ms")
            else:
                print("⚠️ TTS: No audio data generated.")
            
        except Exception as e:
            print(f"❌ TTS error: {e}")
            import traceback
            traceback.print_exc()
            audio_data = None
            metrics["tts_error"] = str(e)
    
    metrics["total_latency_ms"] = int((time.time() - total_start) * 1000)
    
    # If audio was generated, return as base64
    if audio_data:
        audio_b64 = base64.b64encode(audio_data).decode("utf-8")
        print(f"📤 Sending response with audio (base64 length: {len(audio_b64)})")
        return {
            "text": coach_response,
            "audio": audio_b64,
            "audio_format": "wav",
            "provider": metrics["provider_used"],
            "metrics": metrics
        }
    
    print(f"📤 Sending response WITHOUT audio (TTS failed or not requested)")
    return ChatResponse(
        text=coach_response,
        provider="none",
        metrics=metrics
    )


@router.post("/test-tts")
async def test_tts(request: TTSTestRequest):
    """Test TTS generation directly (without LLM).
    
    Uses unified TTS manager (Fish first, XTTS fallback).
    Returns audio file for the given text.
    """
    start_time = time.time()
    
    try:
        audio_data, provider_used = await tts_manager.generate_audio(
            request.text, 
            request.voice_id
        )
        
        latency_ms = int((time.time() - start_time) * 1000)
        
        return Response(
            content=audio_data,
            media_type="audio/wav",
            headers={
                "X-TTS-Provider": provider_used,
                "X-TTS-Latency-Ms": str(latency_ms),
                "X-TTS-Cost": "$0.00" if provider_used == "xtts-v2" else "~$0.001"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compare")
async def compare_tts(text: str, voice_id: Optional[str] = None):
    """Compare TTS output from both providers.
    
    Generates audio from both Fish Audio and XTTS for comparison.
    """
    results = {
        "text": text,
        "fish": {"status": "pending", "latency_ms": 0},
        "xtts": {"status": "pending", "latency_ms": 0}
    }
    
    # Generate with Fish Audio
    if fish_service.is_configured:
        try:
            start = time.time()
            audio = await fish_service.generate_audio(text, voice_id)
            results["fish"] = {
                "status": "success",
                "latency_ms": int((time.time() - start) * 1000),
                "audio": base64.b64encode(audio).decode("utf-8"),
                "cost": "~$0.001",
                "privacy": "Enviado a API"
            }
        except Exception as e:
            results["fish"] = {"status": "error", "error": str(e)}
    else:
        results["fish"]["status"] = "not_configured"
    
    # Generate with XTTS
    if xtts_service.is_initialized:
        try:
            t0 = time.time()
            local_audio = await xtts_service.generate_audio(text, voice_id)
            t1 = time.time()
            results["xtts"] = {
                "provider": "xtts-v2",
                "time": f"{t1-t0:.2f}s",
                "audio_size": len(local_audio) if local_audio else 0,
                "audio": base64.b64encode(local_audio).decode("utf-8") if local_audio else None,
                "cost": "$0.00",
                "privacy": "En Dispositivo"
            }
        except Exception as e:
            results["xtts"] = {"error": str(e)}
    else:
        results["xtts"] = {"error": "XTTS Not initialized"}
    
    return results


@router.get("/tts-status")
async def get_tts_status():
    """Get TTS manager status and available providers."""
    return tts_manager.get_status()
