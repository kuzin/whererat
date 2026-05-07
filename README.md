# WhereRat

Next.js app for a **spoiler-aware** public catalog of rat cameos in films, with submissions, moderator review, and Postgres-backed data.

## Features

- Catalog home + per-movie sighting pages  
- Public submit flow  
- Moderator queue, edits, approvals  
- Profile (moderator accounts)  
- Optional S3 uploads; optional TMDB imagery for movie pages  

## Stack

| Layer | Choice |
|--------|--------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Data | Postgres via `pg` |

## Prerequisites

- Node.js (LTS recommended)  
- Postgres instance and a Postgres URL ([`DATABASE_URL` and fallbacks](ENVIRONMENT.md))  

Full layout of **`.env*`** files: **[`ENVIRONMENT.md`](ENVIRONMENT.md)**.

If anything DB-backed fails with **`DATABASE_URL` is required** or returns **500** on `/api/v1/*`, the running build or server simply **does not have that env var**. After editing `.env.local`, **restart `npm run dev`**. On **Vercel**, set **`DATABASE_URL`** under **Project → Settings → Environment Variables** for **each** scope you need (**Production**, **Preview**, **Development**)—Preview deploys omit vars that aren’t explicitly enabled there—then **redeploy**.

Sanity check: **`GET /api/health/db`** should return **`{ ok: true }`** when Postgres is reachable.

## Local setup

**1.** Install dependencies:

```bash
npm install
```

**2.** Create `.env.local` in the repo root. Start from [`.env.example`](.env.example): `cp .env.example .env.local`, then paste your real **`DATABASE_URL`**. Next and the DB scripts load `.env.local` / `.env` via `scripts/load-env.ts`.

```env
# Required
DATABASE_URL=postgres://postgres:postgres@localhost:5432/whererat

# Moderator login (defaults: admin / ratpack if unset — see src/lib/auth.ts)
# MODERATOR_ADMIN_PASSWORD=
# MODERATOR_PASSWORD=

# Movie search / detail stills — optional but recommended for submit search + widescreen backdrops
# TMDB_READ_ACCESS_TOKEN=

# Uploads → S3 (omit to use local public/uploads when UPLOAD_FALLBACK_TO_LOCAL=true)
# AWS_REGION=
# S3_BUCKET_NAME=
# S3_PUBLIC_BASE_URL=
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
UPLOAD_FALLBACK_TO_LOCAL=true
```

**3.** Apply schema and seed:

```bash
npm run db:bootstrap
```

This runs `seed:postgres:export` (writes `db/seed.json` from `src/lib/whererat.ts`), `db:schema:apply`, and `db:seed`.

**4.** Dev server:

```bash
npm run dev
```

**5.** Sanity check DB:

```bash
curl http://localhost:3000/api/health/db
```

More database notes: [`db/README.md`](db/README.md).

## NPM scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npm run seed:postgres:export` | Regenerate `db/seed.json` from in-repo catalog + moderator accounts |
| `npm run db:schema:apply` | Apply `db/schema.sql` to `DATABASE_URL` |
| `npm run db:seed` | Truncate seeded tables and load `db/seed.json` |
| `npm run db:bootstrap` | Export seed → apply schema → seed |
| `npm run db:clear:content` | Clear catalog/submissions/etc.; **keeps** existing `accounts` rows |
| `npm run media:migrate:uploads-to-s3` | Migrate legacy local uploads to S3 |

## Repo layout (high level)

| Path | Role |
|------|------|
| `src/app/` | Routes, layouts, server actions |
| `src/components/site-masthead.tsx` | Sticky header (brand + nav) — primary place to tweak masthead markup |
| `src/app/globals.css` | Theme tokens incl. masthead (`--wr-header-*`, `--wr-brand-*`) |
| `public/brand/` | Header logo SVGs (`mark.svg`, `wordmark` uses `logo.svg`) |
| `src/lib/` | Domain helpers, catalog types, DB, auth |
| `db/schema.sql`, `db/seed.json` | Postgres schema + generated seed payload |

## Customizing the masthead

Iterating on the **top bar** is easiest here:

1. **`src/components/site-masthead.tsx`** — Structure, Tailwind classes for the bar (`sticky`, padding, blur), brand link hit area, inclusion of `ThemeDevToggle`.
2. **`src/app/globals.css`** — Masthead chrome: `--wr-header-bg`, `--wr-header-border`, and logo mask colors `--wr-brand-mark`, `--wr-brand-wordmark` (both light `:root` and `.dark`).
3. **`src/app/nav-links.tsx`** — Catalog / Submit / Moderate / Profile links and mobile drawer.
4. **`public/brand/mark.svg`** & **`public/brand/logo.svg`** — Assets behind the CSS masks (see `.wr-brand-mark` / `.wr-brand-wordmark` in `globals.css`). Paths are exported from `src/lib/brand.ts` if you rename files.

Icons / PWA: favicon + manifest icons use **`SEEDED_MODERATOR_AVATAR_URL`** (`src/lib/auth.ts`) plus `src/app/manifest.ts`.

## Production checklist

1. Provision Postgres; set **`DATABASE_URL`**.  
2. Set strong moderator secrets (`MODERATOR_ADMIN_PASSWORD`, etc.).  
3. Replace plaintext `password_hash` in **`db/seed.json`** workflow with proper hashing before running `db:seed` in prod (see [`db/README.md`](db/README.md)).  
4. Run `npm run db:schema:apply` and **`npm run db:seed`** (or your migration pipeline).  
5. Configure S3 / CDN vars if uploads should not stay on disk.  
6. Deploy: `npm run build` → `npm run start` (or platform equivalent).  
7. Confirm **`GET /api/health/db`** returns `{ ok: true }`.

## Notes

- Use **`.env.local`** for local overrides (never commit secrets).  
- **OMDb** (`OMDB_API_KEY`) improves movie title search when set (`src/app/api/movies/search`).  
- **`TMDB_*`** improves backdrops/lightbox stills on movie pages (`src/lib/tmdb-banner.ts`); catalog can be empty until you rebuild seed/data.
