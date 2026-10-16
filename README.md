# Auto-Chronical
Alts Final Project

Mobile first app for tracking a car's repair history and building a savings habit for upkeep. AltSchool Capstone project.

## Stack
- Frontend: React/Next.js (PWA)
- Backend: Node/NestJS (TBD — confirm with backend engineer)
- Database: PostgreSQL
- Auth & Storage: Supabase
- Hosting: TBD

## Branch strategy
- `main` — stable, tested code only
- `preview` — active development, all work merges here first before main

## Folders
- `/frontend` — client app
- `/backend` — API and server logic

## API Notes
- Health checks: `GET /health` and `GET /api/health` return `{ "status": "ok" }`.
- Creating an issue requires an `Idempotency-Key` header (1-128 letters, digits, `.`, `_`, `:`, or `-`). Generate one key per new issue and reuse that same key for retries of that request. Reusing a key with different issue data returns `409 Conflict`.
