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

  const desktopLinks = (
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
              className="hidden h-11 w-11 object-cover lg:block"
            />
            <span className="inline-flex h-11 items-center px-3 text-sm font-semibold lg:hidden">
              Edit Profile
            </span>
          </Link>
        </>
      ) : null}
    </>
  );

  const mobileItemClass = (href: string) =>
    `inline-flex h-11 items-center justify-between rounded-lg border px-4 text-sm font-semibold outline-none transition ${
      currentPage(href)
        ? "border-orange-700/60 bg-orange-500/90 text-white shadow-[0_4px_14px_rgb(234_88_12/0.35)]"
        : "border-stone-800/25 bg-white/10 text-stone-900 hover:bg-white/20 dark:border-white/20 dark:bg-white/6 dark:text-stone-100 dark:hover:bg-white/10"
    }`;

  const mobileLabel = (label: string) => (
    <>
      <span>{label}</span>
      <span aria-hidden className="text-base opacity-70">
        ›
      </span>
    </>
  );

  const mobileLinks = (
    <>
      <Link
        className={mobileItemClass("/")}
        href="/"
        aria-current={currentPage("/") ? "page" : undefined}
      >
        {mobileLabel("Browse the catalog")}
      </Link>
      {session ? (
        <Link
          className={mobileItemClass("/moderation")}
          href="/moderation"
          aria-current={currentPage("/moderation") ? "page" : undefined}
        >
          {mobileLabel("Moderate")}
        </Link>
      ) : null}
      <Link
        className={mobileItemClass("/submit")}
        href="/submit"
        aria-current={currentPage("/submit") ? "page" : undefined}
      >
        {mobileLabel("Submit a sighting")}
      </Link>
      {session ? (
        <Link
          className={mobileItemClass("/profile")}
          href="/profile"
          aria-current={currentPage("/profile") ? "page" : undefined}
        >
          {mobileLabel("Edit Profile")}
        </Link>
      ) : null}
    </>
  );

  return (
    <div className="text-sm">
      <button
        type="button"
        className="wr-btn-ghost lg:hidden"
        aria-expanded={mobileOpen}
        aria-controls="wr-mobile-nav"
        onClick={() => setMobileOpen((value) => !value)}
      >
        {mobileOpen ? "Close" : "Menu"}
      </button>

      <div className="hidden flex-wrap items-center gap-2 lg:flex">{desktopLinks}</div>

      {mobileOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-full lg:hidden sm:w-auto">
          <div
            id="wr-mobile-nav"
            className="wr-mobile-nav-enter grid w-full gap-2 rounded-2xl border-2 border-stone-950/30 bg-[var(--wr-header-bg)] p-3 shadow-[0_20px_45px_rgb(0_0_0/0.28)] backdrop-blur-md [&>*]:w-full dark:border-white/16 sm:w-[20rem]"
          >
            {mobileLinks}
          </div>
        </div>
      ) : null}
    </div>
  );
}
