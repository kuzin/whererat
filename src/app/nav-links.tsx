"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ModeratorSession } from "@/lib/auth";


export function NavLinks({ session }: { session?: ModeratorSession }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const currentPage = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const ghostLink = (href: string, label: string) => {
    return (
      <Link
        className="wr-btn-ghost"
        href={href}
        aria-current={currentPage(href) ? "page" : undefined}
      >
        {label}
      </Link>
    );
  };

  const links = (
    <>
      {ghostLink("/", "Browse the catalog")}
      {session ? ghostLink("/moderation", "Moderate") : null}
      <Link
        className="wr-btn-primary"
        href="/submit"
        aria-current={currentPage("/submit") ? "page" : undefined}
      >
        Submit a sighting
      </Link>
      {session ? (
        <>
          <Link
            className="inline-flex h-11 items-center justify-center overflow-hidden rounded-xl border-2 border-stone-950/90 outline-none transition shadow-[2px_2px_0_0_var(--wr-shadow-btn-soft)] hover:shadow-none focus-visible:ring-2 focus-visible:ring-stone-950/40 focus-visible:ring-offset-2 dark:border-white/22 dark:shadow-[2px_2px_0_0_rgb(0_0_0/0.45)] dark:focus-visible:ring-amber-400/55"
            href="/profile"
            title={session.name}
          >
            <Image
              src={session.avatarUrl}
              alt=""
              width={40}
              height={40}
              className="hidden h-11 w-11 object-cover md:block"
            />
            <span className="inline-flex h-11 items-center px-3 text-sm font-semibold md:hidden">
              Edit Profile
            </span>
          </Link>
        </>
      ) : null}
    </>
  );

  return (
    <div className="text-sm">
      <button
        type="button"
        className="wr-btn-ghost md:hidden"
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
