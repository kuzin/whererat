# WhereRat

WhereRat is a Next.js app for tracking rat sightings in movies, with:

- public catalog + movie pages
- public submission flow
- moderator review queue and history
- profile/account management
- Postgres-backed data layer and seed/bootstrap scripts

## Tech Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS
- Postgres (`pg`)

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Set env vars in `.env.local`:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/whererat
TMDB_READ_ACCESS_TOKEN=your_tmdb_read_access_token
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-whererat-bucket
S3_PUBLIC_BASE_URL=https://your-cdn-or-bucket-hostname
AWS_ACCESS_KEY_ID=optional_if_not_using_iam_role
AWS_SECRET_ACCESS_KEY=optional_if_not_using_iam_role
UPLOAD_FALLBACK_TO_LOCAL=true
```

4. Bootstrap schema + seed data:

```bash
npm run db:bootstrap
```

5. Run the app:

```bash
npm run dev
```

6. Verify DB health:

```bash
curl http://localhost:3000/api/health/db
```

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build
- `npm run start` - run production build
- `npm run lint` - run ESLint
- `npm run seed:postgres:export` - generate `db/seed.json` from in-repo seed structures
- `npm run db:schema:apply` - apply `db/schema.sql` to `DATABASE_URL`
- `npm run db:seed` - seed Postgres from `db/seed.json`
- `npm run db:bootstrap` - export seed + apply schema + seed DB

## Database Files

- `db/schema.sql` - baseline relational schema
- `db/seed.json` - generated DB-ready seed payload
- `db/README.md` - extra notes for DB prep

## Production Checklist

- Provision managed Postgres.
- Set `DATABASE_URL` in production environment.
- Run:
  - `npm run db:schema:apply`
  - `npm run db:seed`
- Deploy app (`npm run build` + `npm run start`, or platform equivalent).
- Verify `GET /api/health/db` returns `{ ok: true }`.

## Notes

- Use `.env.local` (not `local.env`) for local configuration.
- DB scripts explicitly load `.env.local`/`.env`.
- Uploads use S3 automatically when `AWS_REGION` + `S3_BUCKET_NAME` are set.
- If `S3_PUBLIC_BASE_URL` is set, uploaded image URLs use that host (CloudFront/CDN-ready).
