#!/bin/sh
#
# Container entrypoint. Runs migrations, collects static assets, then serves.

set -e

echo "Waiting for database..."
sleep 3  # optional: or use a wait-for-it script

# The image drops to an unprivileged user, but a named volume created by an
# earlier root-running version keeps its old ownership. Say so clearly here
# rather than failing later, halfway through someone's first upload.
if [ ! -w /app/media ]; then
  echo "ERROR: /app/media is not writable by $(id -un) (uid $(id -u))." >&2
  echo "A volume from a previous root-running deploy needs handing over once:" >&2
  echo "    docker run --rm -v nevatal_app_media_data:/m alpine chown -R 10001:10001 /m" >&2
  echo "(substitute your volume's real name from \`docker volume ls\`)" >&2
  exit 1
fi

echo "Applying migrations..."
python manage.py migrate --noinput

# Whitenoise serves whatever is in STATIC_ROOT. With DEBUG off nothing else
# will, so without this the admin and the DRF pages load without styling.
echo "Collecting static files..."
python manage.py collectstatic --noinput --clear

# Daphne, not `manage.py runserver`. The dev server is single-threaded, does no
# request throttling of its own, reloads on file changes and is explicitly
# documented as unfit to serve real traffic. The project is already ASGI
# (ASGI_APPLICATION is set and daphne is an installed app), so this is the
# server it was written for.
echo "Starting Daphne..."
exec daphne -b 0.0.0.0 -p 8000 --proxy-headers nevatal_settings.asgi:application
