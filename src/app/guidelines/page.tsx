const guidelines = [
  {
    icon: "🎬",
    title: "Sightings",
    body: "A valid sighting needs an on-screen rat, a sighting title, an approximate point in the movie for when the rat first appears, a short description (Markdown formatting is welcome—bold, lists, links; use Show preview on the submit form to check rendering while you write), an approximate rat count, and your display name (contact email optional, for moderator follow-up only).",
  },
  {
    icon: "⚠️",
    title: "Spoilers",
    body: "Mark any submission as a spoiler when the rat appears during a major reveal, death, ending, or joke that depends on surprise.",
  },
  {
    icon: "🔎",
    title: "Sources",
    body: "Prefer approximate points in the movie, public references, or curator watch notes. Avoid uploading copyrighted stills or clips until the storage policy is reviewed.",
  },
  {
    icon: "🛡️",
    title: "Moderation",
    body: "Moderators can approve new sightings, reject unclear reports, edit submissions for clarity, or merge near-duplicates into existing entries.",
  },
  {
    icon: "🧾",
    title: "Metadata",
    body: "Every movie should be selected through IMDb title search. WhereRat resolves the IMDb title ID behind the scenes, then fetches posters, genres, runtimes, ratings, and release metadata through an approved provider such as OMDb or licensed IMDb data.",
  },
  {
    icon: "📈",
    title: "Analytics",
    body: "Launch tracking should measure search terms, popular movie pages, submission completion, and rejected duplicate patterns.",
  },
];

export default function GuidelinesPage() {
  return (
    <main className="wr-page-shell py-10">
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded-2xl border border-amber-500/35 wr-panel-warm p-8">
          <h1 className="wr-display text-4xl font-bold tracking-tight">
            Guidelines
          </h1>
          <p className="mt-5 leading-relaxed text-amber-50/82">
            Quick standards for submissions, spoilers, moderation, and metadata so
            the catalog stays consistent and easy to trust.
          </p>
        </aside>

        <section className="grid gap-4">
            {guidelines.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-stone-900/15 bg-white p-5 transition hover:bg-amber-50/50 dark:border-white/12 dark:bg-stone-900/70 dark:hover:bg-amber-950/22"
              >
                <h3 className="wr-display flex items-center gap-2 text-2xl font-bold text-stone-950 dark:text-stone-100">
                  <span aria-hidden>{item.icon}</span>
                  <span>{item.title}</span>
                </h3>
                <p className="mt-3 leading-relaxed text-stone-700 dark:text-stone-300">{item.body}</p>
              </article>
            ))}
        </section>
      </section>
    </main>
  );
}
