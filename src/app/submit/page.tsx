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
            <p className="mt-5 leading-relaxed text-orange-950/75 dark:text-amber-50/82">
              Add the movie, scene time, estimated rat count, and a short
              description of what appears on screen (optional Markdown; use Show
              preview on the form—it updates live while open). You can attach up to five
              images to help moderators review your submission.
            </p>
          </div>
        </div>

        <div className="wr-card p-7 sm:p-8">
          {status === "no-imdb" ? (
            <div className="mb-6 rounded-xl border border-amber-800/35 bg-amber-50 p-4 text-sm font-medium text-amber-950 dark:border-amber-400/35 dark:bg-amber-950/45 dark:text-amber-100">
              Choose a movie from the search dropdown so we store a real{" "}
              <span className="font-bold">IMDb title ID</span> (tt…) and poster.
              Free‑typed titles alone aren’t enough.
            </div>
          ) : null}
          <SubmitForm
            submitAction={submitSighting}
            canAutoApprove={canAutoApprove}
            moderatorName={moderatorSession?.name}
            loggedInName={moderatorSession?.name}
            loggedInEmail={moderatorSession?.email}
          />
        </div>
      </section>
    </main>
  );
}
