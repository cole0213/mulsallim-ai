#!/usr/bin/env sh
# Run only on the approved deployment server from the extracted release directory.
set -eu

APP_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(CDPATH= cd -- "$APP_DIR/../.." && pwd)"

test -f "$BASE_DIR/.env" || { echo "Missing $BASE_DIR/.env (KRC_SERVICE_KEY required)" >&2; exit 1; }
mkdir -p "$BASE_DIR/runtime"

cd "$APP_DIR"
docker compose -f docker-compose.production.yml up -d --build --remove-orphans
docker compose -f docker-compose.production.yml ps

for i in 1 2 3 4 5 6; do
  if curl -fsS http://127.0.0.1:4184/api/health; then
    echo
    echo "Deployment healthy."
    exit 0
  fi
  sleep 3
done

echo "Deployment did not become healthy. Logs:" >&2
docker compose -f docker-compose.production.yml logs --tail=120 web >&2
exit 1
