import {
  createModeratorSession,
  getModeratorAccounts,
  type ModeratorAccount,
} from "@/lib/auth";
import { getDbPool } from "@/lib/db";

async function ensureSeedAccounts() {
  const pool = getDbPool();
  const existing = await pool.query<{ count: string }>("select count(*)::text as count from accounts");
  if ((Number(existing.rows[0]?.count ?? "0") || 0) > 0) return;
  for (const account of getModeratorAccounts()) {
    await pool.query(
      `insert into accounts
        (id, username, display_name, email, avatar_url, role, password_hash)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      [
        account.id,
        account.username,
        account.name,
        account.email,
        account.avatarUrl,
        account.role,
        account.password,
      ],
    );
  }
}

function rowToAccount(row: {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url: string;
  role: "owner" | "moderator";
  password_hash: string;
}): ModeratorAccount {
  return {
    id: row.id,
    username: row.username,
    name: row.display_name,
    email: row.email,
    avatarUrl: row.avatar_url,
    role: row.role,
    password: row.password_hash,
  };
}

export async function readUserStore() {
  await ensureSeedAccounts();
  const pool = getDbPool();
  const result = await pool.query<{
    id: string;
    username: string;
    display_name: string;
    email: string;
    avatar_url: string;
    role: "owner" | "moderator";
    password_hash: string;
  }>(
    `select id, username, display_name, email, avatar_url, role, password_hash
     from accounts
     order by username asc`,
  );
  return {
    version: 1,
    accounts: result.rows.map(rowToAccount),
  };
}

export async function authenticateStoredModerator(
  username: string,
  password: string,
) {
  const state = await readUserStore();
  const normalizedUsername = username.trim().toLowerCase();

  return state.accounts.find(
    (account) =>
      account.username === normalizedUsername && account.password === password,
  );
}

export async function getStoredModeratorById(userId: string) {
  const state = await readUserStore();

  return state.accounts.find((account) => account.id === userId);
}

export async function updateStoredModeratorProfile({
  userId,
  name,
  email,
  avatarUrl,
  role,
}: {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: ModeratorAccount["role"];
}) {
  await ensureSeedAccounts();
  const pool = getDbPool();
  const updated = await pool.query<{
    id: string;
    username: string;
    display_name: string;
    email: string;
    avatar_url: string;
    role: "owner" | "moderator";
    password_hash: string;
  }>(
    `update accounts
        set display_name = $2,
            email = $3,
            avatar_url = $4,
            role = $5,
            updated_at = now()
      where id = $1
      returning id, username, display_name, email, avatar_url, role, password_hash`,
    [userId, name, email, avatarUrl, role],
  );
  const updatedAccount = updated.rows[0];
  if (!updatedAccount) return undefined;
  const account = rowToAccount(updatedAccount);
  return {
    account,
    sessionValue: createModeratorSession(account),
  };
}

export async function updateStoredModeratorPassword({
  userId,
  currentPassword,
  nextPassword,
}: {
  userId: string;
  currentPassword: string;
  nextPassword: string;
}) {
  if (nextPassword.length < 6) {
    return false;
  }
  await ensureSeedAccounts();
  const pool = getDbPool();
  const result = await pool.query(
    `update accounts
        set password_hash = $3,
            updated_at = now()
      where id = $1 and password_hash = $2`,
    [userId, currentPassword, nextPassword],
  );
  return result.rowCount > 0;
}
