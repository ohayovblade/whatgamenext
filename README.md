# WhatGameNext

A multi-user **game backlog tracker**. Sign in, search the [RAWG](https://rawg.io)
catalog, save games to your own backlog, set a status and an optional play timeline.
Every user only ever sees and mutates their own backlog.

## Stack

- **Next.js 14** (pages router) — frontend + API routes in one app
- **NextAuth** — credentials (email + password), bcrypt-hashed
- **PostgreSQL** via `pg` — schema created/migrated idempotently on first DB access
- **MUI v6** (dark theme) + **Tailwind** (auth pages)
- **RAWG API** — game metadata, proxied server-side (key never reaches the browser)

## Features

- Email/password **sign-up, login, logout**; protected routes (401 before any DB
  access) and protected pages (redirect to `/login` when unauthenticated)
- **Backlog CRUD** — add / list / update-status / delete, every query scoped by the
  session `userId`; per-user `UNIQUE(userId, gameId)` → `409` on duplicate
- **RAWG search** — debounced, inline search-as-you-type; pick a result to add it
- **Statuses** — `Not Started` · `Playing` · `Completed` · `Dropped`
- **Play timeline** — optional start/finish dates with a day-count
- RAWG-style dashboard: sidebar status filters with counts, cover-art card grid,
  order-by sort, floating games counter

## Run

```bash
cd Day3/Rian/whatgamenext
cp .env.example .env.local      # fill in the values below
npm install
npm run dev                     # http://localhost:3000
```

Needs a local Postgres. Quick Docker one-liner (matches `.env.example`):

```bash
docker run -d --name whatgamenext-pg \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=whatgamenext -e POSTGRES_DB=whatgamenext \
  -p 5432:5432 postgres:16
```

### Environment (`.env.local`)

| Var | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `NEXTAUTH_SECRET` | signs session JWTs (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | app origin (e.g. `http://localhost:3000`) |
| `RAWG_API_KEY` | RAWG key — get one free at rawg.io/apidocs (server-only) |

## Checks

```bash
npm run type-check   # tsc --noEmit
npm run build        # build all routes
npm run lint
```

## Bug-fix exercise

This branch ships a deliberately introduced bug (the sign-up response leaked the
bcrypt `passwordHash`) and its fix. See [`bug-report.md`](./bug-report.md) for the
reproduction, root cause, and verification.
