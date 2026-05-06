"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ModeratorSession } from "@/lib/auth";

function navClass(isActive: boolean) {
  return [
    "rounded-md px-2.5 py-1.5 text-sm font-medium outline-none transition-colors",
    isActive
      ? "bg-stone-900/10 text-stone-950 dark:bg-white/12 dark:text-stone-50"
      : "text-stone-700 hover:bg-stone-900/6 hover:text-stone-950 focus-visible:ring-2 focus-visible:ring-stone-900/35 dark:text-stone-300 dark:hover:bg-white/8 dark:hover:text-stone-100 dark:focus-visible:ring-amber-300/45",
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

  const links = (
    <>
      <Link
        className={navClass(isActivePath(pathname, "/"))}
        href="/"
        onClick={() => setMobileOpen(false)}
      >
        Catalog
      </Link>
      <Link
        className={navClass(isActivePath(pathname, "/submit"))}
        href="/submit"
        onClick={() => setMobileOpen(false)}
      >
        Submit
      </Link>
      {session ? (
        <>
          <Link
            className={navClass(isActivePath(pathname, "/moderation"))}
            href="/moderation"
            onClick={() => setMobileOpen(false)}
          >
            Moderate
          </Link>
          <Link
            className={navClass(isActivePath(pathname, "/profile"))}
            href="/profile"
            aria-label="Profile"
            title={session.name}
            onClick={() => setMobileOpen(false)}
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
        className="inline-flex items-center rounded-md border border-stone-900/20 px-3 py-1.5 text-sm font-medium text-stone-800 outline-none transition hover:bg-stone-900/8 hover:text-stone-950 focus-visible:ring-2 focus-visible:ring-stone-900/35 dark:border-white/20 dark:text-stone-100 dark:hover:bg-white/12 md:hidden"
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
          className="absolute left-4 right-4 top-[calc(100%+0.5rem)] z-30 grid gap-1 rounded-lg border border-stone-900/20 bg-[var(--wr-card-bg)] p-2 shadow-[0_10px_30px_rgb(0_0_0/0.18)] dark:border-white/16 md:hidden"
        >
          {links}
        </div>
      ) : null}
    </div>
  );
}
