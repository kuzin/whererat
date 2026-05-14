# Postgres

## Files

- `schema.sql`: relational schema for movies, sightings, submissions, moderation, and accounts.

## Apply schema

```bash
yarn db:schema:apply
```

Requires `DATABASE_URL` to be set.

## Runtime check

Once running with `DATABASE_URL`:

- `GET /api/health/db`
