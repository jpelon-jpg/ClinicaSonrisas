#!/usr/bin/env bash
# Se ejecuta EN EL VPS dentro del clon del repositorio para publicar una nueva versión.
set -euo pipefail
cd "$(dirname "$0")/.."
git pull

echo "==> Backend"
(cd backend && mvn -q -DskipTests package)
sudo cp backend/target/sonrisa-api.jar /opt/sonrisa/sonrisa-api.jar
sudo chown sonrisa:sonrisa /opt/sonrisa/sonrisa-api.jar
sudo systemctl restart sonrisa-api

echo "==> Frontend"
(cd frontend && npm ci && npm run build)
sudo rsync -a --delete frontend/dist/ /var/www/sonrisa/

echo "==> Listo"; sudo systemctl --no-pager status sonrisa-api | head -5
