import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How WhereRat handles data in the catalog, website, and native app.",
};

export default function PrivacyPage() {
  return (
    <main className="wr-page-shell py-10">
      <article className="mx-auto max-w-2xl rounded-2xl border border-amber-500/35 bg-[color-mix(in_oklab,var(--background)_94%,transparent)] p-8 shadow-[0_14px_40px_rgb(0_0_0/0.12)] backdrop-blur-sm dark:bg-stone-900/72 dark:border-amber-500/35">
        <h1 className="wr-display text-3xl font-bold tracking-tight sm:text-4xl">Privacy</h1>
        <p className="mt-6 text-base leading-relaxed text-stone-800 dark:text-amber-50/92">
          WhereRat is primarily a curated catalog public on the web. The companion native app{" "}
          <strong>(v1)</strong> mirrors that anonymous experience: browse movies, sightings, and
          IMDb-related reference content we already expose on the website. Sign-in, submissions, and
          uploads are intentionally out of scope for the initial mobile release.
        </p>
        <section className="mt-10 space-y-4 text-base leading-relaxed text-stone-800 dark:text-amber-50/92">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-amber-50">Native app — v1</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Requests go to WhereRat HTTPS APIs to load catalog and movie payloads. Requests are{" "}
              <strong>read-only GET</strong> calls; the app does not send account credentials because
              v1 includes no authentication.
            </li>
            <li>
              Posters and stills displayed in-app are sourced from public URLs referenced in catalog
              data (for example CDN hosts used on the web). Those third parties&apos; servers may receive
              standard HTTP requests from your device when images load or when you tap through to linked
              pages such as <span className="whitespace-nowrap">imdb.com</span>.
            </li>
            <li>
              Routine device logs (via Apple or Google, crash analytics if you configure them in EAS) may
              apply outside WhereRat&apos;s codebase; disclose those in App Store Connect / Play Console
              as you enable them for production builds.
            </li>
          </ul>
          <h2 className="pt-6 text-lg font-semibold text-stone-900 dark:text-amber-50">Questions</h2>
          <p>
            For moderator, legal, or data questions, use the public contact you publish on WhereRat.com
            and in App Store Connect / Play Console so it matches editorial review answers.
          </p>
          <p className="text-sm text-stone-600 dark:text-amber-200/72">
            This page is informational and reflects the shipped v1 read-only mobile scope — update it when
            you add authenticated features, submissions from the app, or third-party analytics.
          </p>
        </section>
      </article>
    </main>
  );
}
