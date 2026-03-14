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

## Deploy en Plesk (Docker + Nginx)

### 1) Preparar entorno de producción

```bash
cd /ruta/a/Sublab
cp .env.prod.example .env
# Edita .env con tus claves y contraseñas reales
```

### 2) Levantar stack sin choques de puertos

Este proyecto incluye `docker-compose.prod.yml` con puertos ligados a `127.0.0.1` para no exponer ni chocar con otros contenedores:

- Frontend contenedor (nginx): `127.0.0.1:${SUBLAB_FRONTEND_PORT}` (por defecto 5180)
- Backend API: `127.0.0.1:${SUBLAB_BACKEND_PORT}` (por defecto 8580)
- Postgres solo interno (sin `ports`, usa `expose`)

```bash
docker compose -f docker-compose.prod.yml down --remove-orphans
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
```

### 3) Configurar Nginx en Plesk (dominio)

En Plesk > Domains > tu dominio > Apache & Nginx Settings > **Additional nginx directives**, añade:

```nginx
location / {
	proxy_pass http://127.0.0.1:5180;
	proxy_http_version 1.1;
	proxy_set_header Host $host;
	proxy_set_header X-Real-IP $remote_addr;
	proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	proxy_set_header X-Forwarded-Proto $scheme;
}

location /api/ {
	proxy_pass http://127.0.0.1:8580/api/;
	proxy_http_version 1.1;
	proxy_set_header Host $host;
	proxy_set_header X-Real-IP $remote_addr;
	proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	proxy_set_header X-Forwarded-Proto $scheme;
}

location /audio/ {
	proxy_pass http://127.0.0.1:8580/audio/;
	proxy_http_version 1.1;
	proxy_set_header Host $host;
	proxy_set_header X-Real-IP $remote_addr;
	proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	proxy_set_header X-Forwarded-Proto $scheme;
}
```

Si cambias `SUBLAB_FRONTEND_PORT` o `SUBLAB_BACKEND_PORT` en `.env`, actualiza también esos puertos en Plesk.

### 4) Error `No such image: sublab-frontend:latest`

Si aparece ese error al hacer `up`, normalmente hay estado viejo de compose/imágenes huérfanas. Ejecuta:

```bash
docker compose -f docker-compose.prod.yml down --remove-orphans
docker image rm -f sublab-frontend:latest sublab-backend:latest || true
docker compose -f docker-compose.prod.yml build frontend backend
docker image ls | grep sublab
docker compose -f docker-compose.prod.yml up -d --force-recreate
```

También se añadió `image: sublab-frontend:latest` y `image: sublab-backend:latest` al `docker-compose.yml` para mantener tags explícitos.

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
