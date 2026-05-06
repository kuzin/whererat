import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wr-page-shell flex flex-1 flex-col items-center justify-center py-24 text-center">
      <div className="wr-cheese-panel wr-cheese-tile-cream w-full max-w-lg px-10 py-16">
        <p className="wr-display text-[5rem] font-bold leading-none tracking-tight text-amber-700 dark:text-amber-400">
          404
        </p>
        <h1 className="wr-display mt-4 text-3xl font-bold text-stone-950 dark:text-stone-50">
          Nothing here but rats.
        </h1>
        <p className="mt-3 text-base leading-relaxed text-stone-600 dark:text-stone-400">
          This page doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8">
          <Link
            href="/#catalog"
            className="wr-btn-ghost inline-flex px-5 py-2.5 text-sm font-semibold"
          >
            ← Back to catalog
          </Link>
        </div>
      </div>
    </main>
  );
}
