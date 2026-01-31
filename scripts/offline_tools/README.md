# SubLab Offline Voice Extraction Tool

This folder contains tools that run on your **local machine** (not the server).

## Purpose

Extract the "voice DNA" (style vector) from your coach's audio recording.
This is done ONCE, and the result is uploaded to the server.

## Quick Start

### Option 1: Run Locally (Python 3.10+)

```bash
cd scripts/offline_tools

# Install dependencies
pip install -r requirements.txt

# Extract voice from audio file
python extract_voice.py path/to/coach_recording.wav coach.pt
```

### Option 2: Google Colab (Free, No Setup)

1. Upload `extract_voice.py` to Google Colab
2. Upload your coach audio file
3. Run the cells
4. Download the generated `coach.npy` file

## Output Files

- `coach.pt` - PyTorch format
- `coach.npy` - NumPy format (compatible with Kokoro ONNX)

## Upload to Server

After extraction, upload to the server:

```bash
scp coach.npy user@server:/var/www/.../Sublab/backend/voices/coach.npy

# Restart backend
docker compose restart backend
```

The backend will automatically detect and use the custom voice.

## Audio Requirements

For best results, your coach audio should be:
- **Duration**: 10-30 seconds
- **Content**: Clear speech, ideally reading a script
- **Quality**: Clean audio, minimal background noise
- **Format**: WAV, MP3, or any format supported by torchaudio

## Sample Script to Read

Have your coach read this text clearly:

> "Hola, bienvenido a tu sesión de hoy. Estoy aquí para acompañarte en tu camino 
> hacia el bienestar. Juntos vamos a explorar tus pensamientos y emociones de 
> manera segura y compasiva. Recuerda que este es tu espacio, donde puedes 
> expresarte libremente sin juicio alguno."
