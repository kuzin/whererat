import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About WhereRat, the technology stack, data sources, and AI-assisted development process.",
  alternates: {
    canonical: "/about",
  },
};

const aboutSections = [
  {
    icon: "🐀",
    title: "About WhereRat",
    body: "WhereRat is a spoiler-aware catalog of rat appearances in film and TV. It helps people track specific rat moments without forcing spoilers by default.",
  },
  {
    icon: "🧱",
    title: "Technology",
    body: "Web: Next.js + React + TypeScript. Mobile: React Native + Expo (Expo Router). Catalog and sightings are served by WhereRat APIs over HTTPS.",
  },
  {
    icon: "🔌",
    title: "Data and API credits",
    body: "Title metadata, posters, and ratings are synchronized from IMDb-linked data providers, including OMDb. External links may open IMDb and other third-party destinations under their own terms.",
  },
  {
    icon: "🤖",
    title: "AI usage",
    body: "WhereRat was built with significant AI-assisted development support for ideation, implementation, refactoring, copy iteration, and UI polish. Final product decisions and releases are curated by the project owner.",
  },
  {
    icon: "♿",
    title: "Accessibility",
    body: "WhereRat aims to keep content readable, keyboard-friendly, and spoiler-safe by default. If you encounter accessibility issues, please reach out through the public contact channels linked from the site.",
  },
] as const;

export default function AboutPage() {
  return (
    <main className="wr-page-shell py-10">
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="self-start rounded-2xl border border-amber-500/35 wr-panel-warm p-8">
          <div className="text-4xl leading-none sm:text-5xl">
            <span aria-hidden>ℹ️</span>
          </div>
          <h1 className="wr-display mt-4 text-4xl font-bold tracking-tight">About</h1>
          <p className="mt-5 leading-relaxed text-orange-950">
            What powers WhereRat, where core metadata comes from, and how the project is built and maintained.
          </p>
        </aside>

        <section className="grid gap-4">
          {aboutSections.map((item) => (
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
        </section>
      </section>
    </main>
  );
}
