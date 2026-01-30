# SubLab MVP

Laboratorio de Voz - Comparación de TTS Local (Kokoro-82M) vs Cloud (Fish Audio)

## Quick Start

```bash
# Desde WSL terminal:
cd /path/to/sublab

# Construir y levantar
docker compose up --build

# Acceder a:
# - Frontend: http://localhost:5173
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
```

## Estructura

```
├── backend/          # FastAPI + Python
│   ├── app/
│   │   ├── services/tts/    # Kokoro (local) + Fish Audio (cloud)
│   │   ├── services/llm/    # OpenRouter (Gemini 2.0)
│   │   └── routers/         # API endpoints
│   └── weights/             # Modelos ONNX (descarga automática)
│
├── frontend/         # React + Vite + TypeScript
│   └── src/components/
│       ├── Chat/            # Interfaz de chat
│       └── Lab/             # Panel de configuración
│
└── docker-compose.yml
```

## API Endpoints

- `POST /api/chat/generate` - Chat con TTS
- `POST /api/chat/test-tts` - Probar TTS directo
- `POST /api/voice/clone` - Clonar voz
- `GET /api/voice/status` - Estado de proveedores
