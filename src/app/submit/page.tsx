import { cookies } from "next/headers";
import {
  canAutoApproveSubmissions,
  MODERATOR_SESSION_COOKIE,
  parseModeratorSession,
} from "@/lib/auth";
import { submitSighting } from "./actions";
import { SubmitForm } from "./submit-form";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SubmitPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const params = searchParams ? await searchParams : {};
  const status = single(params.status);

  const forImdbId = single(params.for)?.trim();
  const forTitle = single(params.title)?.trim();
  const forYear = single(params.year)?.trim();
  const forPoster = single(params.poster)?.trim();
  const initialMovie =
    forImdbId && forTitle
      ? { imdbId: forImdbId, title: forTitle, year: forYear ?? "", posterUrl: forPoster ?? "" }
      : undefined;

  const cookieStore = await cookies();
  const moderatorSession = parseModeratorSession(
    cookieStore.get(MODERATOR_SESSION_COOKIE)?.value,
  );
  const canAutoApprove = canAutoApproveSubmissions(moderatorSession);

  return (
    <main className="wr-page-shell py-10">
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="self-start overflow-hidden rounded-2xl border wr-panel-warm">
          <div className="p-8">
            <div className="text-4xl leading-none sm:text-5xl">
              <span aria-hidden>🐀</span>
            </div>
            <h1 className="wr-display mt-4 text-4xl font-bold tracking-tight">
              Submit a rat sighting
            </h1>
            <ul className="mt-6 space-y-1">
              {[
                { icon: "🎬", label: "Pick the movie", sub: "Search by title, select from IMDb results." },
                { icon: "✏️", label: "Give it a title", sub: "A short name for the sighting." },
                { icon: "📍", label: "Mark where it happens", sub: "Drag to the rough point in the film." },
                { icon: "🐀", label: "Count the rats", sub: "Approximate is fine." },
                { icon: "📝", label: "Describe what you see", sub: "Be specific — location on screen, what it's doing." },
                { icon: "⚠️", label: "Spoiler? Flag it", sub: "If it gives away a major plot point." },
                { icon: "📸", label: "Attach a screenshot", sub: "Optional but appreciated." },
              ].map(({ icon, label, sub }) => (
                <li key={label} className="flex items-center gap-3.5 rounded-xl py-3 pr-3 transition-colors hover:bg-orange-950/5 dark:hover:bg-amber-100/5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-orange-900/15 bg-orange-950/8 text-xl leading-none dark:border-amber-100/10 dark:bg-amber-100/10" aria-hidden>{icon}</span>
                  <span>
                    <span className="block font-bold text-orange-950 dark:text-amber-50">{label}</span>
                    <span className="block text-sm text-orange-950/55 dark:text-amber-100/60">{sub}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="wr-card p-7 sm:p-8">
          <div className="mb-6 border-b border-stone-900/8 pb-6 dark:border-white/8">
            <p className="text-lg font-bold text-stone-900 dark:text-stone-100">Spotted a rat? Tell us everything.</p>
            <p className="mt-1 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
              Pick the movie, mark where it happens, and describe what you saw. Moderators review every submission before it goes live.{" "}
              <a href="/guidelines" className="font-semibold underline underline-offset-2 hover:text-stone-700 dark:hover:text-stone-300">
                Read the guidelines →
              </a>
            </p>
          </div>
          {status === "no-imdb" ? (
            <div className="mb-6 rounded-xl border border-amber-800/35 bg-amber-50 p-4 text-sm font-medium text-amber-950 dark:border-amber-400/35 dark:bg-amber-950/45 dark:text-amber-100">
              Choose a movie from the search dropdown so we store a real{" "}
              <span className="font-bold">IMDb title ID</span> (tt…) and poster.
              Free‑typed titles alone aren’t enough.
            </div>
          ) : null}
          {status === "rate-limited" ? (
            <div className="mb-6 rounded-xl border border-red-800/35 bg-red-50 p-4 text-sm font-medium text-red-900 dark:border-red-400/35 dark:bg-red-950/50 dark:text-red-100">
              Too many submissions. Please wait before submitting again.
            </div>
          ) : null}
          <SubmitForm
            submitAction={submitSighting}
            canAutoApprove={canAutoApprove}
            moderatorName={moderatorSession?.name}
            loggedInName={moderatorSession?.name}
            loggedInEmail={moderatorSession?.email}
            initialMovie={initialMovie}
          />
        </div>
      </section>
    </main>
  );
}
