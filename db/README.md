# Postgres Prep

## Files

- `schema.sql`: baseline relational schema for movies, sightings, submissions, moderation, and accounts.
- `seed.json`: generated seed rows in DB-friendly shape (`npm run seed:postgres:export`).

## Generate seed export

```bash
npm run seed:postgres:export
```

This reads in-repo catalog structures (`src/lib/whererat.ts` via `@/lib/postgres-seed`) and writes `db/seed.json`.

## Apply schema and seed a database

```bash
npm run db:schema:apply
npm run db:seed
```

Both commands require `DATABASE_URL` to be set.

## Reset options

**Wipe catalog/submissions but keep existing accounts** (moderator logins unchanged until you change them in the DB):

```bash
npm run db:clear:content
```

**Full reseed from `db/seed.json`** (truncates all seed tables including accounts, then inserts whatever is in `seed.json`):

```bash
npm run db:seed
```

## Runtime check

Once running with `DATABASE_URL`:

- `GET /api/health/db`

## Notes

- `password_hash` in the seed export is plaintext for local moderator bootstrap only — replace with proper hashed credentials before production rollout.
