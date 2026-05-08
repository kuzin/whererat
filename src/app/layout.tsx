import type { Metadata } from "next";
import { Boogaloo, Fredoka, Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  MODERATOR_SESSION_COOKIE,
  parseModeratorSession,
} from "@/lib/auth";
import { SiteMasthead } from "@/components/site-masthead";
import { TooltipProvider } from "@/components/tooltip-provider";
import { Suspense } from "react";
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

const boogaloo = Boogaloo({
  variable: "--font-boogaloo",
  subsets: ["latin"],
  weight: "400",
});


export const metadata: Metadata = {
  title: {
    default: "WhereRat",
    template: "%s | WhereRat",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://whererat.com"),
  applicationName: "WhereRat",
  description: "Spoiler-aware catalog of rat appearances in film and TV, with community sightings.",
  keywords: [
    "WhereRat",
    "rat sightings",
    "movie catalog",
    "IMDb rat scenes",
    "film database",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "WhereRat",
    title: "WhereRat",
    description: "Spoiler-aware catalog of rat appearances in film and TV.",
    images: [{ url: "/brand/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "WhereRat",
    description: "Spoiler-aware catalog of rat appearances in film and TV.",
    images: ["/brand/og-image.png"],
  },
  icons: {
    icon: [{ url: "/brand/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/brand/icon.svg" }],
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
      className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} ${boogaloo.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground min-h-full transition-colors duration-150">
        <TooltipProvider>
          <div className="wr-shell flex min-h-screen flex-col">
            <SiteMasthead session={session} />
            <div className="relative flex min-h-0 flex-1 flex-col">
              <div className="flex min-h-0 flex-1 flex-col">{children}</div>
              <footer className="relative z-0 mt-0 border-t-2 border-[var(--wr-footer-rule)] bg-[var(--wr-footer-bg)] text-[var(--wr-footer-fg)] transition-colors duration-150">
                <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 text-center text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left lg:px-8">
                  <div>
                  <p className="mb-1.5 text-sm text-amber-100/70">Spoiler-aware · Crowd-sourced · Obsessively maintained</p>
                  <p className="mb-2 text-sm italic text-amber-100/55">For Kaitlyn. ❤️</p>
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
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
                    <Link
                      className="wr-btn-primary inline-flex w-fit items-center rounded-lg px-4 py-2 text-sm font-bold outline-none ring-offset-2 transition hover:brightness-[1.03] focus-visible:ring-2 focus-visible:ring-amber-300 dark:ring-offset-stone-900"
                      href="/guidelines"
                    >
                      Guidelines →
                    </Link>
                    <Link
                      className="inline-flex w-fit items-center rounded-lg border-2 border-amber-200/35 bg-white/10 px-4 py-2 text-sm font-bold text-amber-50 outline-none ring-offset-2 transition hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-amber-300 dark:border-white/25 dark:bg-white/10 dark:text-amber-100 dark:ring-offset-stone-900 dark:hover:bg-white/15"
                      href="/privacy"
                    >
                      Privacy →
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
          <Suspense><ToastNotifications /></Suspense>
        </TooltipProvider>
      </body>
    </html>
  );
}
