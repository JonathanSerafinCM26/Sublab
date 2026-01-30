PLAN MAESTRO DE INGENIERÍA: SUBLAB MVP (Hybrid Architecture)Versión: 1.2Objetivo: Desarrollar un MVP funcional (PWA) con arquitectura de "Laboratorio de Voz" que permita comparar en tiempo real un motor TTS Local (Kokoro-82M) frente a un motor Cloud (Fish Audio).Prioridad: Viabilidad técnica, medición de latencia y demostración de Privacidad vs Calidad.0. CONTEXTO Y MISIÓN DEL PROYECTO (LEER PRIMERO)Hola Agente, bienvenido a SubLab.Antes de escribir una sola línea de código, necesitas entender qué estamos construyendo y por qué.¿Qué es SubLab?Es una aplicación de "Entrenamiento del Subconsciente". El núcleo del producto es un Coach Digital con el que el usuario conversa para tratar temas sensibles (ansiedad, bienestar). Por la naturaleza de estos datos, la privacidad es crítica.El Problema Técnico (El "Triángulo Imposible")El cliente necesita una voz sintética (TTS) que cumpla tres requisitos difíciles de combinar:Calidad Humana: Debe transmitir emoción (no sonar robótica).Baja Latencia: Debe responder casi al instante.Costo Cero / Privacidad Local: Debe correr en un servidor pequeño (CPU) sin pagar APIs costosas por minuto.Tu Misión: El "Laboratorio de Voz"Como la tecnología local perfecta es difícil de lograr en CPU, hemos decidido implementar una Arquitectura Híbrida para que el cliente tome la decisión final basándose en pruebas reales. Implementarás dos "motores" que competirán entre sí:El Aspirante Local (Kokoro-82M):Qué es: Un modelo TTS revolucionario y ligero (solo 82 millones de parámetros).Por qué lo usamos: Es el único capaz de correr en CPU con buena calidad en Español.Ventaja: Costo $0, Privacidad Total.Tu Reto: Hacer que funcione rápido usando ONNX Runtime.El Estándar de Oro (Fish Audio):Qué es: Una API de clonación de voz de última generación (Cloud).Ventaja: Calidad de audio perfecta (HD).Desventaja: Cuesta dinero y los datos salen del servidor.El MVP que vas a programar es la herramienta que validará si la tecnología local (Kokoro) es suficiente para reemplazar a la nube.⚠️ DIRECTRIZ CRÍTICA DE ENTORNO: WINDOWS + WSLATENCIÓN AGENTE:El entorno de desarrollo actual es Windows con WSL 2 (Windows Subsystem for Linux).Terminal: NO uses PowerShell ni CMD nativo para ejecutar comandos de Docker o scripts de shell. Debes usar exclusivamente la terminal de WSL (Ubuntu/Debian).Docker: Asume que Docker Desktop está instalado en Windows pero integrado con la distro de WSL.Comandos: Todos los comandos docker compose up, npm install, etc., deben ejecutarse asumiendo un entorno Linux.Sistema de Archivos: Asegúrate de que el proyecto resida dentro del sistema de archivos de Linux (/home/user/...) y no en /mnt/c/... para evitar problemas severos de rendimiento con Docker y hot-reloading.1. ARQUITECTURA DEL SISTEMAEl sistema funcionará como un monorepo orquestado por Docker Compose para garantizar la consistencia de las librerías de audio del sistema (Linux).Stack TecnológicoBackend: Python 3.10 + FastAPI (Asíncrono).Frontend: React 18 + Vite + TypeScript (PWA).Base de Datos: PostgreSQL + pgvector (Para RAG y persistencia).IA (LLM): OpenRouter (Gemini 2.0 Flash - Free Tier).IA (Voz - Strategy Pattern):Local (Privado): kokoro-onnx (Ejecución CPU).Cloud (HD): Fish Audio API.2. ESTRUCTURA DE ARCHIVOS Y DOCKERIZACIÓNInstrucción para el Agente: Genera la siguiente estructura de carpetas y archivos de configuración. No omitas los Dockerfile específicos./sublab-mvp
├── /backend
│   ├── /app
│   │   ├── /core           # Configuración (Env vars, Logger)
│   │   ├── /models         # Modelos SQLAlchemy y Schemas Pydantic
│   │   ├── /services
│   │   │   ├── /tts        # Lógica Strategy Pattern (Kokoro vs Fish)
│   │   │   ├── /llm        # Cliente OpenRouter
│   │   │   └── /rag        # Lógica de búsqueda vectorial
│   │   ├── /routers        # Endpoints (Chat, Setup, Auth)
│   │   └── main.py         # Entrypoint
│   ├── /weights            # Carpeta para `kokoro-v0_19.onnx` y `voices.bin`
│   ├── /voices             # Carpeta para vectores de estilo (.pt) generados
│   ├── Dockerfile          # CRÍTICO: Debe instalar espeak-ng
│   └── requirements.txt
├── /frontend
│   ├── /src
│   │   ├── /components
│   │   │   ├── /Lab        # UI de comparación A/B (Toggles, Métricas)
│   │   │   └── /Chat       # Interfaz de chat tipo WhatsApp
│   │   ├── /hooks          # useAudioStream, useTTSStrategy
│   │   ├── /services       # API Clients
│   │   └── App.tsx
│   ├── Dockerfile
│   └── vite.config.ts
├── docker-compose.yml
└── .env.example

Requisito Crítico: Dockerfile BackendEl agente DEBE utilizar esta base para el backend para soportar la fonetización de Kokoro (requiere espeak-ng compilado):FROM python:3.10-slim

# Instalación de dependencias de sistema para Audio y Fonética
RUN apt-get update && apt-get install -y \
    espeak-ng \
    libsndfile1-dev \
    ffmpeg \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

3. IMPLEMENTACIÓN DEL BACKEND (Lógica de Negocio)Instrucción para el Agente: Implementa el patrón de diseño Strategy para el servicio de TTS. Esto permite cambiar el motor en tiempo real sin romper el flujo del chat.3.1. Abstract TTS StrategyCrear clase base TTSService:generate_stream(text: str, voice_ref: str) -> Generator[bytes]clone_voice(audio_file: bytes) -> str (Devuelve ID o Path).3.2. Estrategia A: Local (Kokoro Service)Librería: kokoro-onnx + soundfile.Optimización: Cargar el modelo ONNX en memoria UNA SOLA VEZ durante el evento lifespan de FastAPI (al arrancar la app). NO cargar el modelo en cada petición.Clonación: Al recibir un audio, usar el script de extracción de estilo de Kokoro para generar un archivo .pt y guardarlo en /app/voices/.Output: Generar PCM/WAV en memoria y enviarlo como bytes.3.3. Estrategia B: Cloud (Fish Audio Service)Librería: httpx (Cliente Async).Clonación: Subir el audio a la API de Fish Audio y guardar el reference_id retornado.Output: Hacer proxy del stream de bytes que devuelve la API.3.4. Endpoints ClavePOST /api/voice/clone: Recibe un archivo .wav (10s).Ejecuta clonación Local -> Guarda .pt.Ejecuta clonación Cloud -> Obtiene ref_id.Devuelve: { "local_id": "coach_v1.pt", "cloud_id": "xyz_123_fish" }.POST /api/chat/generate:Payload: { "message": "...", "provider": "local" | "cloud", "voice_config": {...} }.Flujo: Pipeline RAG -> Prompt LLM -> Stream Texto -> TTS Strategy (Switch) -> Stream Audio.4. IMPLEMENTACIÓN DEL FRONTEND (UX "Laboratorio")Instrucción para el Agente: Diseñar una UI que haga evidente la diferencia entre ambos modelos.4.1. Componente: VoiceSettingsPanelSwitch de Proveedor:Opción Izquierda: 🟢 Modo Privado (Local). Badge: "0 Costo / Privacidad Total".Opción Derecha: 🔵 Modo HD (Cloud). Badge: "Alta Fidelidad / Requiere Internet".Uploader de Voz: Input simple para grabar/subir los 10s de audio del coach.4.2. Componente: ChatInterface & MetricsCada burbuja de chat del bot debe tener un pequeño footer con Métricas de Rendimiento (Debug Info):⏱️ Latencia: Tiempo (ms) desde "Enviar" hasta "Primer Sonido".💸 Costo: Mostrar "$0.00" si es Local, o un estimado "$0.001" si es Cloud.🔒 Privacidad: "En Dispositivo" vs "Enviado a API".4.3. Audio Player (Gapless)No usar <audio src="..."> estándar para el chat.Implementar un Hook useAudioQueue usando AudioContext.Debe ser capaz de encolar los chunks de audio que llegan del backend para que la voz suene continua y no entrecortada.5. ROADMAP DE EJECUCIÓN (Paso a Paso)El agente debe seguir este orden estricto para evitar errores de dependencia.Fase 0: Verificación de WSLConfirmar que se está ejecutando dentro de una shell Linux (wsl --status o uname -a).Verificar que Docker es accesible desde WSL (docker ps).Fase 1: Cimientos (Docker)Crear docker-compose.yml.Configurar backend/Dockerfile con espeak-ng.Levantar contenedores y verificar que Python detecta las librerías de audio.Fase 2: Motor Local (Kokoro)Descargar kokoro-v0_19.onnx y voices.bin.Implementar KokoroService.py.Crear script de prueba test_audio.py dentro del contenedor para verificar que genera un .wav.Fase 3: Motor Cloud & APIImplementar FishAudioService.py.Crear los endpoints en FastAPI que permitan el "Toggle" entre servicios.Fase 4: Frontend LabConfigurar Vite + React.Crear la UI de "Settings" y el "Chat".Conectar el Frontend con el Backend.Fase 5: LLM IntegrationConectar OpenRouter.Finalizar el pipeline completo: Texto -> LLM -> TTS -> Audio.6. VARIABLES DE ENTORNO NECESARIAS (.env)El agente debe generar un .env con estos campos vacíos para que el usuario los rellene:# APP
ENV=development
PORT=8000

# KEYS
OPENROUTER_API_KEY=sk-or-...
FISH_AUDIO_API_KEY=...

# DB
DATABASE_URL=postgresql://user:pass@db:5432/sublab

