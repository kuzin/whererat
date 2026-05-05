# Postgres Prep

This folder contains migration-prep assets while the app still runs on local JSON stores.

## Files

- `schema.sql`: baseline relational schema for movies, sightings, submissions, moderation, and accounts.
- `seed.json`: generated seed rows in DB-friendly shape (created by export script).

## Generate seed export

```bash
npm run seed:postgres:export
```

This reads current in-repo seed structures and writes `db/seed.json`.

## Apply schema and seed a database

```bash
npm run db:schema:apply
npm run db:seed
```

Both commands require `DATABASE_URL` to be set.

## Runtime check

Once running with `DATABASE_URL`, you can verify connectivity:

- `GET /api/health/db`

## Notes

- `password_hash` in the seed export is currently plaintext from local dev accounts and should be replaced with proper hashed credentials before production rollout.
- JSON store files in `data/` remain the live source until repositories/actions are switched to Postgres-backed adapters.
