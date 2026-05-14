# 🐀 WhereRat

> *They were in that movie. You saw them. Now you can log them.*

**[whererat.com](https://whererat.com)** — a spoiler-aware community catalog of rat and rodent cameos in film and TV. Submit sightings, browse by genre or rodent type, and help build the definitive archive of cinema's most underrated cast members.

```
  (\(\
  ( -.-)   whererat.com
  o_(")(")  spot a rat. log a rat.
```

[![CI](https://github.com/kuzin/whererat/actions/workflows/ci.yml/badge.svg)](https://github.com/kuzin/whererat/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js_16-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React_19-20232A?logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-0F172A?logo=tailwindcss&logoColor=38BDF8)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)

---

## Features

- 🎬 Catalog with genre, rodent type, and sort filters
- 🐁 Per-movie pages with sighting carousels and rat-presence visuals
- 🖼️ Spoiler mode — hides title, description, and images until the viewer opts in
- 📝 Public submission flow with image uploads
- 🛡️ Moderator queue with edits, approvals, and audit log
- 📰 News/updates page
- 📱 Native mobile app (Expo Router, `apps/mobile/`)

## Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | **Next.js 16** App Router | Server components by default; `"use client"` only where interaction requires it |
| UI | **React 19** + **Tailwind CSS 4** | PostCSS-based; utility classes differ from v3 in some areas |
| Language | **TypeScript 5** strict mode | Path alias `@/*` → `src/*` |
| Database | **Postgres** via `pg` | Raw SQL only — no ORM. Hosted on **Neon** |
| Storage | **S3** / **Vercel Blob** / local disk | Controlled by env vars in `src/lib/storage.ts` |
| Deploy | **Vercel** via GitHub integration | Auto-deploys from `main` |
| Package manager | **Yarn 4** | Use `yarn add`, not `npm install` |

## Repo layout

```
src/app/        Routes, layouts, server actions
src/components/ Shared UI components
src/lib/        Domain helpers, DB, auth, stores
db/             schema.sql + seed data
scripts/        One-off DB/media scripts (run with tsx)
apps/mobile/    Expo Router native app
public/brand/   Logo SVGs
```

## Prerequisites

- Node.js LTS
- Access to the Vercel project — all secrets (including `DATABASE_URL`) live there

Full environment variable reference: [`ENVIRONMENT.md`](ENVIRONMENT.md).

The app uses a single **Neon Postgres** database for all environments. There's no local database — pull the connection string from Vercel. Sanity check: `GET /api/health/db` should return `{ ok: true }` when Postgres is reachable.

## Local setup

```bash
# 1. Install dependencies
yarn install

# 2. Pull secrets from Vercel (gives you DATABASE_URL + all other env vars)
vercel env pull .env.local --environment=development

# 3. Start the dev server
yarn dev

# 4. Verify DB connectivity
curl http://localhost:3000/api/health/db
```

> All environments share the same Neon database — there is no local Postgres instance.

More database notes: [`db/README.md`](db/README.md).

## Scripts

| Script | Purpose |
|--------|---------|
| `yarn dev` | Development server |
| `yarn build` | Production build |
| `yarn lint` | ESLint (includes jsx-a11y WCAG AA rules) |
| `yarn typecheck` | TypeScript check (no emit) |
| `yarn db:schema:apply` | Apply `db/schema.sql` to `DATABASE_URL` |
| `yarn db:seed` | Truncate seeded tables and load `db/seed.json` |
| `yarn db:bootstrap` | Export seed → apply schema → seed |
| `yarn db:clear:content` | Clear catalog/submissions; **keeps** existing `accounts` rows |
| `yarn seed:postgres:export` | Regenerate `db/seed.json` from in-repo catalog + moderator accounts |

## CI & Deploy

All production deploys are gated by CI.

```
PR opened
  └─ CI runs (lint + typecheck + build)
       ├─ ❌ fails → merge blocked
       └─ ✅ passes → merge to main
                         └─ Vercel auto-deploys via GitHub integration
```

**Never push directly to `main`** — open a PR and let CI gate the deploy.

## Production checklist

1. Confirm all env vars are set in Vercel for Production and Preview scopes (see [`ENVIRONMENT.md`](ENVIRONMENT.md)).
2. Run `yarn db:schema:apply` against Neon if the schema has changed.
3. Confirm `BLOB_READ_WRITE_TOKEN` is set — without it, images are written to ephemeral disk and lost on deploy.
4. Confirm `GET /api/health/db` returns `{ ok: true }` after deploy.

## Notes

- **OMDb** (`OMDB_API_KEY`) improves movie title search when set.
- **TMDB** (`TMDB_*`) improves backdrop/lightbox stills on movie pages.

## Contributing

WhereRat is an open project. Contributions of all kinds are welcome.

**Reporting a bug or suggesting a feature**

Open an issue at **[github.com/kuzin/whererat/issues](https://github.com/kuzin/whererat/issues)**. Please include:
- What you expected vs. what actually happened (for bugs)
- A clear description and motivation (for feature requests)

**Submitting a pull request**

1. Fork the repo and create a branch from `main`.
2. Follow the existing conventions — no ORM, server components by default, raw SQL with parameterized queries.
3. Run `yarn lint && yarn typecheck` before pushing — CI will block merges that don't pass.
4. Open a PR against `main` describing what changed and why.

For anything bigger (new features, refactors), open an issue first so we can align before you invest time writing code.

## License

[MIT](LICENSE) © Mike Kuzin
