# audit-ai

AI-assisted **risk & compliance auditing** for documents, source code, and configuration.
Paste any text and audit-ai scans it for leaked secrets, personally identifiable
information (PII), and compliance-sensitive language — then reports findings with
severity, location, and remediation guidance.

The audit engine is fully self-contained (no external API required), so it runs
end-to-end offline. When an `OPENAI_API_KEY` is configured, results can be
optionally enriched with an LLM-generated summary.

## Architecture

| Component | Stack | Location |
| --- | --- | --- |
| Audit API | Python 3.12 · FastAPI · Uvicorn | [`backend/`](backend/) |
| Web UI | React 18 · TypeScript · Vite | [`frontend/`](frontend/) |

The frontend dev server proxies `/api` to the backend, so the browser talks to a
single origin during development.

## Quick start

Prerequisites: Python 3.12 (with `python3-venv`), Node.js 22+.

```bash
# Install all dependencies (backend venv + frontend node_modules)
bash .cursor/install.sh

# Terminal 1 — backend API on http://localhost:8000 (docs at /docs)
cd backend && .venv/bin/uvicorn app.main:app --reload

# Terminal 2 — web UI on http://localhost:5173
cd frontend && npm run dev
```

Open http://localhost:5173, pick a sample (or paste your own text), and click
**Run audit**.

## API

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Service health and version. |
| `GET` | `/api/rules` | List the active audit rules. |
| `POST` | `/api/audit` | Audit `{ "content": "...", "filename": "..." }`. |

Example:

```bash
curl -s -X POST http://localhost:8000/api/audit \
  -H 'Content-Type: application/json' \
  -d '{"content":"api_key = \"EXAMPLE-do-not-use-123456\"", "filename":"config.env"}'
```

## Development

```bash
# Backend: lint and tests
cd backend
.venv/bin/ruff check .
.venv/bin/pytest

# Frontend: type-check and production build
cd frontend
npm run lint
npm run build
```

## Cloud Agent environment

[`.cursor/environment.json`](.cursor/environment.json) defines the Cloud Agent
setup: [`.cursor/install.sh`](.cursor/install.sh) provisions dependencies, and two
terminals run the backend API and the frontend dev server.
