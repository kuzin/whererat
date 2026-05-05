export const MODERATOR_SESSION_COOKIE = "whererat_moderator";

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
      id: "curator",
      username: "curator",
      name: "Curator",
      email: "curator@whererat.local",
      avatarUrl:
        "https://placehold.co/160x160/292524/fef3c7/png?text=Curator",
      role: "owner",
      password:
        process.env.MODERATOR_CURATOR_PASSWORD ??
        process.env.MODERATOR_PASSWORD ??
        "ratpack",
    },
    {
      id: "film-burrow",
      username: "filmburrow",
      name: "FilmBurrow",
      email: "filmburrow@whererat.local",
      avatarUrl:
        "https://placehold.co/160x160/78350f/fef3c7/png?text=FB",
      role: "moderator",
      password: process.env.MODERATOR_FILMBURROW_PASSWORD ?? "burrow",
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
