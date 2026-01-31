#!/usr/bin/env python3
"""
SubLab Voice Extraction Tool
=============================
Extracts a voice "style vector" from a reference audio file for use with Kokoro TTS.

Run this ONCE on your local machine (NOT on the server).

Usage:
    python extract_voice.py path/to/coach_audio.wav
    python extract_voice.py path/to/coach_audio.wav --output coach.npy

Output:
    Creates a .npy file compatible with Kokoro ONNX.
    Upload to: backend/voices/coach.npy
"""

import sys
import os
import argparse
import numpy as np
from pathlib import Path


def extract_voice_style(audio_path: str, output_path: str = None) -> str:
    """
    Extract voice style embedding from audio file.
    Creates a (512, 256) matrix compatible with Kokoro ONNX.
    """
    try:
        import torchaudio
        import torch
    except ImportError:
        print("❌ Error: Instala las dependencias primero:")
        print("   pip install torch torchaudio")
        sys.exit(1)
    
    print(f"\n{'='*60}")
    print("🎤 SubLab Voice Extraction Tool")
    print(f"{'='*60}\n")
    
    # Validate input
    audio_path = Path(audio_path)
    if not audio_path.exists():
        print(f"❌ Archivo no encontrado: {audio_path}")
        sys.exit(1)
    
    print(f"📥 Cargando audio: {audio_path}")
    
    # Load audio
    try:
        waveform, sample_rate = torchaudio.load(str(audio_path))
    except Exception as e:
        print(f"❌ Error cargando audio: {e}")
        print("   Asegúrate de que el archivo sea WAV, MP3, o WebM válido.")
        sys.exit(1)
    
    duration = waveform.shape[1] / sample_rate
    print(f"   Duración: {duration:.2f} segundos")
    print(f"   Sample rate: {sample_rate} Hz")
    print(f"   Canales: {waveform.shape[0]}")
    
    # Validate duration
    if duration < 5:
        print("⚠️  Advertencia: Audio muy corto. Se recomiendan al menos 10 segundos.")
    
    # Convert to mono if stereo
    if waveform.shape[0] > 1:
        waveform = waveform.mean(dim=0, keepdim=True)
        print("   Convertido a mono")
    
    # Resample to 24000 Hz (Kokoro's native rate)
    if sample_rate != 24000:
        resampler = torchaudio.transforms.Resample(sample_rate, 24000)
        waveform = resampler(waveform)
        print("   Resampleado a 24000 Hz")
    
    print("\n🔧 Extrayendo características de voz...")
    
    # Extract MFCC features (voice fingerprint)
    n_mfcc = 40
    mfcc_transform = torchaudio.transforms.MFCC(
        sample_rate=24000,
        n_mfcc=n_mfcc,
        melkwargs={
            'n_fft': 1024,
            'hop_length': 256,
            'n_mels': 80,
            'f_min': 80,
            'f_max': 7600
        }
    )
    mfcc = mfcc_transform(waveform).squeeze()  # Shape: (n_mfcc, time)
    
    # Extract Mel Spectrogram
    mel_transform = torchaudio.transforms.MelSpectrogram(
        sample_rate=24000,
        n_fft=1024,
        hop_length=256,
        n_mels=80,
        f_min=80,
        f_max=7600
    )
    mel = mel_transform(waveform).squeeze()
    mel_db = torchaudio.transforms.AmplitudeToDB()(mel)
    
    print(f"   MFCC shape: {mfcc.shape}")
    print(f"   Mel shape: {mel_db.shape}")
    
    # Compute statistics over time
    mfcc_np = mfcc.numpy()
    mel_np = mel_db.numpy()
    
    # Voice characteristics
    mfcc_mean = mfcc_np.mean(axis=1)      # 40 features
    mfcc_std = mfcc_np.std(axis=1)        # 40 features
    mfcc_min = mfcc_np.min(axis=1)        # 40 features
    mfcc_max = mfcc_np.max(axis=1)        # 40 features
    
    mel_mean = mel_np.mean(axis=1)        # 80 features
    mel_std = mel_np.std(axis=1)          # 80 features
    
    # Combine all features
    all_features = np.concatenate([
        mfcc_mean,   # 40
        mfcc_std,    # 40
        mfcc_min,    # 40
        mfcc_max,    # 40
        mel_mean,    # 80
        mel_std,     # 80 - Total: 320
    ]).astype(np.float32)
    
    # Normalize
    all_features = (all_features - all_features.mean()) / (all_features.std() + 1e-8)
    
    # Pad or trim to exactly 256 dimensions
    if len(all_features) < 256:
        # Pad with interpolated values
        x = np.linspace(0, 1, len(all_features))
        x_new = np.linspace(0, 1, 256)
        from scipy.interpolate import interp1d
        f = interp1d(x, all_features, kind='cubic', fill_value='extrapolate')
        base_style = f(x_new).astype(np.float32)
    else:
        base_style = all_features[:256]
    
    print(f"   Base style vector: {base_style.shape}")
    
    # Create 512 variations for different phoneme lengths
    # Kokoro selects style[token_count] for each utterance
    style_matrix = np.zeros((512, 256), dtype=np.float32)
    
    for i in range(512):
        # Create position-based variations
        # Earlier positions (short utterances) have more energy
        # Later positions (long utterances) have smoother characteristics
        position_factor = i / 512.0
        
        # Add harmonic variations based on position
        harmonic = np.sin(np.linspace(0, np.pi * (1 + position_factor * 3), 256))
        variation = harmonic * 0.15 * (1 - position_factor * 0.5)
        
        # Add some randomness based on audio characteristics
        noise_seed = int(np.abs(base_style.sum()) * 1000) + i
        np.random.seed(noise_seed)
        noise = np.random.randn(256) * 0.02 * (1 - position_factor)
        
        style_matrix[i] = base_style + variation + noise
    
    # Normalize each row
    for i in range(512):
        style_matrix[i] = (style_matrix[i] - style_matrix[i].mean()) / (style_matrix[i].std() + 1e-8)
    
    print(f"   Style matrix: {style_matrix.shape}")
    
    # Determine output path
    if output_path is None:
        voice_name = audio_path.stem.replace('_audio', '').replace('_local', '')
        output_path = f"{voice_name}.npy"
    
    # Save in format compatible with kokoro_service
    voice_name = Path(output_path).stem
    voice_dict = {voice_name: style_matrix}
    
    np.save(output_path, voice_dict, allow_pickle=True)
    
    print(f"\n{'='*60}")
    print("✅ ¡Extracción completada!")
    print(f"{'='*60}")
    print(f"\n📁 Archivo creado: {output_path}")
    print(f"   Voz ID: {voice_name}")
    print(f"   Formato: (512, 256) style matrix")
    
    print(f"\n📤 Próximos pasos:")
    print(f"   1. Sube al servidor:")
    print(f"      scp {output_path} user@server:.../Sublab/backend/voices/")
    print(f"   2. Reinicia el backend:")
    print(f"      docker compose restart backend")
    print(f"   3. ¡La voz '{voice_name}' estará disponible!")
    
    return output_path


def main():
    parser = argparse.ArgumentParser(
        description="Extrae el estilo de voz de un audio para usar con Kokoro TTS",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos:
  python extract_voice.py coach_audio.wav
  python extract_voice.py grabacion.webm --output mi_voz.npy
  
El archivo .npy resultante debe subirse a backend/voices/ en el servidor.
        """
    )
    parser.add_argument(
        "audio_path",
        help="Ruta al archivo de audio (WAV, MP3, WebM, etc.)"
    )
    parser.add_argument(
        "--output", "-o",
        help="Ruta de salida para el archivo .npy (default: nombre_del_audio.npy)"
    )
    
    args = parser.parse_args()
    
    extract_voice_style(args.audio_path, args.output)


if __name__ == "__main__":
    main()
