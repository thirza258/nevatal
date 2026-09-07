#!/usr/bin/env bash
#
# Deploy Nevatal on the server.
#
# Writes docker-compose.prod.yml, pulls the tagged images and restarts the
# stack. The GitHub Actions workflow copies this script over and runs it, but
# it works the same way by hand:
#
#     cd ~/nevatal_app && ./deploy.sh              # deploy whatever .env pins
#     IMAGE_TAG=9f2c1ab ./deploy.sh                # deploy one specific build
#
# Configuration comes from .env in the app directory — the same file Compose
# reads for the database credentials.

set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/nevatal_app}"
ENV_FILE="$APP_DIR/.env"
COMPOSE_FILE="$APP_DIR/docker-compose.prod.yml"
PULL_ATTEMPTS="${PULL_ATTEMPTS:-5}"

cd "$APP_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE — nothing to deploy with." >&2
  exit 1
fi

# Read single keys instead of sourcing the file: values like
# ALLOWED_HOSTS=localhost, 127.0.0.1 are valid for Compose but would be
# executed as a command by the shell.
read_env() {
  sed -n "s/^$1=//p" "$ENV_FILE" | tail -n 1
}

DOCKER_USERNAME="${DOCKER_USERNAME:-$(read_env DOCKER_USERNAME)}"
IMAGE_TAG="${IMAGE_TAG:-${1:-$(read_env IMAGE_TAG)}}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

if [ -z "$DOCKER_USERNAME" ]; then
  echo "DOCKER_USERNAME is not set in $ENV_FILE or the environment." >&2
  exit 1
fi

# The backend derives the cipher for the provider-API-key cookies from
# SECRET_KEY, so a missing or well-known value means anyone holding a captured
# cookie can read a live provider key out of it. The app refuses to boot
# without one; catch it here, where the message can be useful.
SECRET_KEY_VALUE="${SECRET_KEY:-$(read_env SECRET_KEY)}"
SECRET_KEY_VALUE="${SECRET_KEY_VALUE%\"}"
SECRET_KEY_VALUE="${SECRET_KEY_VALUE#\"}"

if [ -z "$SECRET_KEY_VALUE" ]; then
  echo "SECRET_KEY is not set in $ENV_FILE. Generate one with:" >&2
  echo "    python3 -c 'import secrets; print(secrets.token_urlsafe(64))'" >&2
  exit 1
fi

case "$SECRET_KEY_VALUE" in
  SecretKey|django-insecure-*|changeme|secret)
    echo "SECRET_KEY is still a placeholder value. Replace it before deploying:" >&2
    echo "    python3 -c 'import secrets; print(secrets.token_urlsafe(64))'" >&2
    echo "Rotating it signs everyone out, so set API_KEY_FINGERPRINT_SALT to the" >&2
    echo "old value first if you want existing history and documents to survive." >&2
    exit 1
    ;;
esac

if [ "${#SECRET_KEY_VALUE}" -lt 50 ]; then
  echo "SECRET_KEY is shorter than 50 characters; generate a longer one." >&2
  exit 1
fi

echo "=== DEPLOYING ${DOCKER_USERNAME}/nevatal-*:${IMAGE_TAG} ==="
docker --version
docker compose version

# \${...} stays literal so Compose resolves it from .env at run time;
# ${DOCKER_USERNAME} and ${IMAGE_TAG} are resolved here, while writing.
cat > "$COMPOSE_FILE" <<EOF
services:
  db:
    image: postgres:16-alpine
    container_name: postgres_db
    environment:
      POSTGRES_DB: \${POSTGRES_DB}
      POSTGRES_USER: \${POSTGRES_USER}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  backend:
    image: ${DOCKER_USERNAME}/nevatal-backend:${IMAGE_TAG}
    container_name: nevatal_backend
    command: /app/entrypoint.sh
    environment:
      DATABASE_URL: \${DATABASE_URL}
      DEVELOPMENT_MODE: \${DEVELOPMENT_MODE}
      ALLOWED_HOSTS: \${ALLOWED_HOSTS}
      CORS_ALLOWED_ORIGINS: \${CORS_ALLOWED_ORIGINS}
      # Required. The app will not start without it, by design: the
      # alternative is starting with a secret an attacker already knows.
      SECRET_KEY: \${SECRET_KEY}
      # Defaults to off here as well as in the settings module, so that a
      # missing value cannot turn tracebacks on in production.
      DEBUG: \${DEBUG:-False}
      # Set this to the previous SECRET_KEY when rotating, so existing chat
      # history and Document AI folders stay attached to their owners.
      API_KEY_FINGERPRINT_SALT: \${API_KEY_FINGERPRINT_SALT:-}
      CSRF_TRUSTED_ORIGINS: \${CSRF_TRUSTED_ORIGINS:-}
      # Requests per client per minute across the API. The Batch page fans out
      # deliberately, so raise this rather than lowering it if batches stall.
      ANON_THROTTLE_RATE: \${ANON_THROTTLE_RATE:-180/min}
      # Proxies in front of Django, so throttling counts the real client.
      # Cloudflare plus nginx is 2.
      NUM_PROXIES: \${NUM_PROXIES:-2}
      # Optional. Unset, the backend generates its own transport key and keeps
      # it in the media volume below.
      API_KEY_PRIVATE_KEY: \${API_KEY_PRIVATE_KEY:-}
    volumes:
      # Document AI writes each upload's index to media/rag/<owner>/1|2|3/.
      # Without this volume every deploy would replace the container and take
      # the persisted embeddings with it.
      - media_data:/app/media
    depends_on:
      - db
    restart: unless-stopped

  frontend:
    image: ${DOCKER_USERNAME}/nevatal-frontend:${IMAGE_TAG}
    container_name: nevatal_frontend
    ports:
      - "5176:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  media_data:
EOF

echo "=== COMPOSE FILE ==="
cat "$COMPOSE_FILE"

echo "=== PULLING IMAGES ==="
for attempt in $(seq 1 "$PULL_ATTEMPTS"); do
  if docker compose -f "$COMPOSE_FILE" pull; then
    break
  fi
  if [ "$attempt" -eq "$PULL_ATTEMPTS" ]; then
    echo "Giving up after $PULL_ATTEMPTS pull attempts." >&2
    exit 1
  fi
  echo "Pull failed (attempt $attempt/$PULL_ATTEMPTS), retrying in 15s..."
  sleep 15
done

echo "=== STARTING STACK ==="
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "=== RUNNING CONTAINERS ==="
docker compose -f "$COMPOSE_FILE" ps

echo "=== CLEANUP ==="
docker image prune -f

echo "=== DEPLOYED ${IMAGE_TAG} ==="
