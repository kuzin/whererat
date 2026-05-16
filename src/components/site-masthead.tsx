/**
 * Site masthead (sticky top bar: brand, dev theme toggle, nav).
 *
 * Quick tweaks:
 * - **Layout / spacing:** edit the `className`s on `<header>`, inner `<nav>`, and the brand `<Link>` below.
 * - **Bar surface & border:** `--wr-header-bg`, `--wr-header-border` in `src/app/globals.css` (`:root` and `.dark`).
 * - **Logo tint (mask fill):** `--wr-brand-mark`, `--wr-brand-wordmark` in the same file.
 * - **SVG assets:** replace `public/brand/rat.svg` and `public/brand/logo.svg` (paths: `BRAND_MARK_SRC` / `BRAND_LOGO_SRC` in `src/lib/brand.ts`). Masks are defined on `.wr-brand-mark` / `.wr-brand-wordmark` in `globals.css`.
 * - **Nav labels & mobile menu:** `src/components/nav-links.tsx`
 */
import Link from "next/link";
import type { ModeratorSession } from "@/lib/auth";
import { NavLinks } from "@/components/nav-links";
import { CaitlinEasterEggToggle } from "./caitlin-easter-egg-toggle";

type SiteMastheadProps = {
  session?: ModeratorSession;
};

export function SiteMasthead({ session }: SiteMastheadProps) {
  return (
    <header className="sticky top-0 z-20 border-b-2 bg-[var(--wr-header-bg)] backdrop-blur-md [border-bottom-color:var(--wr-header-border)] shadow-sm">
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 rounded-lg outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-stone-950 dark:focus-visible:ring-amber-400 dark:ring-offset-[var(--background)] sm:gap-3"
          >
            <span className="sr-only">WhereRat — home</span>
            <span
              aria-hidden
              className="wr-brand-wordmark h-5 w-auto max-w-[min(100%,11rem)] shrink-0 sm:h-7 sm:max-w-[14rem] md:h-8 md:max-w-[16rem]"
            />
          </Link>
          <CaitlinEasterEggToggle className="shrink-0" />
        </div>
        <NavLinks session={session} />
      </nav>
    </header>
  );
}
