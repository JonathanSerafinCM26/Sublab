import io
import os
from typing import AsyncGenerator, Optional
import soundfile as sf
import numpy as np

from app.services.tts.base import TTSService
from app.core.config import settings


class KokoroService(TTSService):
    """Local TTS service using Kokoro-82M ONNX model.
    
    Downloads model from HuggingFace (hexgrad/Kokoro-82M) if not present locally.
    Requires: kokoro-v0_19.onnx and voices.bin files.
    """
    
    def __init__(self):
        self._kokoro = None
        self._is_initialized = False
        self._default_voice = "af_heart"  # Default Kokoro voice
    
    @property
    def provider_name(self) -> str:
        return "kokoro"
    
    @property
    def is_local(self) -> bool:
        return True
    
    @property
    def is_initialized(self) -> bool:
        return self._is_initialized
    
    async def _download_model_files(self) -> tuple[str, str]:
        """Download ONNX model files from HuggingFace if not present."""
        from huggingface_hub import hf_hub_download
        
        model_path = os.path.join(settings.weights_path, "kokoro-v0_19.onnx")
        voices_path = os.path.join(settings.weights_path, "voices.bin")
        
        # Download model if not exists
        if not os.path.exists(model_path):
            print("📥 Downloading kokoro-v0_19.onnx from HuggingFace...")
            downloaded_model = hf_hub_download(
                repo_id="hexgrad/Kokoro-82M",
                filename="kokoro-v0_19.onnx",
                local_dir=settings.weights_path,
                local_dir_use_symlinks=False
            )
            print(f"✅ Model downloaded to: {downloaded_model}")
        
        # Download voices if not exists
        if not os.path.exists(voices_path):
            print("📥 Downloading voices.bin from HuggingFace...")
            downloaded_voices = hf_hub_download(
                repo_id="hexgrad/Kokoro-82M",
                filename="voices.bin",
                local_dir=settings.weights_path,
                local_dir_use_symlinks=False
            )
            print(f"✅ Voices downloaded to: {downloaded_voices}")
        
        return model_path, voices_path
    
    async def initialize(self):
        """Initialize the Kokoro ONNX model."""
        try:
            from kokoro_onnx import Kokoro
            
            # Ensure weights directory exists
            os.makedirs(settings.weights_path, exist_ok=True)
            
            # Download files if needed
            model_path, voices_path = await self._download_model_files()
            
            # Load the model
            print(f"🔧 Loading Kokoro from: {model_path}")
            self._kokoro = Kokoro(model_path, voices_path)
            self._is_initialized = True
            print("✅ Kokoro TTS initialized successfully")
                
        except ImportError as e:
            print(f"❌ Kokoro import error: {e}")
            print("   Install with: pip install kokoro-onnx")
            self._is_initialized = False
        except Exception as e:
            print(f"❌ Kokoro initialization error: {e}")
            import traceback
            traceback.print_exc()
            self._is_initialized = False
    
    async def generate_audio(
        self, 
        text: str, 
        voice_id: Optional[str] = None
    ) -> bytes:
        """Generate audio using Kokoro TTS."""
        if not self._is_initialized:
            raise RuntimeError("Kokoro TTS not initialized. Check if model files are downloaded.")
        
        voice = voice_id or self._default_voice
        
        try:
            # Generate audio - Kokoro returns (samples, sample_rate)
            samples, sample_rate = self._kokoro.create(
                text=text,
                voice=voice,
                speed=1.0,
                lang="es"  # Spanish
            )
            
            # Convert to WAV bytes
            buffer = io.BytesIO()
            sf.write(buffer, samples, sample_rate, format='WAV')
            buffer.seek(0)
            
            return buffer.read()
        except Exception as e:
            print(f"❌ Kokoro generation error: {e}")
            raise
    
    async def generate_stream(
        self, 
        text: str, 
        voice_id: Optional[str] = None
    ) -> AsyncGenerator[bytes, None]:
        """Generate audio stream using Kokoro TTS.
        
        Note: Kokoro doesn't support native streaming, so we generate
        the full audio and yield it as a single chunk.
        """
        audio = await self.generate_audio(text, voice_id)
        yield audio
    
    async def clone_voice(
        self, 
        audio_data: bytes, 
        voice_name: str
    ) -> str:
        """Clone a voice from audio sample.
        
        Note: Kokoro-82M uses pre-defined style vectors, not true voice cloning.
        This method saves the audio for reference and returns a default voice.
        For actual voice cloning, use Fish Audio.
        """
        if not self._is_initialized:
            raise RuntimeError("Kokoro TTS not initialized")
        
        # Save the reference audio for future use
        os.makedirs(settings.voices_path, exist_ok=True)
        voice_path = os.path.join(settings.voices_path, f"{voice_name}_local.wav")
        with open(voice_path, "wb") as f:
            f.write(audio_data)
        
        print(f"📝 Saved reference audio to: {voice_path}")
        print(f"⚠️ Note: Kokoro uses pre-defined voices. Using default voice: {self._default_voice}")
        
        # Return the default voice ID (Kokoro doesn't support true cloning)
        return self._default_voice
    
    async def get_available_voices(self) -> list[dict]:
        """Get available Kokoro voices."""
        # Kokoro built-in voices (from the voices.bin file)
        return [
            {"id": "af_heart", "name": "Heart (Female)", "lang": "en", "gender": "female"},
            {"id": "af_bella", "name": "Bella (Female)", "lang": "en", "gender": "female"},
            {"id": "af_nicole", "name": "Nicole (Female)", "lang": "en", "gender": "female"},
            {"id": "af_sarah", "name": "Sarah (Female)", "lang": "en", "gender": "female"},
            {"id": "af_sky", "name": "Sky (Female)", "lang": "en", "gender": "female"},
            {"id": "am_adam", "name": "Adam (Male)", "lang": "en", "gender": "male"},
            {"id": "am_michael", "name": "Michael (Male)", "lang": "en", "gender": "male"},
            {"id": "bf_emma", "name": "Emma (Female British)", "lang": "en-gb", "gender": "female"},
            {"id": "bf_isabella", "name": "Isabella (Female British)", "lang": "en-gb", "gender": "female"},
            {"id": "bm_george", "name": "George (Male British)", "lang": "en-gb", "gender": "male"},
            {"id": "bm_lewis", "name": "Lewis (Male British)", "lang": "en-gb", "gender": "male"},
        ]


# Global singleton instance
kokoro_service = KokoroService()
