import type { Metadata } from "next";
import { Fredoka, Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  MODERATOR_SESSION_COOKIE,
  parseModeratorSession,
} from "@/lib/auth";
import { TooltipProvider } from "@/components/tooltip-provider";
import { NavLinks } from "./nav-links";
import { ThemeDevToggle } from "./theme-dev-toggle";
import { ToastNotifications } from "./toast-notifications";
import { logoutModerator } from "./login/actions";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "WhereRat",
  description: "The fun, spoiler-aware catalog of rat cameos in movies.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const session = parseModeratorSession(
    cookieStore.get(MODERATOR_SESSION_COOKIE)?.value,
  );

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="WhereRat" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="bg-background text-foreground min-h-full transition-colors duration-150">
        <TooltipProvider>
          <div className="wr-shell flex min-h-screen flex-col">
            <header className="sticky top-0 z-20 border-b-2 bg-[var(--wr-header-bg)] backdrop-blur-md [border-bottom-color:var(--wr-header-border)] shadow-sm">
              <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <Link
                    href="/"
                    className="flex min-w-0 items-center gap-2 rounded-lg outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-stone-950 dark:focus-visible:ring-amber-400 dark:ring-offset-[var(--background)] sm:gap-3"
                  >
                    <span className="sr-only">WhereRat — home</span>
                    <span
                      aria-hidden
                      className="wr-brand-mark h-9 w-auto shrink-0 sm:h-10"
                    />
                    <span
                      aria-hidden
                      className="wr-brand-wordmark h-5 w-auto max-w-[min(100%,11rem)] shrink-0 sm:h-7 sm:max-w-[14rem] md:h-8 md:max-w-[16rem]"
                    />
                  </Link>
                  <ThemeDevToggle className="z-20 ml-[5px] shrink-0" />
                </div>
                <NavLinks session={session} />
              </nav>
            </header>
            <div className="relative flex min-h-0 flex-1 flex-col">
              <div className="flex min-h-0 flex-1 flex-col">{children}</div>
              <footer className="relative z-0 mt-0 border-t-2 border-[var(--wr-footer-rule)] bg-[var(--wr-footer-bg)] text-[var(--wr-footer-fg)] transition-colors duration-150">
                <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 text-center text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left lg:px-8">
                  <p className="max-w-xl leading-relaxed text-amber-100/95">
                    Copyright 2026. Design by{" "}
                    <a
                      href="https://kuzn.me"
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold underline decoration-amber-100/45 underline-offset-2 hover:decoration-amber-100"
                    >
                      Kuz
                    </a>
                    . All rights reserved.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
                    <Link
                      className="inline-flex w-fit items-center rounded-lg border-2 bg-[#fcd34d] px-4 py-2 text-sm font-bold text-stone-950 outline-none ring-offset-2 transition hover:bg-[#fde047] hover:brightness-[1.03] focus-visible:ring-2 focus-visible:ring-amber-300 dark:border-white/25 dark:bg-[#c9a82a] dark:text-stone-950 dark:ring-offset-stone-900 dark:hover:bg-[#d4b336]"
                      href="/guidelines"
                    >
                      Guidelines →
                    </Link>
                    {session ? (
                      <form action={logoutModerator}>
                        <button
                          type="submit"
                          className="inline-flex w-fit items-center rounded-lg border-2 border-amber-200/35 bg-white/10 px-4 py-2 text-sm font-bold text-amber-50 outline-none ring-offset-2 transition hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-amber-300 dark:border-white/25 dark:bg-white/10 dark:text-amber-100 dark:ring-offset-stone-900 dark:hover:bg-white/15"
                        >
                          Log out
                        </button>
                      </form>
                    ) : (
                      <Link
                        className="inline-flex w-fit items-center rounded-lg border-2 border-amber-200/35 bg-white/10 px-4 py-2 text-sm font-bold text-amber-50 outline-none ring-offset-2 transition hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-amber-300 dark:border-white/25 dark:bg-white/10 dark:text-amber-100 dark:ring-offset-stone-900 dark:hover:bg-white/15"
                        href="/login"
                      >
                        Login
                      </Link>
                    )}
                  </div>
                </div>
              </footer>
            </div>
          </div>
          <ToastNotifications />
        </TooltipProvider>
      </body>
    </html>
  );
}
