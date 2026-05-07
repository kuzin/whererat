# Environment files cheat sheet

## Tracked templates (safe to commit)

| File | Purpose |
|------|---------|
| [`.env.example`](.env.example) | Starter for **`npm run dev`** and DB scripts (`cp .env.example .env.local`, then fill secrets). |
| [`apps/mobile/.env.example`](apps/mobile/.env.example) | Starter for Expo (`apps/mobile`; only `EXPO_PUBLIC_*`). |

## Local secrets (gitignored — never commit)

| File | Who reads it |
|------|----------------|
| **`.env.local`** (repo root) | **Next.js** + `tsx` scripts that import `scripts/load-env.ts`. Put **`DATABASE_URL`**, storage keys, moderation secrets, cron tokens, etc. here. |
| **`apps/mobile/.env`** | **Expo / Metro** in `apps/mobile` (bundles only `EXPO_PUBLIC_*`). Use **`EXPO_PUBLIC_API_BASE_URL`** when hitting a local Next dev server from a simulator or phone. |

Next does **not** read `apps/mobile/.env`; Expo does **not** read the root `.env.local`. Keep them separate on purpose.

## Vercel / hosted

Production and Preview vars live in **Vercel → Project → Settings → Environment Variables**.

To refresh **your laptop** copy of prod envs:

```bash
vercel env pull .env.local --environment=production
```

Set **`DATABASE_URL`** (and any other secrets) separately for **Preview** vs **Production** if both need the database.

After `vercel env pull`, you often get noisy keys — **`VERCEL_*`**, **`TURBO_*`**, **`NX_DAEMON`** — that **plain `npm run dev` ignores**. Feel free to delete those lines locally to tidy up.

## Postgres URL variable names

`src/lib/db.ts` tries, in order: **`DATABASE_URL`**, **`POSTGRES_URL`**, **`POSTGRES_PRISMA_URL`**, **`DATABASE_URL_UNPOOLED`**.
