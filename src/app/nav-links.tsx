"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ModeratorSession } from "@/lib/auth";

function navClass(isActive: boolean) {
  return [
    "rounded-lg border-2 border-transparent px-3 py-2 text-sm font-semibold outline-none transition-colors",
    isActive
      ? "border-stone-950/80 bg-[#ffd33d] text-stone-950 dark:border-white/40 dark:bg-[#e6b82e] dark:text-stone-950"
      : "text-stone-700 hover:bg-stone-950/8 hover:text-stone-950 focus-visible:border-stone-950 focus-visible:bg-amber-50 dark:text-stone-300 dark:hover:bg-white/12 dark:hover:text-stone-100 dark:focus-visible:border-amber-300/65 dark:focus-visible:bg-stone-800/80",
  ].join(" ");
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ session }: { session?: ModeratorSession }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const links = (
    <>
      <Link className={navClass(isActivePath(pathname, "/"))} href="/">
        Catalog
      </Link>
      <Link className={navClass(isActivePath(pathname, "/submit"))} href="/submit">
        Submit
      </Link>
      {session ? (
        <>
          <Link
            className={navClass(isActivePath(pathname, "/moderation"))}
            href="/moderation"
          >
            Moderate
          </Link>
          <Link
            className={navClass(isActivePath(pathname, "/profile"))}
            href="/profile"
            aria-label="Profile"
            title={session.name}
          >
            <Image
              src={session.avatarUrl}
              alt={`${session.name} avatar`}
              width={24}
              height={24}
              className="h-6 w-6 rounded-md border border-stone-900/15 object-cover dark:border-white/20"
            />
          </Link>
        </>
      ) : null}
    </>
  );

  return (
    <div className="text-sm">
      <button
        type="button"
        className="inline-flex items-center rounded-lg border-2 border-stone-950/20 px-3 py-2 text-sm font-semibold text-stone-800 outline-none transition hover:bg-stone-950/8 hover:text-stone-950 focus-visible:ring-2 focus-visible:ring-stone-950 dark:border-white/20 dark:text-stone-100 dark:hover:bg-white/12 md:hidden"
        aria-expanded={mobileOpen}
        aria-controls="wr-mobile-nav"
        onClick={() => setMobileOpen((value) => !value)}
      >
        {mobileOpen ? "Close" : "Menu"}
      </button>

      <div className="hidden flex-wrap items-center gap-2 md:flex">{links}</div>

      {mobileOpen ? (
        <div
          id="wr-mobile-nav"
          className="absolute left-4 right-4 top-[calc(100%+0.5rem)] z-30 grid gap-2 rounded-xl border-2 border-stone-950/25 bg-[var(--wr-header-bg)] p-3 shadow-[0_10px_30px_rgb(0_0_0/0.22)] backdrop-blur-md dark:border-white/16 md:hidden"
        >
          {links}
        </div>
      ) : null}
    </div>
  );
}
