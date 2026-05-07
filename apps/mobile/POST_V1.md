# Post‑V1 (deferred): submit, uploads, authentication

Native v1 intentionally ships **read-only**: catalog browsing, movie detail, public sightings, and IMDb‑synced tabs. **No submission, uploads, moderator tools, sessions, JWT, or owner editing** in this release.

Likely sequencing for later milestones:

1. **Submit sightings** — POST APIs, image upload (e.g. Vercel Blob), validation, and moderation queue alignment with web.
2. **Authentication** — when account-scoped flows are needed (profiles, moderated actions), add token or session-backed routes; keep `/api/v1/*` anonymous read contract unchanged for backward-compatible clients.

This document is descriptive only; detailed API design waits until product confirms auth scope and moderation parity with the Next.js site.
