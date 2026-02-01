import io
import os
from typing import AsyncGenerator, Optional
import soundfile as sf
import numpy as np

from app.services.tts.base import TTSService
from app.core.config import settings


# Patch numpy.load at module level to handle pickled dicts
_original_np_load = np.load
def _patched_np_load(file, *args, **kwargs):
    kwargs['allow_pickle'] = True
    result = _original_np_load(file, *args, **kwargs)
    if isinstance(result, np.ndarray) and result.shape == () and hasattr(result, 'item'):
        item = result.item()
        if isinstance(item, dict):
            return item
    return result
np.load = _patched_np_load


class KokoroService(TTSService):
    """Local TTS service using Kokoro-82M ONNX model with direct ONNX inference."""
    
    SAMPLE_RATE = 24000
    
    def __init__(self):
        self._session = None
        self._voices = None
        self._tokenizer = None
        self._is_initialized = False
        self._default_voice = "af_bella"  # English female voice (Spanish voices not available in ONNX)
    
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
        
        # Voice files to download from Kokoro 82M ONNX
        # Note: ONNX version only has these two voices
        voice_files = [
            "af_bella",    # American English female (default)
            "am_adam",     # American English male
        ]
        
        voices_dir = os.path.join(settings.weights_path, "voices")
        os.makedirs(voices_dir, exist_ok=True)
        
        voices_dict = {}
        
        for voice_name in voice_files:
            voice_bin = os.path.join(voices_dir, f"{voice_name}.bin")
            
            if not os.path.exists(voice_bin):
                print(f"📥 Downloading {voice_name}.bin from HuggingFace...")
                try:
                    hf_hub_download(
                        repo_id="onnx-community/Kokoro-82M-ONNX",
                        filename=f"voices/{voice_name}.bin",
                        local_dir=settings.weights_path,
                        local_dir_use_symlinks=False
                    )
                except Exception as e:
                    print(f"⚠️ Could not download {voice_name}: {e}")
                    continue
            
            if os.path.exists(voice_bin):
                try:
                    with open(voice_bin, 'rb') as f:
                        raw_data = f.read()
                    voice_arr = np.frombuffer(raw_data, dtype=np.float32)
                    voice_reshaped = voice_arr.reshape(512, 256)
                    voices_dict[voice_name] = voice_reshaped
                    print(f"✅ Loaded voice: {voice_name}")
                except Exception as e:
                    print(f"⚠️ Error loading {voice_name}: {e}")
        
        # Save all voices to single npy file
        if voices_dict:
            np.save(voices_path, voices_dict, allow_pickle=True)
            print(f"✅ Voices saved to: {voices_path}")
        
        return model_path, voices_path

    
    def _load_custom_voices(self):
        """Load custom voice files from the voices/ folder."""
        if not os.path.exists(settings.voices_path):
            return
        
        # Look for .npy files in voices folder
        for filename in os.listdir(settings.voices_path):
            if filename.endswith('.npy'):
                voice_name = filename.replace('.npy', '')
                voice_path = os.path.join(settings.voices_path, filename)
                
                try:
                    voice_data = np.load(voice_path, allow_pickle=True)
                    
                    # Handle different formats
                    if isinstance(voice_data, np.ndarray) and voice_data.shape == ():
                        voice_data = voice_data.item()
                    
                    if isinstance(voice_data, dict):
                        # If it's a dict, add all voices from it
                        for key, value in voice_data.items():
                            if isinstance(value, np.ndarray) and value.shape == (512, 256):
                                self._voices[key] = value
                                print(f"🎤 Loaded custom voice: {key} from {filename}")
                    elif isinstance(voice_data, np.ndarray) and voice_data.shape == (512, 256):
                        # Direct array format
                        self._voices[voice_name] = voice_data
                        print(f"🎤 Loaded custom voice: {voice_name}")
                        
                except Exception as e:
                    print(f"⚠️ Could not load voice {filename}: {e}")
    
    async def initialize(self):
        """Initialize the Kokoro ONNX model."""
        try:
            import onnxruntime as ort
            from kokoro_onnx.tokenizer import Tokenizer
            
            os.makedirs(settings.weights_path, exist_ok=True)
            os.makedirs(settings.voices_path, exist_ok=True)
            
            model_path, voices_path = await self._download_model_files()
            
            print(f"🔧 Loading ONNX model from: {model_path}")
            self._session = ort.InferenceSession(model_path)
            
            print(f"🔧 Loading default voices from: {voices_path}")
            self._voices = np.load(voices_path, allow_pickle=True)
            if isinstance(self._voices, np.ndarray) and self._voices.shape == ():
                self._voices = self._voices.item()
            
            # Load custom voices from voices/ folder
            self._load_custom_voices()
            
            print(f"🔧 Available voices: {list(self._voices.keys())}")
            
            # Use kokoro_onnx's tokenizer
            self._tokenizer = Tokenizer()
            print("✅ Tokenizer ready")
            
            self._is_initialized = True
            print("✅ Kokoro TTS initialized successfully")
                
        except Exception as e:
            print(f"❌ Kokoro initialization error: {e}")
            import traceback
            traceback.print_exc()
            self._is_initialized = False
    
    def _split_text_into_chunks(self, text: str, max_chars: int = 350) -> list[str]:
        """Split text into chunks that fit within phoneme limits.
        
        Splits on sentence boundaries (. ! ?) when possible,
        otherwise splits on word boundaries.
        """
        import re
        
        # If text is short enough, return as-is
        if len(text) <= max_chars:
            return [text]
        
        chunks = []
        
        # Split by sentences first
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        current_chunk = ""
        for sentence in sentences:
            # If adding this sentence would exceed limit
            if len(current_chunk) + len(sentence) + 1 > max_chars:
                # Save current chunk if not empty
                if current_chunk.strip():
                    chunks.append(current_chunk.strip())
                
                # If sentence itself is too long, split by words
                if len(sentence) > max_chars:
                    words = sentence.split()
                    current_chunk = ""
                    for word in words:
                        if len(current_chunk) + len(word) + 1 > max_chars:
                            if current_chunk.strip():
                                chunks.append(current_chunk.strip())
                            current_chunk = word
                        else:
                            current_chunk += " " + word if current_chunk else word
                else:
                    current_chunk = sentence
            else:
                current_chunk += " " + sentence if current_chunk else sentence
        
        # Don't forget the last chunk
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        return chunks
    
    async def generate_audio(
        self, 
        text: str, 
        voice_id: Optional[str] = None
    ) -> bytes:
        """Generate audio using direct ONNX inference with kokoro tokenizer."""
        if not self._is_initialized:
            raise RuntimeError("Kokoro TTS not initialized")
        
        voice_name = voice_id or self._default_voice
        
        try:
            # Get voice embedding (512, 256)
            voice_data = self._voices.get(voice_name, self._voices.get('af_bella'))
            
            # Split text into chunks to avoid phoneme limit
            chunks = self._split_text_into_chunks(text)
            
            all_samples = []
            
            for chunk in chunks:
                # Phonemize and tokenize using kokoro's tokenizer
                # Use 'es' for Spanish (espeak language code)
                phonemes = self._tokenizer.phonemize(chunk, "es")
                tokens = self._tokenizer.tokenize(phonemes)
                
                # Select style based on token length
                num_tokens = min(len(tokens), 511)
                style = voice_data[num_tokens:num_tokens+1, :].astype(np.float32)
                
                # Prepare inputs with correct types
                input_ids = np.array([tokens], dtype=np.int64)
                
                inputs = {
                    'input_ids': input_ids,
                    'style': style,
                    'speed': np.array([1.0], dtype=np.float32)
                }
                
                # Run inference
                output = self._session.run(None, inputs)
                samples = output[0].squeeze()
                all_samples.append(samples)
            
            # Concatenate all audio chunks
            if len(all_samples) > 1:
                combined_samples = np.concatenate(all_samples)
            else:
                combined_samples = all_samples[0]
            
            # Convert to WAV bytes
            buffer = io.BytesIO()
            sf.write(buffer, combined_samples, self.SAMPLE_RATE, format='WAV')
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
        """Get available Kokoro voices including custom ones."""
        voices = []
        
        # Add default voice info
        default_voices = {
            "af_bella": {"name": "Bella (Female)", "lang": "en", "gender": "female"},
        }
        
        if self._voices:
            for voice_id in self._voices.keys():
                if voice_id in default_voices:
                    info = default_voices[voice_id]
                    voices.append({
                        "id": voice_id,
                        "name": info["name"],
                        "lang": info["lang"],
                        "gender": info["gender"],
                        "custom": False
                    })
                else:
                    # Custom voice
                    voices.append({
                        "id": voice_id,
                        "name": f"{voice_id.replace('_', ' ').title()} (Custom)",
                        "lang": "es",
                        "gender": "unknown",
                        "custom": True
                    })
        else:
            voices.append({
                "id": "af_bella",
                "name": "Bella (Female)",
                "lang": "en", 
                "gender": "female",
                "custom": False
            })
        
        return voices


# Global singleton instance
kokoro_service = KokoroService()
