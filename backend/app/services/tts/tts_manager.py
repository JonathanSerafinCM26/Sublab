"""
Unified TTS Manager - Fish Audio first with XTTS fallback.

This manager provides a single interface for TTS generation,
automatically selecting the best available provider.
"""
import os
import json
from pathlib import Path
from typing import Optional, Dict, Any

from app.services.tts.fish_service import fish_service
from app.core.config import settings


class TTSManager:
    """Unified TTS manager with automatic provider selection."""
    
    def __init__(self):
        self._config_path = Path(settings.voices_path) / "tts_config.json"
        self._default_voice_id: Optional[str] = None
        self._active_provider: Optional[str] = None
        self._load_config()
    
    def _load_config(self):
        """Load TTS configuration from file."""
        if self._config_path.exists():
            try:
                with open(self._config_path) as f:
                    config = json.load(f)
                self._default_voice_id = config.get("default_voice_id")
                print(f"📋 TTS Config loaded: default_voice={self._default_voice_id}")
            except Exception as e:
                print(f"⚠️ Failed to load TTS config: {e}")
    
    def _save_config(self):
        """Save TTS configuration to file."""
        try:
            self._config_path.parent.mkdir(parents=True, exist_ok=True)
            config = {
                "default_voice_id": self._default_voice_id,
            }
            with open(self._config_path, "w") as f:
                json.dump(config, f, indent=2)
            print(f"💾 TTS Config saved: default_voice={self._default_voice_id}")
        except Exception as e:
            print(f"⚠️ Failed to save TTS config: {e}")
    
    @property
    def default_voice_id(self) -> Optional[str]:
        return self._default_voice_id
    
    @property
    def active_provider(self) -> Optional[str]:
        return self._active_provider
    
    def set_default_voice(self, voice_id: str):
        """Set the default voice ID for TTS generation."""
        self._default_voice_id = voice_id
        self._save_config()
    
    def get_status(self) -> Dict[str, Any]:
        """Get status of all TTS providers."""
        return {
            "fish_audio": {
                "configured": fish_service.is_configured,
                "is_default": True,
                "provider": "fish_audio"
            },
            "default_voice_id": self._default_voice_id,
            "last_provider_used": self._active_provider
        }
    
    async def generate_audio(
        self, 
        text: str, 
        voice_id: Optional[str] = None
    ) -> tuple[bytes, str]:
        """
        Generate audio using Fish Audio.
        
        Returns:
            Tuple of (audio_bytes, provider_used)
        """
        # Use provided voice_id or fall back to default
        effective_voice_id = voice_id or self._default_voice_id
        
        # Strategy: Fish Audio
        if fish_service.is_configured:
            try:
                print(f"🐟 Trying Fish Audio (voice: {effective_voice_id or 'default'})...")
                audio = await fish_service.generate_audio(text, effective_voice_id)
                self._active_provider = "fish_audio"
                print(f"✅ Fish Audio success! ({len(audio)} bytes)")
                return audio, "fish_audio"
            except Exception as e:
                print(f"⚠️ Fish Audio failed: {e}")
                raise RuntimeError(f"TTS provider failed: {e}")
        
        raise RuntimeError("No TTS provider available. Configure Fish Audio API key.")
    
    async def clone_voice(
        self,
        audio_data: bytes,
        voice_name: str
    ) -> Dict[str, Any]:
        """
        Clone a voice using Fish Audio.
        
        Returns metadata about the cloned voice.
        """
        result = {
            "voice_name": voice_name,
            "fish": {"status": "pending"}
        }
        
        # Priority: Clone with Fish Audio
        if fish_service.is_configured:
            try:
                print(f"🐟 Cloning voice '{voice_name}' with Fish Audio...")
                fish_voice_id = await fish_service.clone_voice(audio_data, voice_name)
                result["fish"] = {
                    "status": "success",
                    "voice_id": fish_voice_id
                }
                # Set as default voice
                self.set_default_voice(fish_voice_id)
                print(f"✅ Fish Audio clone success! ID: {fish_voice_id}")
            except Exception as e:
                print(f"⚠️ Fish Audio clone failed: {e}")
                result["fish"] = {"status": "error", "error": str(e)}
        else:
            result["fish"] = {"status": "not_configured"}
        
        return result
    
    async def get_available_voices(self) -> Dict[str, list]:
        """Get all available voices from Fish Audio."""
        voices = {
            "fish": [],
            "default_voice_id": self._default_voice_id
        }
        
        # Fish Audio voices
        if fish_service.is_configured:
            try:
                fish_voices = await fish_service.get_available_voices()
                voices["fish"] = fish_voices
            except Exception as e:
                print(f"⚠️ Failed to get Fish voices: {e}")
        
        return voices


# Global singleton
tts_manager = TTSManager()
