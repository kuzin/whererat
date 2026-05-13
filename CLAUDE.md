@AGENTS.md

# WhereRat — project guide for Claude

## What this is

WhereRat (whererat.com) is a spoiler-aware catalog of rat cameos in movies and TV. Users submit sightings; moderators approve them. The site is read-only to the public except for the submission form.

## Monorepo layout

```
/                   Next.js 16 web app (focus here)
src/app/            App Router pages + API routes
src/lib/            Shared server-side logic (DB, auth, stores)
src/components/     Shared UI components
db/                 schema.sql + seed data
scripts/            One-off DB/media scripts (run with tsx)
apps/mobile/        Expo Router native app — NOT in scope for now
```

## Tech stack

- **Next.js 16** App Router — read `node_modules/next/dist/docs/` before using APIs you're unsure of; this version has breaking changes vs training data
- **React 19** — server components are the default; avoid `"use client"` unless interaction requires it
- **Tailwind CSS 4** — PostCSS-based; utility classes differ from v3 in some cases
- **Postgres** via `pg` (no ORM) — raw SQL through `getDbPool()` in `src/lib/db.ts`
- **TypeScript 5** strict mode; path alias `@/*` → `src/*`
- **Package manager: Yarn 4** — use `yarn` not `npm` or `pnpm`

## Key library files

| File | Purpose |
|------|---------|
| `src/lib/db.ts` | Postgres pool — always import `getDbPool()` |
| `src/lib/auth.ts` | Cookie-based session auth for moderators |
| `src/lib/movie-catalog.ts` | Catalog queries (search, filter, genres) |
| `src/lib/moderation-store.ts` | Sighting merging, submission tallies |
| `src/lib/movie-edit-store.ts` | Soft-delete / override logic |
| `src/lib/whererat.ts` | Domain helpers (rat estimation, etc.) |
| `src/lib/imdb.ts` | IMDb/OMDb metadata fetching |
| `src/lib/storage.ts` | Image upload (S3 / Vercel Blob / local disk) |
| `src/lib/rate-limit.ts` | IP-based rate limiting for submissions |

## Database schema (key tables)

- **movies** — catalog titles; `slug` is the URL key; `metadata` JSONB holds IMDb snapshot
- **sightings** — approved rat moments linked to `movie_id`; `is_deleted` soft-delete
- **submissions** — moderation queue (`status`: pending | approved | rejected)
- **movie_overrides / sighting_overrides** — JSONB patches applied at read time
- **sighting_images / submission_images** — image carousels
- **review_actions** — audit log of moderator decisions
- **accounts** — moderator users (owner | moderator roles)

## Auth pattern

Moderator sessions are HMAC-signed cookies (`whererat_moderator`). Check session in server components/actions via `parseModeratorSession()`. Public pages need no auth. The submit form is public but rate-limited (5/IP/hour).

## API routes

- `GET /api/v1/catalog` — paginated catalog (used by mobile too; don't break)
- `GET /api/v1/movies/[slug]` — movie detail + sightings (used by mobile)
- `POST /api/v1/submissions` — mobile submission endpoint
- `GET /api/movies/search` — IMDb title search for submit autocomplete
- `POST /api/uploads/sighting-images` — image upload

## Coding rules

- **Server components by default.** Add `"use client"` only when necessary.
- **No ORM.** Write raw SQL. Use parameterized queries — never string-interpolate user input.
- **Soft deletes.** Movies and sightings use `is_deleted`; always filter `WHERE is_deleted = false`.
- **Overrides system.** `movie_overrides` and `sighting_overrides` patch fields at read time via JSONB merge — respect this when reading data.
- **Image storage.** Use `src/lib/storage.ts` — supports S3, Vercel Blob, and local disk based on env vars.
- **Rate limiting.** Submission endpoints use `src/lib/rate-limit.ts` — don't bypass it.
- **Mobile API contract.** `/api/v1/*` routes are consumed by the native app. Don't change response shapes without versioning.
- **Yarn 4** — run `yarn add` not `npm install`.

## Environment

See `ENVIRONMENT.md`. Short version:
- Root `.env.local` → Next.js + tsx scripts
- `apps/mobile/.env` → Expo only (don't touch for web work)
- DB connection: set `DATABASE_URL` (preferred); `src/lib/db.ts` also tries `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `DATABASE_URL_UNPOOLED`

## Running locally

```bash
yarn dev          # Next.js dev server on :3000
yarn build        # production build
yarn lint         # ESLint
tsx scripts/...   # one-off scripts (load .env.local automatically)
```

## Deploy workflow

Production deploys are gated by CI. **Never push directly to `main`** — always open a PR.

```
PR → CI (lint + typecheck + build) must pass → merge to main → Vercel auto-deploys
```

- CI is defined in `.github/workflows/ci.yml` — job name `CI / Lint, typecheck, build`
- Vercel is connected via GitHub app integration; it deploys automatically from `main`
- **Do not use `vercel deploy` CLI** — the GitHub integration handles it
- GitHub branch protection on `main` requires the CI check before merge
- If asked to deploy, verify CI passes on the latest push to `main` (check GitHub Actions), then confirm Vercel picked it up automatically

## What NOT to do

- Don't touch `apps/mobile/` unless explicitly asked
- Don't add an ORM (Prisma, Drizzle) — the project uses raw pg intentionally
- Don't use Pages Router patterns — this is App Router only
- Don't add `"use client"` to components that don't need interactivity
- Don't break `/api/v1/*` response shapes (mobile client depends on them)
