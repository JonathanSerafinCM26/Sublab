#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/var/www/vhosts/sublab.areadev.es/Sublab"
cd "$PROJECT_DIR"

echo "[1/7] Verificando docker y compose"
command -v docker >/dev/null 2>&1 || { echo "ERROR: docker no está instalado"; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "ERROR: docker compose plugin no disponible"; exit 1; }

echo "[2/7] Preparando .env"
if [ ! -f .env ]; then
  cp .env.prod.example .env
  echo "Se creó .env desde .env.prod.example. Revisa variables antes de continuar."
fi

echo "[3/7] Bajando stack previo"
docker compose -f docker-compose.prod.yml down --remove-orphans || true

echo "[4/7] Limpiando imágenes antiguas con tags esperados"
docker image rm -f sublab-frontend:latest sublab-backend:latest || true

echo "[5/7] Build limpio frontend/backend"
docker compose -f docker-compose.prod.yml build --no-cache frontend backend

echo "[6/7] Levantando servicios"
docker compose -f docker-compose.prod.yml up -d --force-recreate

echo "[7/7] Estado final"
docker compose -f docker-compose.prod.yml ps
echo
echo "Logs backend (últimas 50):"
docker compose -f docker-compose.prod.yml logs --tail=50 backend || true
echo
echo "Logs frontend (últimas 50):"
docker compose -f docker-compose.prod.yml logs --tail=50 frontend || true

echo "Despliegue completado."
