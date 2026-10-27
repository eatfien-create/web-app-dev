# VivariaOS

Browser-based vivarium microclimate simulator for cloud-forest growers: VPD psychrometrics, vertical chamber stratification, a 24-hour diurnal scheduler, a species catalog, and a support assistant.

**Live link:** _TODO: add the deployed URL here after deploying (see "Deploy")._

## Pages
| Path | Purpose |
|---|---|
| `/` | Landing page |
| `/chamber/` | Simulator: telemetry, chamber stratification, VPD heatmap, relays |
| `/schedule/` | 24h light / rain / fog / fan program and DLI |
| `/species/` | Species catalog and survival envelopes |
| `/faq/` | FAQs loaded from the SQL database |
| `/errors/` | Error code reference (400, 401, 403, 404, 429, 500, 503, VIV-901) |
| `/status/`, `/health/` | Health check page and JSON endpoint |
| `/support/` | Support ticket form |

A chat widget is on every page. Unknown URLs show a custom 404; server errors show a custom 500; both have an **Ask the assistant** button.

## Stack
- Django 6 (SQLite by default) serving a React + TypeScript + Vite single-page frontend
- Support tickets, FAQs, error codes: SQL (Django models)
- Chat logs and feedback: MongoDB (`MONGO_URI`); falls back to `logs/*.jsonl` when unset or unreachable
- Assistant: retrieval over the FAQ table plus the error code table; if nothing matches it offers to create a ticket
- Third-party API: Open-Meteo (outdoor conditions) with a 3 s timeout and a labelled fallback
- Request logging middleware; rate limit of 20 chat messages/min/IP (returns 429)
- UI components are written in the style of React Bits (spotlight card, shiny text, aurora) and 21st.dev-style chat widget; they are local code, not installed from those registries.

## Run locally
```bash
python3 -m venv env_site && source env_site/bin/activate
pip install -r requirements.txt
cp .env.example .env        # set SECRET_KEY, optionally MONGO_URI
python manage.py migrate && python manage.py seed
python manage.py runserver
```
Frontend source is in `thanish_web_app/frontend`; the built bundle is committed in `thanish_web_app/static/app`. To rebuild: `cd thanish_web_app/frontend && npm install && npm run build`.

Set `DEBUG=False` to see the custom 404/500 pages locally.

## Tickets (CRUD)
Create: `POST /api/ticket/` (public, used by the assistant and the support form). Read/update/delete: `GET /api/tickets/`, `GET|PATCH|DELETE /api/ticket/<id>/` (staff login via `/admin/`; the admin UI also manages tickets, FAQs and error codes).

## Environment variables
`SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `MONGO_URI`, `MONGO_DB`. Nothing secret is committed: `.env` is git-ignored and `.env.example` holds placeholders.

## Deploy
Any host that runs Django works (Render, Railway, Fly). Start command `gunicorn thanish_web_project.wsgi`, build command `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate && python manage.py seed`. Set the env vars above (MongoDB Atlas free tier for `MONGO_URI`).

## Deploy on Vercel
Vercel's disk is read-only, so use a hosted Postgres (Neon free tier) for the SQL database and MongoDB Atlas for chat logs. Environment variables on Vercel: `SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS=.vercel.app`, `DATABASE_URL`, `MONGO_URI`, `MONGO_DB=vivaria`. Create the tables once from your machine:
```bash
DATABASE_URL='<neon string>' SECRET_KEY=x python manage.py migrate
DATABASE_URL='<neon string>' SECRET_KEY=x python manage.py seed
```

## Proposed improvement
Let the assistant use a language model to rephrase FAQ answers for the user's chamber (for example, quoting their species' VPD target), while still refusing to answer outside the FAQ data. This keeps answers grounded but makes them less generic.
