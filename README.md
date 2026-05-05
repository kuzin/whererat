This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Postgres Setup

1. Copy env template:

```bash
cp .env.example .env.local
```

2. Export DB-ready seed:

```bash
npm run seed:postgres:export
```

3. Apply schema and seed:

```bash
npm run db:schema:apply
npm run db:seed
```

Or run all setup in one command:

```bash
npm run db:bootstrap
```

4. Verify DB health:

```bash
curl http://localhost:3000/api/health/db
```

## Production deploy checklist

- Provision Postgres and set `DATABASE_URL` in your host environment.
- Run `npm run db:schema:apply` and `npm run db:seed` against the production DB before first traffic.
- Deploy app (`npm run build`, then `npm run start` on host).
- Hit `/api/health/db` after deploy to verify runtime DB connectivity.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
