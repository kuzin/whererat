# 🐀 WhereRat

> *They were in that movie. You saw them. Now you can log them.*

A **spoiler-aware** public catalog of rat (and rodent) cameos in films and TV — with a public submission flow, moderator review queue, and Postgres-backed data.

```
  (\(\
  ( -.-)   whererat.com
  o_(")(")  spot a rat. log a rat.
```

## Features

- 🎬 Catalog home with genre, rodent type, and sort filters
- 🐁 Per-movie pages with sighting carousels + rat presence visuals
- 📝 Public submit flow with image uploads
- 🛡️ Moderator queue, edits, approvals, and audit log
- 👤 Profile (moderator accounts)
- 🖼️ Optional S3 uploads; optional TMDB imagery for movie pages

## Stack

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React_19-20232A?logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-0F172A?logo=tailwindcss&logoColor=38BDF8)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Neon](https://img.shields.io/badge/Neon-00E5BF?logo=neon&logoColor=black)](https://neon.tech)
[![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)
[![Yarn](https://img.shields.io/badge/Yarn_4-2C8EBB?logo=yarn&logoColor=white)](https://yarnpkg.com)

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | **Next.js 16** App Router | Server components by default; `"use client"` only where interaction requires it |
| UI | **React 19** + **Tailwind CSS 4** | PostCSS-based Tailwind; utility classes differ from v3 in some areas |
| Language | **TypeScript 5** strict mode | Path alias `@/*` → `src/*` |
| Database | **Postgres** via `pg` | Raw SQL only — no ORM. All envs point at a shared **Neon** instance |
| Storage | **S3** / **Vercel Blob** / local disk | Controlled by env vars in `src/lib/storage.ts` |
| Deploy | **Vercel** via GitHub integration | Auto-deploys from `main`; never use `vercel deploy` CLI directly |
| Package manager | **Yarn 4** | Use `yarn add`, not `npm install` |

## Prerequisites

- Node.js (LTS recommended)
- Access to the Vercel project — all secrets (including `DATABASE_URL`) live there

Full layout of **`.env*`** files: **[`ENVIRONMENT.md`](ENVIRONMENT.md)**.

The app uses a single **Neon Postgres** database for all environments. There's no local database — `DATABASE_URL` points at the live Neon instance in every context. Pull it via `vercel env pull` (see Local setup below).

Sanity check: **`GET /api/health/db`** should return **`{ ok: true }`** when Postgres is reachable.

## Local setup

**1.** Install dependencies:

```bash
yarn install
```

**2.** Pull secrets from Vercel:

```bash
vercel env pull .env.local --environment=development
```

This gives you `DATABASE_URL` (pointing at the live Neon DB) plus all other secrets. You can also copy `.env.example` → `.env.local` and fill values from the Vercel dashboard manually.

> All environments (local, Preview, Production) share the same Neon database — there's no local Postgres instance.

**3.** Dev server:

```bash
yarn dev
```

**4.** Sanity check DB:

```bash
curl http://localhost:3000/api/health/db
```

More database notes: [`db/README.md`](db/README.md).

## Scripts

| Script | Purpose |
|--------|--------|
| `yarn dev` | Development server |
| `yarn build` | Production build |
| `yarn start` | Run production server |
| `yarn lint` | ESLint |
| `yarn typecheck` | TypeScript check (no emit) |
| `yarn seed:postgres:export` | Regenerate `db/seed.json` from in-repo catalog + moderator accounts |
| `yarn db:schema:apply` | Apply `db/schema.sql` to `DATABASE_URL` |
| `yarn db:seed` | Truncate seeded tables and load `db/seed.json` |
| `yarn db:bootstrap` | Export seed → apply schema → seed |
| `yarn db:clear:content` | Clear catalog/submissions/etc.; **keeps** existing `accounts` rows |
| `npx tsx scripts/db-add-temp-content.ts` | Add temporary bulk content (~30 movies / few hundred sightings) directly to live tables for UI density checks |

## Repo layout (high level)

| Path | Role |
|------|------|
| `src/app/` | Routes, layouts, server actions |
| `src/components/site-masthead.tsx` | Sticky header (brand + nav) — primary place to tweak masthead markup |
| `src/app/globals.css` | Theme tokens incl. masthead (`--wr-header-*`, `--wr-brand-*`) |
| `public/brand/` | Header logo SVGs (`rat.svg` mark, `logo.svg` wordmark) |
| `src/lib/` | Domain helpers, catalog types, DB, auth |
| `db/schema.sql`, `db/seed.json` | Postgres schema + generated seed payload |

## Customizing the masthead

Iterating on the **top bar** is easiest here:

1. **`src/components/site-masthead.tsx`** — Structure, Tailwind classes for the bar (`sticky`, padding, blur), brand link hit area, top nav theme toggle placement.
2. **`src/app/globals.css`** — Masthead chrome: `--wr-header-bg`, `--wr-header-border`, and logo mask colors `--wr-brand-mark`, `--wr-brand-wordmark` (both light `:root` and `.dark`).
3. **`src/app/nav-links.tsx`** — Catalog / Submit / Moderate / Profile links and mobile drawer.
4. **`public/brand/rat.svg`** & **`public/brand/logo.svg`** — Assets behind the CSS masks (see `.wr-brand-mark` / `.wr-brand-wordmark` in `globals.css`). Paths are exported from `src/lib/brand.ts` if you rename files.

Icons / PWA: favicon + manifest icons use **`SEEDED_MODERATOR_AVATAR_URL`** (`src/lib/auth.ts`) plus `src/app/manifest.ts`.

## CI & Deploy 🐀

All production deploys go through GitHub Actions first.

```
PR opened
  └─ CI runs (lint + typecheck + build)
       ├─ ❌ fails → merge blocked
       └─ ✅ passes → PR can merge to main
                         └─ Vercel auto-deploys via GitHub integration
```

**GitHub branch protection required** (`main`):
- Require pull request before merging
- Required status check: `CI / Lint, typecheck, build`
- Require branches to be up to date before merging

**Vercel**: connected via GitHub app — deploys automatically on push to `main`. No CLI deploys needed. Enable **Deployment Protection** in Vercel project settings for the extra status check gating on PRs.

**Never push directly to `main`** — open a PR and let CI gate the deploy.

## Production checklist

1. Secrets: confirm all vars are set in Vercel for Production and Preview scopes (see [`ENVIRONMENT.md`](ENVIRONMENT.md)).
2. Schema changes: run `yarn db:schema:apply` against Neon if schema has changed.
3. Uploads: confirm `BLOB_READ_WRITE_TOKEN` is set — without it images are written to ephemeral disk and lost on each deploy.
4. Confirm **`GET /api/health/db`** returns `{ ok: true }` after deploy.

## Notes

- Use **`.env.local`** for local overrides (never commit secrets).
- **OMDb** (`OMDB_API_KEY`) improves movie title search when set (`src/app/api/movies/search`).
- **`TMDB_*`** improves backdrops/lightbox stills on movie pages (`src/lib/tmdb-banner.ts`); catalog can be empty until you rebuild seed/data.
- Temporary bulk data inserted by `scripts/db-add-temp-content.ts` uses IDs prefixed with `temp-livefill-` so it can be removed easily later.
