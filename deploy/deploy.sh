#!/usr/bin/env bash
# Pull the latest main and (re)deploy OrbitOS with Docker Compose.
# Usage: bash deploy/deploy.sh            (from the repo root)
set -euo pipefail
cd "$(dirname "$0")/.."

BRANCH="${ORBITOS_BRANCH:-main}"
git fetch --quiet origin "$BRANCH"
git checkout --quiet "$BRANCH"
git reset --quiet --hard "origin/$BRANCH"
echo "Deploying $(git rev-parse --short HEAD): $(git log -1 --format=%s)"

# First run: create deploy/.env with a random JWT secret (never committed).
if [ ! -f deploy/.env ]; then
  umask 077
  printf 'JWT_SECRET=%s\n' "$(openssl rand -hex 48)" > deploy/.env
  echo "Created deploy/.env (chmod 600). Add optional keys there (GOOGLE_CLIENT_ID, ...)."
fi

docker compose -f deploy/docker-compose.yml up -d --build --remove-orphans
docker image prune -f >/dev/null

PORT="${ORBITOS_PORT:-4100}"
for i in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null; then
    echo "OrbitOS is up on 127.0.0.1:$PORT ($(git rev-parse --short HEAD))"
    exit 0
  fi
  sleep 2
done
echo "Health check failed; recent logs:" >&2
docker compose -f deploy/docker-compose.yml logs --tail 50 app >&2
exit 1
