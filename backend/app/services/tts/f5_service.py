# F5-TTS Service - Local voice cloning with Spanish support
# Based on: https://github.com/SWivid/F5-TTS

import os
import io
import hashlib
import asyncio
from pathlib import Path
from typing import Optional
import time

from .base import TTSService


class F5TTSService(TTSService):
    """
    F5-TTS Local TTS with real voice cloning.
    
    Features:
    - Real voice cloning with 10-15 seconds of audio
    - Spanish support with fine-tuned model
    - Zero-shot cloning (no training required)
    - Works on CPU (slower) or GPU (faster)
    """
    
    SAMPLE_RATE = 24000
    
    def __init__(self):
        self._model = None
        self._is_initialized = False
        self._default_voice = None
        self._voices_dir = Path("/app/voices/f5tts")
        self._cache_dir = Path("/app/audio_cache/f5tts")
        
    @property
    def provider_name(self) -> str:
        return "F5-TTS (Local)"
    
    @property
    def is_local(self) -> bool:
        return True
    
    @property
    def is_initialized(self) -> bool:
        return self._is_initialized
    
    @property
    def is_configured(self) -> bool:
        return True  # No API key needed
    
    async def initialize(self):
        """Initialize F5-TTS model."""
        if self._is_initialized:
            return
            
        print("🔄 Initializing F5-TTS...")
        
        try:
            # Import inside function to avoid startup crash if not installed
            from f5_tts.api import F5TTS
            
            # Create directories
            self._voices_dir.mkdir(parents=True, exist_ok=True)
            self._cache_dir.mkdir(parents=True, exist_ok=True)
            
            # Initialize model (will download on first use)
            print("📥 Loading F5-TTS model (this may take a while on first run)...")
            
            # F5TTS() uses default model automatically
            self._model = F5TTS()
            
            self._is_initialized = True
            print("✅ F5-TTS initialized successfully")
            
        except ImportError as e:
            print(f"❌ F5-TTS not installed: {e}")
            print("   Install with: pip install f5-tts")
            self._is_initialized = False
            
        except Exception as e:
            print(f"❌ F5-TTS initialization error: {e}")
            import traceback
            traceback.print_exc()
            self._is_initialized = False
    
    async def clone_voice(
        self,
        audio_path: str,
        voice_id: str,
        reference_text: Optional[str] = None
    ) -> dict:
        """
        Clone a voice from reference audio.
        
        Args:
            audio_path: Path to reference audio (10-15 seconds recommended)
            voice_id: Unique identifier for this voice
            reference_text: Transcription of the audio (auto-transcribed if None)
            
        Returns:
            dict with voice_id, status, and metadata
        """
        if not self._is_initialized:
            raise RuntimeError("F5-TTS not initialized")
        
        start_time = time.time()
        
        # Create voice directory
        voice_dir = self._voices_dir / voice_id
        voice_dir.mkdir(parents=True, exist_ok=True)
        
        # Copy reference audio
        import shutil
        ref_audio_path = voice_dir / "reference.wav"
        
        # Convert to WAV if needed
        await self._convert_to_wav(audio_path, str(ref_audio_path))
        
        # Auto-transcribe if no text provided
        if not reference_text:
            print(f"🎤 Auto-transcribing reference audio...")
            # F5-TTS can auto-transcribe, but we can also use Whisper
            reference_text = ""  # Empty string = auto-transcribe
        
        # Save metadata
        import json
        metadata = {
            "voice_id": voice_id,
            "reference_audio": str(ref_audio_path),
            "reference_text": reference_text,
            "created_at": time.time()
        }
        
        with open(voice_dir / "metadata.json", "w") as f:
            json.dump(metadata, f, indent=2)
        
        processing_time = time.time() - start_time
        
        print(f"✅ Voice cloned: {voice_id} in {processing_time:.2f}s")
        
        return {
            "voice_id": voice_id,
            "status": "completed",
            "processing_time": processing_time,
            "metadata": metadata
        }
    
    async def generate_audio(
        self,
        text: str,
        voice_id: Optional[str] = None
    ) -> bytes:
        """
        Generate audio using cloned voice or default.
        
        Args:
            text: Text to synthesize (Spanish supported)
            voice_id: Voice to use (None = default English demo voice)
            
        Returns:
            Audio bytes (WAV format)
        """
        if not self._is_initialized:
            raise RuntimeError("F5-TTS not initialized")
        
        start_time = time.time()
        
        # Check cache
        cache_key = f"{text}:{voice_id}"
        cache_hash = hashlib.md5(cache_key.encode()).hexdigest()
        cache_path = self._cache_dir / f"{cache_hash}.wav"
        
        if cache_path.exists():
            print(f"✅ F5-TTS cache hit: {cache_hash[:8]}")
            return cache_path.read_bytes()
        
        # Get voice reference
        ref_file = None
        ref_text = ""
        
        if voice_id:
            voice_meta_path = self._voices_dir / voice_id / "metadata.json"
            if voice_meta_path.exists():
                import json
                with open(voice_meta_path) as f:
                    metadata = json.load(f)
                ref_file = metadata.get("reference_audio")
                ref_text = metadata.get("reference_text", "")
        
        # Use built-in example if no custom voice
        if not ref_file:
            from importlib.resources import files
            ref_file = str(files("f5_tts").joinpath("infer/examples/basic/basic_ref_en.wav"))
            ref_text = "some call me nature, others call me mother nature."
        
        print(f"🎙️ F5-TTS generating ({len(text)} chars) with voice: {voice_id or 'default'}")
        
        try:
            # Run inference in thread pool to not block
            wav, sr, _ = await asyncio.to_thread(
                self._model.infer,
                ref_file=ref_file,
                ref_text=ref_text,
                gen_text=text,
                seed=None
            )
            
            # Convert to bytes
            import soundfile as sf
            buffer = io.BytesIO()
            sf.write(buffer, wav, sr, format='WAV')
            buffer.seek(0)
            audio_bytes = buffer.read()
            
            # Save to cache
            cache_path.write_bytes(audio_bytes)
            
            processing_time = time.time() - start_time
            print(f"✅ F5-TTS generated in {processing_time:.2f}s ({len(audio_bytes)} bytes)")
            
            return audio_bytes
            
        except Exception as e:
            print(f"❌ F5-TTS generation error: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    async def generate_stream(
        self,
        text: str,
        voice_id: Optional[str] = None
    ):
        """Stream audio generation (F5-TTS doesn't support streaming natively)."""
        # Generate full audio and yield as single chunk
        audio = await self.generate_audio(text, voice_id)
        yield audio
    
    async def _convert_to_wav(self, input_path: str, output_path: str):
        """Convert audio file to WAV format."""
        from pydub import AudioSegment
        
        audio = AudioSegment.from_file(input_path)
        audio = audio.set_frame_rate(self.SAMPLE_RATE)
        audio = audio.set_channels(1)
        audio.export(output_path, format="wav")
    
    def get_available_voices(self) -> list:
        """List all cloned voices."""
        voices = []
        
        if self._voices_dir.exists():
            for voice_dir in self._voices_dir.iterdir():
                if voice_dir.is_dir():
                    meta_path = voice_dir / "metadata.json"
                    if meta_path.exists():
                        import json
                        with open(meta_path) as f:
                            metadata = json.load(f)
                        voices.append({
                            "id": voice_dir.name,
                            "name": voice_dir.name,
                            "lang": "es",
                            "custom": True,
                            "created_at": metadata.get("created_at")
                        })
        
        return voices


# Global instance
f5_service = F5TTSService()
