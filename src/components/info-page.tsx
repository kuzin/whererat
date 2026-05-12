import type { ReactNode } from "react";
import Link from "next/link";

// ── Layout shell ─────────────────────────────────────────────────────────────

export function InfoPageShell({
  hero,
  children,
}: {
  hero: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="wr-page-shell py-10">
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="self-start">{hero}</aside>
        <div className="grid gap-4">{children}</div>
      </section>
    </main>
  );
}

// ── Hero sidebar ──────────────────────────────────────────────────────────────

export function InfoHero({
  icon,
  title,
  description,
}: {
  icon?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl wr-panel-warm p-8">
      {icon && (
        <div className="text-4xl leading-none sm:text-5xl">
          <span aria-hidden>{icon}</span>
        </div>
      )}
      <h1 className={`wr-display text-4xl font-bold tracking-tight text-stone-950 dark:text-amber-50${icon ? " mt-4" : ""}`}>
        {title}
      </h1>
      <p className="mt-5 leading-relaxed text-stone-800 dark:text-amber-100/90">{description}</p>
    </div>
  );
}

// ── Content card ──────────────────────────────────────────────────────────────

export function InfoSection({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-stone-900/15 bg-white p-5 transition-colors hover:bg-amber-50/60 dark:border-white/12 dark:bg-stone-900/70 dark:hover:bg-stone-800/60">
      <h2 className="wr-display flex items-center gap-2 text-xl font-bold text-stone-950 dark:text-stone-100">
        <span aria-hidden>{icon}</span>
        <span>{title}</span>
      </h2>
      <p className="mt-3 leading-relaxed text-stone-700 dark:text-stone-300">{children}</p>
    </article>
  );
}

// ── Muted note box ────────────────────────────────────────────────────────────

export function InfoNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-stone-900/15 bg-amber-50/70 p-5 text-sm leading-relaxed text-stone-700 dark:border-white/12 dark:bg-amber-950/20 dark:text-stone-300">
      {children}
    </p>
  );
}

// ── CTA banner ────────────────────────────────────────────────────────────────

export function InfoCta({
  title,
  subtitle,
  href,
  label,
}: {
  title: string;
  subtitle: string;
  href: string;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-orange-700/28 bg-orange-100/80 p-5 dark:border-white/12 dark:bg-amber-950/20">
      <div>
        <p className="font-bold text-stone-900 dark:text-stone-100">{title}</p>
        <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-400">{subtitle}</p>
      </div>
      <Link href={href} className="wr-btn-primary shrink-0 px-5 py-2.5 text-sm font-bold">
        {label}
      </Link>
    </div>
  );
}

// ── Tiny footnote ─────────────────────────────────────────────────────────────

export function InfoFootnote({ children }: { children: ReactNode }) {
  return (
    <p
      className="select-none text-center text-[0.6rem] leading-loose tracking-widest text-stone-300 dark:text-stone-700"
      aria-hidden="true"
    >
      {children}
    </p>
  );
}
