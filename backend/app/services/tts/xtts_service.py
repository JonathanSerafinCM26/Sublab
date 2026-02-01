import os
import asyncio
import hashlib
from pathlib import Path
from typing import Optional, List, Dict
import time
import shutil

class XTTSService:
    def __init__(self):
        self._model = None
        self._is_initialized = False
        self._voices_dir = Path("/app/voices/xtts")
        self._cache_dir = Path("/app/audio_cache/xtts")
        self._default_voice_path = None
        
    @property
    def is_initialized(self) -> bool:
        return self._is_initialized

    async def initialize(self):
        """Initialize XTTS model."""
        if self._is_initialized:
            return
            
        print("🔄 Initializing XTTS v2...")
        
        try:
            # Import inside function to avoid startup crash if not installed
            from TTS.api import TTS
            import torch
            
            # ----------------------------------------------------------------
            # FIX FOR PYTORCH 2.6+ (Weights Only Load Error)
            # ----------------------------------------------------------------
            # PyTorch 2.6 changed default weights_only=True which breaks Coqui TTS
            # We monkeypatch it to default to False safely
            if hasattr(torch, 'load'):
                _original_load = torch.load
                def _safe_load(*args, **kwargs):
                    if 'weights_only' not in kwargs:
                        kwargs['weights_only'] = False
                    return _original_load(*args, **kwargs)
                torch.load = _safe_load
            # ----------------------------------------------------------------
            
            # Create directories
            self._voices_dir.mkdir(parents=True, exist_ok=True)
            self._cache_dir.mkdir(parents=True, exist_ok=True)
            
            # Force CPU to avoid CUDA crashes/OOM on Docker for now
            device = "cpu"
            print(f"🖥️ Using device: {device}")
            
            # Initialize model (will download on first use)
            print("📥 Loading XTTS v2 model (this may take a while on first run)...")
            
            # Accept CPML license implicitly by using the library
            os.environ["COQUI_TOS_AGREED"] = "1"
            
            self._model = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
            
            # Set up a default speaker path
            # We need at least one valid audio file for cloning/inference
            # Copy a default one if not exists or use one from the library if possible
            # For now we'll assume the user will clone a voice or we use a hardcoded fallback if needed
            
            self._is_initialized = True
            print("✅ XTTS v2 initialized successfully")
            
        except ImportError as e:
            print(f"❌ XTTS not installed: {e}")
            print("   Install with: pip install TTS")
            self._is_initialized = False
            
        except Exception as e:
            print(f"❌ XTTS initialization error: {e}")
            import traceback
            traceback.print_exc()
            self._is_initialized = False

    async def generate_audio(self, text: str, voice_id: str = None) -> Optional[bytes]:
        """Generate audio from text using XTTS."""
        if not self._is_initialized:
            print("⚠️ XTTS not initialized")
            return None

        # Hash for caching
        param_str = f"{text}-{voice_id}-xtts-v2"
        audio_hash = hashlib.md5(param_str.encode()).hexdigest()
        cache_path = self._cache_dir / f"{audio_hash}.wav"
        
        if cache_path.exists():
            print("✨ Return cached audio")
            return cache_path.read_bytes()

        # Get voice reference
        ref_file = None
        
        if voice_id:
            voice_meta_path = self._voices_dir / voice_id / "metadata.json"
            if voice_meta_path.exists():
                import json
                with open(voice_meta_path) as f:
                    metadata = json.load(f)
                ref_file = metadata.get("reference_audio")
        
        if not ref_file or not os.path.exists(ref_file):
            print(f"⚠️ Voice {voice_id} not found or invalid, using fallback if available")
            # We strictly need a reference file for XTTS
            # Let's check if we have ANY voice in the voices dir
            existing_voices = list(self._voices_dir.glob("*/metadata.json"))
            if existing_voices:
                import json
                with open(existing_voices[0]) as f:
                    metadata = json.load(f)
                ref_file = metadata.get("reference_audio")
                print(f"⚠️ Using fallback voice: {existing_voices[0].parent.name}")
            else:
                 # If absolutely no voice is found, we can't generate with XTTS effectively without a ref file
                 # But TTS() might have default speakers. XTTS v2 usually NEEDS a reference wav.
                 print("❌ No reference audio available for XTTS. Please clone a voice first.")
                 return None

        print(f"🎙️ XTTS generating ({len(text)} chars) with voice ref: {Path(ref_file).name}")
        
        try:
            # Run inference in thread pool to not block
            # XTTS to_file api
            
            start_time = time.time()
            
            temp_output = self._cache_dir / f"temp_{audio_hash}.wav"
            
            await asyncio.to_thread(
                self._model.tts_to_file,
                text=text,
                speaker_wav=ref_file,
                language="es",
                file_path=str(temp_output)
            )
            
            elapsed = time.time() - start_time
            print(f"✅ Audio generated in {elapsed:.2f}s")
            
            # Move to final cache
            if temp_output.exists():
                shutil.move(str(temp_output), str(cache_path))
                return cache_path.read_bytes()
                
        except Exception as e:
            print(f"❌ XTTS generation error: {e}")
            import traceback
            traceback.print_exc()
            return None

    async def clone_voice(self, audio_path: str, voice_id: str, reference_text: str = "") -> Dict:
        """Process a voice sample for cloning (XTTS doesn't need training, just storing the sample)."""
        if not self._is_initialized:
            raise RuntimeError("XTTS not initialized")
            
        print(f"🧬 Cloning voice: {voice_id}")
        
        voice_dir = self._voices_dir / voice_id
        voice_dir.mkdir(parents=True, exist_ok=True)
        
        # Save reference audio (convert/copy to voice dir)
        # XTTS works best with WAV. We'll just copy it for now.
        target_audio_path = voice_dir / "reference.wav"
        shutil.copy2(audio_path, target_audio_path)
        
        # Metadata
        import json
        metadata = {
            "voice_id": voice_id,
            "reference_audio": str(target_audio_path),
            "created_at": time.time(),
            "provider": "xtts-v2"
        }
        
        with open(voice_dir / "metadata.json", "w") as f:
            json.dump(metadata, f, indent=2)
            
        return metadata

    def get_available_voices(self) -> List[Dict]:
        """List available local voices."""
        voices = []
        if not self._voices_dir.exists():
            return voices
            
        for voice_dir in self._voices_dir.iterdir():
            if voice_dir.is_dir() and (voice_dir / "metadata.json").exists():
                try:
                    import json
                    with open(voice_dir / "metadata.json") as f:
                        meta = json.load(f)
                    voices.append({
                        "id": meta.get("voice_id", voice_dir.name),
                        "name": meta.get("voice_id", voice_dir.name),
                        "preview_url": meta.get("reference_audio"),
                        "model": "xtts-v2"
                    })
                except Exception:
                    continue
        return voices

# Global instance
xtts_service = XTTSService()
