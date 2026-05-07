/**
 * Reads env vars by key built at runtime. Next/Webpack/Turbopack can bake in
 * `process.env.NAME` when `NAME` is missing at bundle time — this avoids that
 * for secrets added or rotated via the Vercel dashboard after builds.
 */
export function runtimeEnvVar(...keyParts: string[]): string | undefined {
  const key = keyParts.join("");
  const raw = (process.env as Record<string, string | undefined>)[key];
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length ? trimmed : undefined;
}
