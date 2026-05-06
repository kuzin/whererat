import type { Metadata } from "next";
import { Fredoka, Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  MODERATOR_SESSION_COOKIE,
  parseModeratorSession,
  SEEDED_MODERATOR_AVATAR_URL,
} from "@/lib/auth";
import { SiteMasthead } from "@/components/site-masthead";
import { TooltipProvider } from "@/components/tooltip-provider";
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
  icons: {
    icon: [
      {
        url: SEEDED_MODERATOR_AVATAR_URL,
        sizes: "160x160",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: SEEDED_MODERATOR_AVATAR_URL,
        sizes: "160x160",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    title: "WhereRat",
  },
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
      <body className="bg-background text-foreground min-h-full transition-colors duration-150">
        <TooltipProvider>
          <div className="wr-shell flex min-h-screen flex-col">
            <SiteMasthead session={session} />
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
