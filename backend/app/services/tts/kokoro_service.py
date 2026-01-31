import io
import os
from typing import AsyncGenerator, Optional
import soundfile as sf
import numpy as np

from app.services.tts.base import TTSService
from app.core.config import settings


class KokoroService(TTSService):
    """Local TTS service using Kokoro-82M ONNX model with direct ONNX inference."""
    
    SAMPLE_RATE = 24000
    
    def __init__(self):
        self._session = None
        self._voices = None
        self._tokenizer = None
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
            
            hf_hub_download(
                repo_id="onnx-community/Kokoro-82M-ONNX",
                filename="voices/af_bella.bin",
                local_dir=settings.weights_path,
                local_dir_use_symlinks=False
            )
            
            bella_bin = os.path.join(voices_dir, "af_bella.bin")
            if os.path.exists(bella_bin):
                with open(bella_bin, 'rb') as f:
                    raw_data = f.read()
                voice_arr = np.frombuffer(raw_data, dtype=np.float32)
                # Reshape to (512, 256) - 512 style embeddings of 256 dims each
                voice_reshaped = voice_arr.reshape(512, 256)
                voices_dict = {'af_bella': voice_reshaped}
                np.save(voices_path, voices_dict, allow_pickle=True)
                print(f"✅ Voice converted (shape: {voice_reshaped.shape}) to: {voices_path}")
        
        return model_path, voices_path
    
    def _phonemize(self, text: str, lang: str = "es") -> str:
        """Convert text to phonemes using espeak."""
        try:
            from phonemizer import phonemize
            from phonemizer.backend import EspeakBackend
            
            phonemes = phonemize(
                text,
                language=lang if lang != "es" else "es",
                backend='espeak',
                strip=True,
                preserve_punctuation=True,
                with_stress=True
            )
            return phonemes
        except Exception as e:
            print(f"Phonemizer error: {e}, using simple fallback")
            # Simple fallback - just return text as-is
            return text
    
    def _text_to_tokens(self, phonemes: str) -> np.ndarray:
        """Convert phonemes to token IDs."""
        # Simple character-to-token mapping
        # Kokoro uses a specific vocabulary, we'll use ASCII codes as approximation
        tokens = [ord(c) % 256 for c in phonemes]
        return np.array([tokens], dtype=np.int64)
    
    async def initialize(self):
        """Initialize the Kokoro ONNX model."""
        try:
            import onnxruntime as ort
            
            os.makedirs(settings.weights_path, exist_ok=True)
            model_path, voices_path = await self._download_model_files()
            
            print(f"🔧 Loading ONNX model from: {model_path}")
            self._session = ort.InferenceSession(model_path)
            
            print(f"🔧 Loading voices from: {voices_path}")
            voices_data = np.load(voices_path, allow_pickle=True)
            if isinstance(voices_data, np.ndarray) and voices_data.shape == ():
                self._voices = voices_data.item()
            else:
                self._voices = voices_data
            
            print(f"🔧 Available voices: {list(self._voices.keys())}")
            
            # Initialize phonemizer
            try:
                from phonemizer.backend import EspeakBackend
                EspeakBackend.version()
                print("✅ Phonemizer ready")
            except Exception as e:
                print(f"⚠️ Phonemizer not available: {e}")
            
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
        """Generate audio using direct ONNX inference."""
        if not self._is_initialized:
            raise RuntimeError("Kokoro TTS not initialized")
        
        voice_name = voice_id or self._default_voice
        
        try:
            # Get voice embedding
            voice_data = self._voices.get(voice_name, self._voices.get('af_bella'))
            
            # Phonemize text
            phonemes = self._phonemize(text, "es")
            
            # Convert to tokens
            tokens = self._text_to_tokens(phonemes)
            num_tokens = min(tokens.shape[1], 511)  # Max 511 to stay within 512 styles
            
            # Select style based on token length (as kokoro does)
            style = voice_data[num_tokens:num_tokens+1, :].astype(np.float32)
            
            # Prepare inputs
            inputs = {
                'input_ids': tokens,
                'style': style,
                'speed': np.array([1.0], dtype=np.float32)
            }
            
            # Run inference
            output = self._session.run(None, inputs)
            samples = output[0].squeeze()
            
            # Convert to WAV bytes
            buffer = io.BytesIO()
            sf.write(buffer, samples, self.SAMPLE_RATE, format='WAV')
            buffer.seek(0)
            
            return buffer.read()
            
        except Exception as e:
            print(f"❌ Kokoro generation error: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    async def generate_stream(
        self, 
        text: str, 
        voice_id: Optional[str] = None
    ) -> AsyncGenerator[bytes, None]:
        """Generate audio stream."""
        audio = await self.generate_audio(text, voice_id)
        yield audio
    
    async def clone_voice(
        self, 
        audio_data: bytes, 
        voice_name: str
    ) -> str:
        """Clone a voice from audio sample."""
        if not self._is_initialized:
            raise RuntimeError("Kokoro TTS not initialized")
        
        os.makedirs(settings.voices_path, exist_ok=True)
        voice_path = os.path.join(settings.voices_path, f"{voice_name}_local.wav")
        with open(voice_path, "wb") as f:
            f.write(audio_data)
        
        print(f"📝 Saved reference audio to: {voice_path}")
        return self._default_voice
    
    async def get_available_voices(self) -> list[dict]:
        """Get available Kokoro voices."""
        return [
            {"id": "af_bella", "name": "Bella (Female)", "lang": "en", "gender": "female"},
        ]


# Global singleton instance
kokoro_service = KokoroService()
