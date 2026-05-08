import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How WhereRat handles data in the catalog, website, and native app.",
};

const privacySections = [
  {
    icon: "📱",
    title: "Native app (v1)",
    body: "WhereRat mobile v1 is read-only. It mirrors public catalog data and does not include account sign-in, profile creation, or submission uploads from the app.",
  },
  {
    icon: "🌐",
    title: "Network requests",
    body: "The app and web client call WhereRat HTTPS APIs to load movies and sightings. In v1 mobile, these are read-only GET requests and do not include user credentials.",
  },
  {
    icon: "🖼️",
    title: "Third-party services",
    body: "WhereRat uses IMDb-linked metadata providers (including OMDb) and may load poster/still assets from referenced media hosts. Opening outbound links (for example IMDb pages) sends requests directly to those third-party services under their own terms.",
  },
  {
    icon: "🗂️",
    title: "Data retention (v1 mobile)",
    body: "The current native app is read-only and does not create user accounts or submission records in-app. Any local data is limited to temporary app/device cache needed to render catalog content.",
  },
  {
    icon: "🧪",
    title: "Diagnostics",
    body: "Platform-level logs and crash data may be collected by Apple/Google and any services you enable in production builds. If analytics or crash tooling is added, disclosures should be updated in app-store listings and this page.",
  },
  {
    icon: "♿",
    title: "Accessibility and support",
    body: "If you need this policy in another format or encounter accessibility barriers, use the public support contact listed on WhereRat and app store support pages.",
  },
  {
    icon: "✉️",
    title: "Questions",
    body: "For moderation, legal, or data questions, use the public contact listed on WhereRat.com and your app-store support metadata.",
  },
] as const;

export default function PrivacyPage() {
  return (
    <main className="wr-page-shell py-10">
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="self-start rounded-2xl border border-amber-500/35 wr-panel-warm p-8">
          <div className="text-4xl leading-none sm:text-5xl">
            <span aria-hidden>🔒</span>
          </div>
          <h1 className="wr-display mt-4 text-4xl font-bold tracking-tight">
            Privacy
          </h1>
          <p className="mt-5 leading-relaxed text-orange-950">
            How WhereRat handles data today, what third-party services may see, and what changes if we
            expand beyond the current read-only mobile scope.
          </p>
        </aside>

        <section className="grid gap-4">
          {privacySections.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-stone-900/25 bg-stone-50 p-5 dark:border-white/12 dark:bg-stone-900/70"
            >
              <h2 className="wr-display flex items-center gap-2 text-2xl font-bold text-stone-950 dark:text-stone-100">
                <span aria-hidden>{item.icon}</span>
                <span>{item.title}</span>
              </h2>
              <p className="mt-3 leading-relaxed text-stone-700 dark:text-stone-300">{item.body}</p>
            </article>
          ))}

          <p className="rounded-2xl border border-stone-900/15 bg-amber-50/60 p-5 text-sm text-stone-700 dark:border-white/12 dark:bg-amber-950/20 dark:text-stone-300">
            This page reflects the current v1 behavior and should be updated when new features are added
            (accounts, app submissions, analytics providers, or additional data retention).
          </p>
        </section>
      </section>
    </main>
  );
}
