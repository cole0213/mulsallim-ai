#!/usr/bin/env sh
# Run only on the approved deployment server from the extracted release directory.
set -eu

APP_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(CDPATH= cd -- "$APP_DIR/../.." && pwd)"
IMAGE="mulsallim-ai:v12"
CONTAINER="mulsallim-ai"

test -f "$BASE_DIR/.env" || { echo "Missing $BASE_DIR/.env (KRC_SERVICE_KEY required)" >&2; exit 1; }
mkdir -p "$BASE_DIR/runtime"

docker build -t "$IMAGE" "$APP_DIR"
if docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  docker rm -f "$CONTAINER"
fi
docker run -d \
  --name "$CONTAINER" \
  --restart unless-stopped \
  --env-file "$BASE_DIR/.env" \
  -e PORT=4184 \
  -e RUNTIME_DIR=/data \
  -p 4184:4184 \
  -v "$BASE_DIR/runtime:/data" \
  "$IMAGE"

for i in 1 2 3 4 5 6; do
  if curl -fsS http://127.0.0.1:4184/api/health; then
    echo
    echo "Deployment healthy."
    docker ps --filter "name=$CONTAINER"
    exit 0
  fi
  sleep 3
done

echo "Deployment did not become healthy. Logs:" >&2
docker logs --tail=120 "$CONTAINER" >&2 || true
exit 1
