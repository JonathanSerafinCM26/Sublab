from abc import ABC, abstractmethod
from typing import AsyncGenerator, Optional


class TTSService(ABC):
    """Abstract base class for TTS services (Strategy Pattern)."""
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return the provider name."""
        pass
    
    @property
    @abstractmethod
    def is_local(self) -> bool:
        """Return True if this is a local (private) TTS service."""
        pass
    
    @abstractmethod
    async def generate_audio(
        self, 
        text: str, 
        voice_id: Optional[str] = None
    ) -> bytes:
        """Generate audio from text.
        
        Args:
            text: Text to synthesize
            voice_id: Optional voice identifier
            
        Returns:
            Audio bytes (WAV format)
        """
        pass
    
    @abstractmethod
    async def generate_stream(
        self, 
        text: str, 
        voice_id: Optional[str] = None
    ) -> AsyncGenerator[bytes, None]:
        """Generate audio stream from text.
        
        Args:
            text: Text to synthesize
            voice_id: Optional voice identifier
            
        Yields:
            Audio chunks
        """
        pass
    
    @abstractmethod
    async def clone_voice(
        self, 
        audio_data: bytes, 
        voice_name: str
    ) -> str:
        """Clone a voice from audio sample.
        
        Args:
            audio_data: Audio bytes (WAV format, ~10s)
            voice_name: Name for the cloned voice
            
        Returns:
            Voice ID or path
        """
        pass
    
    @abstractmethod
    async def get_available_voices(self) -> list[dict]:
        """Get list of available voices.
        
        Returns:
            List of voice info dicts
        """
        pass
