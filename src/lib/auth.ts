import { createHmac, timingSafeEqual, randomUUID } from "crypto";

export const MODERATOR_SESSION_COOKIE = "whererat_moderator";

/** Matches seeded moderator avatar; used for favicon / PWA icons (single source of truth). */
export const SEEDED_MODERATOR_AVATAR_URL = "/favicon.svg";

const SESSION_SECRET =
  process.env.SESSION_SECRET ?? "dev-insecure-secret-change-in-prod";

if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  console.warn(
    "SECURITY WARNING: SESSION_SECRET env var is not set. " +
      "Sessions are signed with an insecure default key. Set SESSION_SECRET in production.",
  );
}

export type ModeratorAccount = {
  id: string;
  username: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: "owner" | "moderator";
  password: string;
};

export type ModeratorSession = Omit<ModeratorAccount, "password">;

type SignedSessionPayload = ModeratorSession & { exp: number };

export function getModeratorAccounts(): ModeratorAccount[] {
  const password =
    process.env.MODERATOR_ADMIN_PASSWORD ??
    process.env.MODERATOR_CURATOR_PASSWORD ??
    process.env.MODERATOR_PASSWORD;

  if (process.env.NODE_ENV === "production" && !password) {
    console.error(
      "SECURITY: No moderator password configured. Set MODERATOR_ADMIN_PASSWORD.",
    );
  }

  return [
    {
      id: "admin",
      username: "admin",
      name: "Admin",
      email: "admin@whererat.local",
      avatarUrl: SEEDED_MODERATOR_AVATAR_URL,
      role: "owner",
      password:
        password ??
        (process.env.NODE_ENV === "production" ? randomUUID() : "ratpack"),
    },
  ];
}

export function authenticateModerator(username: string, password: string) {
  const normalizedUsername = username.trim().toLowerCase();

  return getModeratorAccounts().find(
    (account) =>
      account.username === normalizedUsername && account.password === password,
  );
}

function hmacSign(payload: string): string {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
}

export function createModeratorSession(account: ModeratorAccount): string {
  const sessionPayload: SignedSessionPayload = {
    id: account.id,
    username: account.username,
    name: account.name,
    email: account.email,
    avatarUrl: account.avatarUrl,
    role: account.role,
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  };

  const payload = Buffer.from(JSON.stringify(sessionPayload), "utf8").toString("base64url");
  const sig = hmacSign(payload);
  return `${payload}.${sig}`;
}

export function parseModeratorSession(value: string | undefined): ModeratorSession | undefined {
  if (!value) {
    return undefined;
  }

  // Old unsigned format (no dot) — reject and force re-login
  if (!value.includes(".")) {
    return undefined;
  }

  try {
    const dotIndex = value.lastIndexOf(".");
    const payload = value.slice(0, dotIndex);
    const sig = value.slice(dotIndex + 1);

    const expectedSig = hmacSign(payload);
    const sigBuf = Buffer.from(sig, "base64url");
    const expectedBuf = Buffer.from(expectedSig, "base64url");

    if (
      sigBuf.length !== expectedBuf.length ||
      !timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return undefined;
    }

    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as SignedSessionPayload;

    if (!parsed.id || !parsed.username || !parsed.name || !parsed.role) {
      return undefined;
    }

    if (parsed.exp !== undefined && parsed.exp < Math.floor(Date.now() / 1000)) {
      return undefined;
    }

    const { exp: _exp, ...session } = parsed;
    return session;
  } catch {
    return undefined;
  }
}

export function canAutoApproveSubmissions(session: ModeratorSession | undefined) {
  return Boolean(session);
}
