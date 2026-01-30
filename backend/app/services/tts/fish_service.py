import io
import os
from typing import AsyncGenerator, Optional
import httpx

from app.services.tts.base import TTSService
from app.core.config import settings


class FishAudioService(TTSService):
    """Cloud TTS service using Fish Audio API."""
    
    BASE_URL = "https://api.fish.audio/v1"
    
    def __init__(self):
        self._api_key = settings.fish_audio_api_key
        self._default_voice = None  # Will be set after cloning
        self._cloned_voices: dict[str, str] = {}  # name -> reference_id
    
    @property
    def provider_name(self) -> str:
        return "fish_audio"
    
    @property
    def is_local(self) -> bool:
        return False
    
    @property
    def is_configured(self) -> bool:
        return bool(self._api_key)
    
    def _get_headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json"
        }
    
    async def generate_audio(
        self, 
        text: str, 
        voice_id: Optional[str] = None
    ) -> bytes:
        """Generate audio using Fish Audio API."""
        if not self.is_configured:
            raise RuntimeError("Fish Audio API key not configured")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            payload = {
                "text": text,
                "format": "wav",
                "latency": "normal"  # Can be: balanced, normal, high_quality
            }
            
            # Use reference_id if provided
            if voice_id:
                payload["reference_id"] = voice_id
            
            response = await client.post(
                f"{self.BASE_URL}/tts",
                headers=self._get_headers(),
                json=payload
            )
            
            if response.status_code != 200:
                raise Exception(f"Fish Audio API error: {response.status_code} - {response.text}")
            
            return response.content
    
    async def generate_stream(
        self, 
        text: str, 
        voice_id: Optional[str] = None
    ) -> AsyncGenerator[bytes, None]:
        """Generate audio stream using Fish Audio API."""
        if not self.is_configured:
            raise RuntimeError("Fish Audio API key not configured")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            payload = {
                "text": text,
                "format": "wav",
                "latency": "balanced"  # Use balanced for streaming
            }
            
            if voice_id:
                payload["reference_id"] = voice_id
            
            async with client.stream(
                "POST",
                f"{self.BASE_URL}/tts",
                headers=self._get_headers(),
                json=payload
            ) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    raise Exception(f"Fish Audio API error: {response.status_code} - {error_text}")
                
                async for chunk in response.aiter_bytes(chunk_size=4096):
                    yield chunk
    
    async def clone_voice(
        self, 
        audio_data: bytes, 
        voice_name: str
    ) -> str:
        """Clone a voice using Fish Audio API.
        
        Args:
            audio_data: Audio bytes (WAV format, ~10s)
            voice_name: Name for the cloned voice
            
        Returns:
            Fish Audio reference_id
        """
        if not self.is_configured:
            raise RuntimeError("Fish Audio API key not configured")
        
        # Save reference audio locally
        voice_path = os.path.join(settings.voices_path, f"{voice_name}_fish.wav")
        with open(voice_path, "wb") as f:
            f.write(audio_data)
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            # Upload audio for voice cloning
            files = {
                "voice": (f"{voice_name}.wav", audio_data, "audio/wav")
            }
            data = {
                "name": voice_name,
                "description": f"Cloned voice for SubLab: {voice_name}"
            }
            
            headers = {"Authorization": f"Bearer {self._api_key}"}
            
            response = await client.post(
                f"{self.BASE_URL}/voice/clone",
                headers=headers,
                files=files,
                data=data
            )
            
            if response.status_code != 200:
                # If cloning fails, we can still use the audio as reference
                # by uploading it and getting back an ID
                print(f"⚠️ Voice cloning response: {response.status_code} - {response.text}")
                
                # Try alternative: use the audio as inline reference
                # For Fish Audio, we might need to use a different endpoint
                # For now, return a placeholder
                reference_id = f"local_{voice_name}"
            else:
                result = response.json()
                reference_id = result.get("reference_id", result.get("id", f"ref_{voice_name}"))
            
            # Store the mapping
            self._cloned_voices[voice_name] = reference_id
            self._default_voice = reference_id
            
            return reference_id
    
    async def get_available_voices(self) -> list[dict]:
        """Get available Fish Audio voices (cloned ones)."""
        voices = []
        for name, ref_id in self._cloned_voices.items():
            voices.append({
                "id": ref_id,
                "name": name,
                "provider": "fish_audio"
            })
        return voices


# Global singleton instance
fish_service = FishAudioService()
