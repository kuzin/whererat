import type { Metadata } from "next";
import { loginModerator } from "./actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Moderator Login",
  description: "Sign in to access the WhereRat moderation queue.",
  robots: {
    index: false,
    follow: false,
  },
};

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const params = searchParams ? await searchParams : {};
  const next = single(params.next) ?? "/moderation";

  return (
    <main className="wr-page-shell flex flex-1 flex-col items-center justify-center py-10">
      <section className="wr-card w-full max-w-md p-6 sm:p-7">
        <h1 className="wr-display text-3xl font-black tracking-tight">Log in</h1>
        <form action={loginModerator} className="mt-6 grid gap-4">
          <input name="next" type="hidden" value={next} />
          <label className="flex flex-col gap-2.5 text-sm font-bold text-stone-800 dark:text-stone-200">
            Username
            <input
              name="username"
              required
              autoComplete="username"
              placeholder="Enter your username"
              className="wr-input"
            />
          </label>
          <label className="flex flex-col gap-2.5 text-sm font-bold text-stone-800 dark:text-stone-200">
            Password
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              className="wr-input"
            />
          </label>
          <button type="submit" className="wr-btn-primary">
            Log in
          </button>
        </form>
      </section>
    </main>
  );
}
