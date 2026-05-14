import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { MODERATOR_SESSION_COOKIE, parseModeratorSession, type ModeratorAccount } from "@/lib/auth";
import { readUserStore } from "@/lib/user-store";
import { ModalShell } from "@/components/modal-shell";
import { AvatarUploadField } from "@/app/profile/avatar-upload-field";
import { createUserAction, updateUserAction, deleteUserAction } from "./actions";

export const metadata: Metadata = {
    title: "Manage Users",
    robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function single(v: string | string[] | undefined) {
    return Array.isArray(v) ? v[0] : v;
}

const ICON_BTN =
    "wr-btn-ghost inline-flex h-11 w-11 items-center justify-center px-0 py-0";

const ICON_BTN_DANGER =
    "inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border-2 border-red-700/30 bg-red-50/80 text-red-700 outline-none transition shadow-[2px_2px_0_0_rgb(185_28_28/0.28)] hover:border-red-700/45 hover:bg-red-100 hover:shadow-[2px_2px_0_0_rgb(185_28_28/0.35)] active:brightness-95 active:shadow-none dark:border-red-400/25 dark:bg-red-950/40 dark:text-red-400 dark:shadow-[2px_2px_0_0_rgb(0_0_0/0.32)] dark:hover:bg-red-950/60";

const ERROR_MESSAGES: Record<string, string> = {
    missing: "All required fields must be filled in.",
    username_taken: "That username is already taken.",
    email_taken: "That email address is already in use.",
    weak_password: "Password must be at least 6 characters.",
    unknown: "Something went wrong. Please try again.",
};

function RoleBadge({ role }: { role: ModeratorAccount["role"] }) {
    return (
        <span
            className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-[0.12em] ${role === "owner"
                    ? "border-amber-600/70 bg-amber-100 text-amber-900 dark:border-amber-500/40 dark:bg-amber-900/40 dark:text-amber-300"
                    : "border-stone-300 bg-stone-100 text-stone-600 dark:border-white/20 dark:bg-stone-800 dark:text-stone-300"
                }`}
        >
            {role === "owner" ? "Owner" : "Moderator"}
        </span>
    );
}

function UserCreateFields() {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-stone-700 dark:text-stone-200">Display name</span>
                <input name="name" type="text" required placeholder="Jane Smith" className="wr-input" />
            </label>
            <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-stone-700 dark:text-stone-200">Username</span>
                <input name="username" type="text" required placeholder="janesmith" autoComplete="off" className="wr-input" />
            </label>
            <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-stone-700 dark:text-stone-200">Email</span>
                <input name="email" type="email" required placeholder="jane@example.com" className="wr-input" />
            </label>
            <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-stone-700 dark:text-stone-200">Initial password</span>
                <input name="password" type="password" required minLength={6} autoComplete="new-password" className="wr-input" />
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-sm font-bold text-stone-700 dark:text-stone-200">Role</span>
                <select name="role" className="wr-select">
                    <option value="moderator">Moderator</option>
                    <option value="owner">Owner</option>
                </select>
            </label>
            <div className="sm:col-span-2">
                <AvatarUploadField initialAvatarUrl="" displayName="" />
            </div>
        </div>
    );
}

function UserEditFields({ account }: { account: ModeratorAccount }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="userId" value={account.id} />
            <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-stone-700 dark:text-stone-200">Display name</span>
                <input name="name" type="text" required defaultValue={account.name} className="wr-input" />
            </label>
            <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-stone-700 dark:text-stone-200">Email</span>
                <input name="email" type="email" required defaultValue={account.email} className="wr-input" />
            </label>
            <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-stone-700 dark:text-stone-200">Role</span>
                <select name="role" defaultValue={account.role} className="wr-select">
                    <option value="moderator">Moderator</option>
                    <option value="owner">Owner</option>
                </select>
            </label>
            <label className="flex flex-col gap-1.5">
                <span className="flex items-baseline gap-1.5 text-sm font-bold text-stone-700 dark:text-stone-200">
                    New password{" "}
                    <span className="text-xs font-normal text-stone-400">Optional</span>
                </span>
                <input
                    name="password"
                    type="password"
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="Leave blank to keep current"
                    className="wr-input"
                />
            </label>
            <div className="sm:col-span-2">
                <AvatarUploadField initialAvatarUrl={account.avatarUrl} displayName={account.name} />
            </div>
        </div>
    );
}

export default async function ManageUsersPage({
    searchParams,
}: {
    searchParams?: SearchParams;
}) {
    const cookieStore = await cookies();
    const session = parseModeratorSession(
        cookieStore.get(MODERATOR_SESSION_COOKIE)?.value,
    );

    if (!session) redirect("/login?next=/moderation/users");
    if (session.role !== "owner") redirect("/moderation");

    const params = searchParams ? await searchParams : {};
    const editingId = single(params.edit);
    const isCreating = single(params.create) === "1";
    const errorCode = single(params.error);

    const { accounts } = await readUserStore();
    const editingAccount = editingId ? accounts.find((a) => a.id === editingId) : undefined;

    return (
        <main className="wr-page-shell py-10">
            {/* Page header */}
            <div className="mb-6 flex items-center gap-2">
                <Link href="/moderation" className={ICON_BTN} title="Back to Moderation">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                    <span className="sr-only">Back to Moderation</span>
                </Link>
                <h1 className="ml-1 text-2xl font-black text-stone-950 dark:text-stone-50">
                    Manage Users
                </h1>
                <div className="flex-1" />
                <Link href="/moderation/users?create=1" className="wr-btn-primary text-sm">
                    + New user
                </Link>
            </div>

            {/* Users list */}
            <section>
                <h2 className="mb-4 text-lg font-black text-stone-950 dark:text-stone-100">
                    All users{" "}
                    <span className="text-base font-semibold text-stone-400 dark:text-stone-500">
                        ({accounts.length})
                    </span>
                </h2>

                {accounts.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-stone-300 p-10 text-center text-stone-500 dark:border-stone-700 dark:text-stone-400">
                        No users yet. Use the &ldquo;New user&rdquo; button above to create one.
                    </p>
                ) : (
                    <div className="divide-y divide-stone-900/10 rounded-2xl border border-stone-900/12 bg-white dark:divide-white/10 dark:border-white/10 dark:bg-stone-900/70">
                        {accounts.map((account) => (
                            <div key={account.id} className="flex items-center gap-4 px-5 py-4">
                                <Image
                                    src={account.avatarUrl}
                                    alt=""
                                    width={40}
                                    height={40}
                                    className="size-10 shrink-0 rounded-full object-cover"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-stone-950 dark:text-stone-100">{account.name}</p>
                                    <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                                        @{account.username}
                                    </p>
                                    <div className="mt-1.5">
                                        <RoleBadge role={account.role} />
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    <Link
                                        href={`/moderation/users?edit=${account.id}`}
                                        className={ICON_BTN}
                                        title="Edit user"
                                    >
                                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                        <span className="sr-only">Edit</span>
                                    </Link>
                                    {account.id !== session.id && (
                                        <form action={deleteUserAction}>
                                            <input type="hidden" name="userId" value={account.id} />
                                            <button type="submit" className={ICON_BTN_DANGER} title="Delete user">
                                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6l-1 14H6L5 6" />
                                                    <path d="M10 11v6M14 11v6" />
                                                    <path d="M9 6V4h6v2" />
                                                </svg>
                                                <span className="sr-only">Delete</span>
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Create modal */}
            {isCreating && (
                <ModalShell
                    title="New user"
                    closeHref="/moderation/users"
                    footer={
                        <>
                            <Link href="/moderation/users" className="wr-btn-ghost">
                                Cancel
                            </Link>
                            <button form="user-create-form" type="submit" className="wr-btn-primary">
                                Create user
                            </button>
                        </>
                    }
                >
                    <form id="user-create-form" action={createUserAction} className="py-5 grid gap-4">
                        {errorCode && (
                            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 dark:bg-red-950/40 dark:text-red-300">
                                {ERROR_MESSAGES[errorCode] ?? "Something went wrong."}
                            </p>
                        )}
                        <UserCreateFields />
                    </form>
                </ModalShell>
            )}

            {/* Edit modal */}
            {editingAccount && (
                <ModalShell
                    title={`Edit: ${editingAccount.name}`}
                    closeHref="/moderation/users"
                    footer={
                        <>
                            <Link href="/moderation/users" className="wr-btn-ghost">
                                Cancel
                            </Link>
                            <button form="user-edit-form" type="submit" className="wr-btn-primary">
                                Save changes
                            </button>
                        </>
                    }
                >
                    <form id="user-edit-form" action={updateUserAction} className="py-5 grid gap-4">
                        {errorCode && (
                            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 dark:bg-red-950/40 dark:text-red-300">
                                {ERROR_MESSAGES[errorCode] ?? "Something went wrong."}
                            </p>
                        )}
                        <UserEditFields account={editingAccount} />
                    </form>
                </ModalShell>
            )}
        </main>
    );
}
