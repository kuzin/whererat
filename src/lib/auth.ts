export const MODERATOR_SESSION_COOKIE = "whererat_moderator";

/** Matches seeded moderator avatar; used for favicon / PWA icons (single source of truth). */
export const SEEDED_MODERATOR_AVATAR_URL =
  "https://placehold.co/160x160/292524/fef3c7/png?text=Admin";

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

export function getModeratorAccounts(): ModeratorAccount[] {
  return [
    {
      id: "admin",
      username: "admin",
      name: "Admin",
      email: "admin@whererat.local",
      avatarUrl: SEEDED_MODERATOR_AVATAR_URL,
      role: "owner",
      password:
        process.env.MODERATOR_ADMIN_PASSWORD ??
        process.env.MODERATOR_CURATOR_PASSWORD ??
        process.env.MODERATOR_PASSWORD ??
        "ratpack",
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

export function createModeratorSession(account: ModeratorAccount) {
  const session: ModeratorSession = {
    id: account.id,
    username: account.username,
    name: account.name,
    email: account.email,
    avatarUrl: account.avatarUrl,
    role: account.role,
  };

  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

export function parseModeratorSession(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  try {
    const session = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as ModeratorSession;

    if (!session.id || !session.username || !session.name || !session.role) {
      return undefined;
    }

    return session;
  } catch {
    return undefined;
  }
}

export function canAutoApproveSubmissions(session: ModeratorSession | undefined) {
  return Boolean(session);
}
