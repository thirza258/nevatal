# Nevatal - AI Functions Hub

Nevatal is a comprehensive AI application that combines multiple AI functionalities into a single, easy-to-use platform. The application consists of a React frontend and a Django backend that integrates various AI capabilities. You bring your own OpenAI, Google Gemini or OpenRouter API key; every request is made with it.

## Features

The seventeen tools in the workspace, as defined in
[`frontend/src/tools.ts`](./frontend/src/tools.ts):

- **Prompt** — open-ended chat with the model
- **Explainer** — concepts explained at the depth you choose
- **Writer** — turn a brief into a finished draft
- **Rewriter** — rework text towards a specific goal
- **Proofreader** — fix errors without losing your voice
- **Summarizer** — condense long text into the shape you need
- **Copywriting** — marketing copy shaped for its channel
- **Email Builder** — draft an email from its context
- **Social Caption** — captions shaped for TikTok, Instagram, LinkedIn or X
- **Idea Generator** — a numbered brainstorm: names, business ideas, angles
- **Translator** — translate with control over register
- **Sentiment Analysis** — judge the tone of feedback and reviews
- **Document AI** — RAG chat over the contents of an uploaded PDF
- **Image Generation** — generate an image from a description
- **Data Analysis** — upload a CSV and get insights and charts back
- **Data Formatter** — clean, validate and convert pasted data
- **Batch Runner** — run one tool over many inputs at once

Document AI and Image Generation require a Google Gemini key; the rest work
with any of the three providers. An OpenRouter key can also pick which model
the tools run on, from OpenRouter's whole catalogue.

## Getting Started

### Prerequisites

- Docker
- Docker Compose

### Running the Application

1. Clone the repository:
   ```bash
   git clone https://github.com/thirza258/nevatal.git
   cd nevatal
   ```

2. Rename .env.example to .env

3. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: http://localhost
   - Backend API: http://localhost:8000

### Development Setup

For local development without Docker:

1. Frontend setup:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. Backend setup:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```

### Running the tests

```bash
cd backend && python manage.py test     # Django: views, providers, key slots, usage
cd frontend && npm test                 # Vitest: conversation memory and stored threads
```

### Configuration

If you want to change some of the configuration, adjust the environment variable values in the `.env` file.  
You can refer to the provided example in [`.env.example`](./.env.example):

```
ALLOWED_HOSTS="localhost, 127.0.0.1"
SECRET_KEY="SecretKey"

DATABASE_URL=postgres://postgres:admin123@db:5432/postgres
DEVELOPMENT_MODE=False

POSTGRES_DB="postgres"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="admin123"
```

### Landing page and SEO

`/` is a public landing page ([`frontend/src/pages/landing/`](./frontend/src/pages/landing/)):
the pitch, the tool list, the key-handling story, an FAQ, and the API key form
itself. Everything else is behind an API key, and a signed-out visitor on any
other route is redirected to `/`, so `/` is the only indexable URL — which is
why [`sitemap.xml`](./frontend/public/sitemap.xml) lists nothing else.

The landing page renders before the session check resolves, so the page a
crawler reads has no round trip in front of it. A returning visitor (one with
`activeProvider` in localStorage) sees the loading state instead, to avoid a
flash of the landing page on the way to the workspace.

The tool cards and the FAQ's tool list are generated from `TOOL_GROUPS` in
[`frontend/src/tools.ts`](./frontend/src/tools.ts) — the same list the router
and sidebar use — so the landing page cannot advertise a tool that does not
exist. The `FAQPage` structured data is built from the array that renders the
visible FAQ for the same reason; the stable `WebSite` and `SoftwareApplication`
markup lives in `index.html`.

The public origin is written in four places, and moving the site means changing
all four:

| File | What it holds |
| --- | --- |
| `frontend/index.html` | `<link rel="canonical">`, `og:url`, `og:image`, JSON-LD `@id`/`url` |
| `frontend/public/sitemap.xml` | the `<loc>` and its `<lastmod>` |
| `frontend/public/robots.txt` | the `Sitemap:` line |
| `frontend/src/constant.ts` | `SITE_URL`, used by the footer link |

`og-image.png` (1200×630) is the social preview card. `nginx.conf` gzips text
responses, caches the fingerprinted `/assets/` for a year, and marks
`index.html` `no-cache` so a deploy is picked up immediately.

### API key handling

The provider API key never travels in clear text:

1. The browser fetches `GET /api/v1/public-key/` — the backend's RSA public key.
2. It encrypts the key with WebCrypto (RSA-OAEP, SHA-256) and sends it as
   `Authorization: Bearer rsa:<key_id>:<base64>`.
3. Only the backend can unwrap it, so nginx, the tunnel, and any request log in
   between see ciphertext.
4. Once validated, the key is stored as an httpOnly cookie encrypted with
   `SECRET_KEY`, and later requests use that cookie instead of the key.

The private key comes from `API_KEY_PRIVATE_KEY` when set; otherwise the
backend generates one on first use and keeps it in `media/.keys/`, which is on
the persistent volume. This sits on top of HTTPS rather than replacing it, and
it does not protect against a compromised frontend, which necessarily sees the
key before encrypting it. Unencrypted keys are still accepted, so a page served
without a secure context (where WebCrypto is unavailable) can still sign in.

### Conversation memory

The three chat tools — Prompt, Explainer and Document AI — send the thread with
every message, because the backend keeps no conversation state: a session is a
key in a cookie, not an account. The thread lives in `localStorage` per tool, so
a reload continues the conversation rather than starting again, and "Clear chat"
is how you deliberately forget it. Signing out clears every stored thread.

`ai_service.normalize_conversation` decides what is replayed: `user` and
`assistant` turns only, the most recent 20 of them, trimmed from the oldest end
to a 24,000-character budget. Without that cap a thread left open all afternoon
would multiply the token bill on every turn.

### Output formats

A tool can ask for its answer as Markdown, plain text, a table, JSON or CSV.
The choice travels in the request body rather than the session, because it
belongs to the job: JSON from the data tools and Markdown from the writers, in
the same sitting. `ai_service.OUTPUT_FORMAT_DIRECTIVES` holds what each one
means to a model, an unknown value simply adds no directive, and the result
panel uses the choice to decide the download's extension and whether to render
Markdown or show the text verbatim.

### Prompt templates

Every text tool's input panel has a template library, scoped to that tool and
kept in `localStorage`. Export writes the library out as JSON and import merges
one back in, which is how a set of prompts moves between people — or between
your own machines — without the app needing accounts to keep them under. The
library survives signing out; conversations do not.

### Batch runs

The Batch Runner takes a tool and many inputs — pasted lines, blocks separated
by a blank line, or one file per item — and runs them a few at a time, with a
per-item status table, a stop button, retry-failed, and CSV or JSON export.

There is no batch endpoint: each item is an ordinary request to the ordinary
tool, so a batch costs exactly what doing it by hand would and nothing new can
go wrong server-side. Items carry `X-Nevatal-Batch: 1`, which keeps them out of
the history sidebar while still counting towards usage — fifty rows of
"translate line 37" would bury the work someone actually wants to find again.

### Usage, cost and keys

Every generation records what it ran on and what it consumed, on the
`ChatRecord` row it already wrote: `model`, `tokens_in`, `tokens_out` and
`cost`. Token counts are the provider's own, read from the reply.

`cost` is this app's estimate, computed from the provider's published prices —
so it is a real number for OpenRouter, whose catalogue carries them, and null
for a provider that publishes none. A blank is better than a guess on a spend
screen. `GET /api/v1/usage/` aggregates it per model, per tool, per day and per
key, alongside the provider's own balance where it exposes one (OpenRouter's
`GET /key`), which is the figure a spending alert should really trust.

A session can hold up to five keys. They live encrypted in an httpOnly cookie,
exactly as the single key does — a list, given the same treatment — so keeping a
spare does not weaken the first, and the browser only ever sees them masked.
`nevatal_api_key` stays the active key, which is what every view already reads,
so nothing downstream knows that slots exist.

| Endpoint | Does |
| --- | --- |
| `GET /api/v1/keys/` | the session's keys, masked |
| `POST /api/v1/keys/` | check a key with its provider, then keep it |
| `POST /api/v1/keys/switch/` | generate with a different one from now on |
| `POST /api/v1/keys/rotate/` | move to the next one |
| `DELETE /api/v1/keys/<n>/` | forget one |

Rotation is client-driven: a request refused with 429 (rate limited) or 402 (out
of credit) rotates to the next key and is retried once, in one axios
interceptor. Key-management and validation calls are exempt — rotating during a
key check would report a bad key as accepted on a session that had quietly moved
to a different one.

### Data analysis

The Data Analysis tool profiles an uploaded CSV with pandas, sends the model
that profile and the first fifteen rows, and asks it for insights and for a list
of charts worth drawing — as *specifications* naming real columns
(`{type, x, y, agg}`), not as data.

The backend then computes each chart over the whole file. That division matters:
a model that has seen fifteen rows would produce numbers that look right, and a
chart is exactly where that is least acceptable. Charts use the validated
categorical palette in fixed slot order, ship direct value labels and a table
view, and are drawn as inline SVG with no charting dependency.

### Installing it as an app

`public/manifest.webmanifest` and `public/sw.js` make the workspace installable
on a phone or desktop, with the sidebar becoming a drawer below `md`. The worker
caches the fingerprinted `/assets/` and the app shell, and **never** `/api/` —
those responses carry the session and answers generated with someone's key, and
a cache in front of them could hand one person's generation to the next person
on a shared device. `nginx.conf` marks `sw.js` and the manifest `no-cache`, so a
stale worker cannot pin an old shell.

### Model selection

Providers differ in how much choice they offer. OpenRouter routes to hundreds
of models and publishes the whole catalogue, so a session on an OpenRouter key
gets a model picker in the top bar; an OpenAI or Gemini key has no catalogue to
read and stays on this app's default model for that provider.

1. `GET /api/v1/models/` resolves the provider from the session's key — not
   from what the browser claims — and, for OpenRouter, reads
   `https://openrouter.ai/api/v1/models`. That endpoint is public: a key pays
   for generation, not for reading the catalogue, so the full list is available
   to any valid session.
2. Each entry is trimmed to what a picker needs — id, name, context length,
   price, modality — which turns a 700KB response into about 90KB, and prices
   are converted from the per-token figures OpenRouter quotes ("0.00000015") to
   dollars per million tokens (0.15). The result is cached in-process for ten
   minutes.
3. The browser keeps the chosen id in `localStorage` under `activeModel` and
   sends it as `X-AI-Model` with every request. Each view passes it on to
   `generate_response`, and an absent or unusable header means the provider's
   default, so a session that never picked anything is unaffected. A model id
   is not a credential and does not travel the encrypted path the API key does.
4. The picker drops a stored id when the catalogue it just read does not
   contain it, so a key swapped for another provider's cannot leave a stale
   model on every request. A catalogue that could not be read is left alone —
   a provider outage should not discard the choice.

An empty list is a valid answer and the frontend shows no picker for it; a
provider that could not be reached answers 502 instead, because "no models to
choose from" and "no answer" are different things.

### Backend layout

The Django apps are grouped by AI use case, and every app's URLs are mounted
under `/api/v1/`:

| App | Owns |
| --- | --- |
| `core` | API key session and key slots, history, usage and cost, the model catalogue, open-ended prompting (`prompt`, `explainer`) |
| `grammar_function` | Text work: writer, rewriter, proofreader, summarizer, translator, sentiment, copywriting, email, social post, idea generator, data formatter |
| `document_function` | Files and media: PDF/CSV extraction, Document AI (RAG), CSV data analysis, meeting summary, image generation |
| `ai_service` | Provider clients (Gemini, OpenAI, OpenRouter) |
| `rag_service` | The persisted RAG store |

### Document AI storage

Uploads are indexed once and kept on disk, one numbered folder per file, under
`MEDIA_ROOT` (`backend/media/`):

```
media/rag/<api-key-fingerprint>/
├── 1/
│   ├── index.pkl     chunks + embeddings for the first upload
│   ├── meta.json     source name, chunk count, created_at
│   └── report.pdf    the upload itself
├── 2/
└── 3/
```

Chat rebuilds a FAISS index from those pkl files and searches every document
belonging to the API key, so answering costs one embedding call for the
question rather than re-embedding every chunk. `GET /api/v1/rag-documents/`
lists them and `DELETE /api/v1/rag-documents/<n>/` removes one.

The media directory holds real data — the deployed stack mounts it as the
`media_data` volume, and the dev stack keeps it in `backend/media/` through the
bind mount.

### Deployment

`docker-compose.prod.yml` is generated by [`deploy.sh`](./deploy.sh), which the
GitHub Actions workflow copies to the server and runs. To deploy by hand:

```bash
cd ~/nevatal_app
IMAGE_TAG=<git-sha> ./deploy.sh   # omit IMAGE_TAG to use the one in .env
```

It reads `DOCKER_USERNAME` and `IMAGE_TAG` from `.env` in that directory, pulls
the tagged images with retries, and restarts the stack.
