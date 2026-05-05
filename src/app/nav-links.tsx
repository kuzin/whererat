"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
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
    </div>
  );
}
