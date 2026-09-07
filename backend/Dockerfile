FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chmod +x /app/entrypoint.sh

# Run as an unprivileged user. A container process that starts as root keeps
# root's reach if the app is ever exploited, and nothing here needs it.
#
# media/ is created and handed over before the drop so that a fresh named
# volume mounted there inherits this ownership — Document AI writes indexes
# and the API-key transport key into it. An *existing* root-owned volume keeps
# its ownership and must be chowned once on the server; see the deploy notes.
RUN useradd --system --create-home --uid 10001 nevatal \
    && mkdir -p /app/media /app/staticfiles \
    && chown -R nevatal:nevatal /app/media /app/staticfiles

USER nevatal
