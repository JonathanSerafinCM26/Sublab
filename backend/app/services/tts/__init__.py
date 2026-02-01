# TTS Services
from .base import TTSService

# Kokoro ONNX - DISABLED (only English voices, no real cloning)
# from .kokoro_service import kokoro_service, KokoroService

# F5-TTS - Local voice cloning with Spanish support
# from .f5_service import f5_service, F5TTSService
from .xtts_service import xtts_service

from .fish_service import fish_service, FishAudioService

__all__ = [
    "TTSService",
    # "kokoro_service",  # Disabled
    # "KokoroService",   # Disabled
    "F5TTSService",
    "fish_service",
    "FishAudioService"
]
