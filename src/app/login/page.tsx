import { loginModerator } from "./actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

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
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded-2xl border border-amber-500/35 bg-[#9a3412] p-8 text-[#fef3c7]">
          <h1 className="wr-display text-4xl font-bold tracking-tight">
            Sneak into the rat booth.
          </h1>
          <p className="mt-5 leading-relaxed text-amber-50/85">
            Enter your username and password here to access the moderation tools.
          </p>
        </aside>

        <section className="wr-card p-6 sm:p-7">
          <h2 className="wr-display text-3xl font-black tracking-tight">Log in</h2>
          <form action={loginModerator} className="mt-6 grid gap-4">
            <input name="next" type="hidden" value={next} />
            <label className="flex flex-col gap-2 text-sm font-bold text-stone-800 dark:text-stone-200">
              Username
              <input
                name="username"
                required
                autoComplete="username"
                placeholder="curator"
                className="wr-input"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-bold text-stone-800 dark:text-stone-200">
              Password
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Super secret cheddar"
                className="wr-input"
              />
            </label>
            <button type="submit" className="wr-btn bg-[#fcd34d] text-stone-950">
              Let me moderate things
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
