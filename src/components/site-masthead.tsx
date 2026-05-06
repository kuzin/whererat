/**
 * Site masthead (sticky top bar: brand, dev theme toggle, nav).
 *
 * Quick tweaks:
 * - **Layout / spacing:** edit the `className`s on `<header>`, inner `<nav>`, and the brand `<Link>` below.
 * - **Bar surface & border:** `--wr-header-bg`, `--wr-header-border` in `src/app/globals.css` (`:root` and `.dark`).
 * - **Logo tint (mask fill):** `--wr-brand-mark`, `--wr-brand-wordmark` in the same file.
 * - **SVG assets:** replace `public/brand/mark.svg` and `public/brand/logo.svg` (paths: `BRAND_MARK_SRC` / `BRAND_LOGO_SRC` in `src/lib/brand.ts`). Masks are defined on `.wr-brand-mark` / `.wr-brand-wordmark` in `globals.css`.
 * - **Nav labels & mobile menu:** `src/app/nav-links.tsx`
 */
import Link from "next/link";
import type { ModeratorSession } from "@/lib/auth";
import { NavLinks } from "@/app/nav-links";
import { ThemeDevToggle } from "@/app/theme-dev-toggle";

type SiteMastheadProps = {
  session?: ModeratorSession;
};

export function SiteMasthead({ session }: SiteMastheadProps) {
  return (
    <header className="sticky top-0 z-20 border-b bg-[var(--wr-header-bg)] [border-bottom-color:var(--wr-header-border)]">
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="rounded-md px-1 py-1 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-stone-950 dark:focus-visible:ring-amber-400 dark:ring-offset-[var(--background)]"
          >
            <span className="wr-display text-lg font-extrabold tracking-tight text-[var(--foreground)] sm:text-xl">
              WhereRat
            </span>
          </Link>
          <ThemeDevToggle className="z-20 shrink-0" />
        </div>
        <NavLinks session={session} />
      </nav>
    </header>
  );
}
