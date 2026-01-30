import io
import os
from typing import AsyncGenerator, Optional
import soundfile as sf
import numpy as np

from app.services.tts.base import TTSService
from app.core.config import settings


class KokoroService(TTSService):
    """Local TTS service using Kokoro-82M ONNX model.
    
    Downloads model from HuggingFace if not present locally.
    """
    
    def __init__(self):
        self._kokoro = None
        self._is_initialized = False
        self._default_voice = "af_bella"
    
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
        import shutil
        
        model_path = os.path.join(settings.weights_path, "model.onnx")
        voices_path = os.path.join(settings.weights_path, "voices.npy")
        
        # Download model if not exists
        if not os.path.exists(model_path):
            print("📥 Downloading model.onnx from HuggingFace...")
            hf_hub_download(
                repo_id="onnx-community/Kokoro-82M-ONNX",
                filename="onnx/model.onnx",
                local_dir=settings.weights_path,
                local_dir_use_symlinks=False
            )
            onnx_folder = os.path.join(settings.weights_path, "onnx")
            if os.path.exists(os.path.join(onnx_folder, "model.onnx")):
                shutil.move(os.path.join(onnx_folder, "model.onnx"), model_path)
            print(f"✅ Model downloaded to: {model_path}")
        
        # Download and convert voice file if not exists
        if not os.path.exists(voices_path):
            print("📥 Downloading voice file from HuggingFace...")
            voices_dir = os.path.join(settings.weights_path, "voices")
            os.makedirs(voices_dir, exist_ok=True)
            
            # Download the voice file
            hf_hub_download(
                repo_id="onnx-community/Kokoro-82M-ONNX",
                filename="voices/af_bella.bin",
                local_dir=settings.weights_path,
                local_dir_use_symlinks=False
            )
            
            # Convert binary to proper numpy dict format
            bella_bin = os.path.join(voices_dir, "af_bella.bin")
            if os.path.exists(bella_bin):
                with open(bella_bin, 'rb') as f:
                    raw_data = f.read()
                # Convert to numpy array
                voice_arr = np.frombuffer(raw_data, dtype=np.float32)
                # Create voices dict with the embedding
                voices_dict = {'af_bella': voice_arr, 'default': voice_arr}
                np.save(voices_path, voices_dict, allow_pickle=True)
                print(f"✅ Voice converted and saved to: {voices_path}")
        
        return model_path, voices_path
    
    async def initialize(self):
        """Initialize the Kokoro ONNX model."""
        try:
            import onnxruntime
            
            # Ensure weights directory exists
            os.makedirs(settings.weights_path, exist_ok=True)
            
            # Download files if needed
            model_path, voices_path = await self._download_model_files()
            
            print(f"🔧 Loading Kokoro from: {model_path}")
            print(f"🔧 Using voices from: {voices_path}")
            
            # Load voices dict manually (since kokoro_onnx doesn't handle our format)
            voices_dict = np.load(voices_path, allow_pickle=True).item()
            
            # Create custom Kokoro wrapper
            self._session = onnxruntime.InferenceSession(model_path)
            self._voices = voices_dict
            self._sample_rate = 24000  # Kokoro default
            
            self._is_initialized = True
            print("✅ Kokoro TTS initialized successfully")
                
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
            # Get voice embedding
            if voice not in self._voices:
                voice = 'af_bella'  # Fallback to default
            voice_embedding = self._voices[voice]
            
            # Use kokoro_onnx for generation since it handles the ONNX inference
            from kokoro_onnx import Kokoro
            
            # We need to use the library properly - let's try direct approach
            # Create a temp voices file with our dict
            temp_voices = os.path.join(settings.weights_path, "temp_voices.npy")
            np.save(temp_voices, self._voices, allow_pickle=True)
            
            # Monkey-patch numpy.load to allow pickle
            original_load = np.load
            def patched_load(file, *args, **kwargs):
                kwargs['allow_pickle'] = True
                return original_load(file, *args, **kwargs)
            np.load = patched_load
            
            try:
                model_path = os.path.join(settings.weights_path, "model.onnx")
                kokoro = Kokoro(model_path, temp_voices)
                samples, sample_rate = kokoro.create(
                    text=text,
                    voice=voice,
                    speed=1.0,
                    lang="es"
                )
            finally:
                np.load = original_load  # Restore original
            
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
        """Generate audio stream using Kokoro TTS."""
        audio = await self.generate_audio(text, voice_id)
        yield audio
    
    async def clone_voice(
        self, 
        audio_data: bytes, 
        voice_name: str
    ) -> str:
        """Clone a voice from audio sample.
        
        Note: Kokoro-82M uses pre-defined style vectors, not true voice cloning.
        """
        if not self._is_initialized:
            raise RuntimeError("Kokoro TTS not initialized")
        
        os.makedirs(settings.voices_path, exist_ok=True)
        voice_path = os.path.join(settings.voices_path, f"{voice_name}_local.wav")
        with open(voice_path, "wb") as f:
            f.write(audio_data)
        
        print(f"📝 Saved reference audio to: {voice_path}")
        print(f"⚠️ Note: Kokoro uses pre-defined voices. Using default voice: {self._default_voice}")
        
        return self._default_voice
    
    async def get_available_voices(self) -> list[dict]:
        """Get available Kokoro voices."""
        return [
            {"id": "af_bella", "name": "Bella (Female)", "lang": "en", "gender": "female"},
        ]


# Global singleton instance
kokoro_service = KokoroService()
