import type { Metadata } from "next";
import { Boogaloo, Fredoka, Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  MODERATOR_SESSION_COOKIE,
  parseModeratorSession,
  type ModeratorSession,
} from "@/lib/auth";
import { SiteMasthead } from "@/components/site-masthead";
import { ScrollToTop } from "@/components/scroll-to-top";
import { TooltipProvider } from "@/components/tooltip-provider";
import { Suspense } from "react";
import { ToastNotifications } from "./toast-notifications";
import { logoutModerator } from "./login/actions";
import { getStoredModeratorById } from "@/lib/user-store";
import { Analytics } from "@vercel/analytics/next";
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
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/favicon.svg"],
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
  const cookieSession = parseModeratorSession(
    cookieStore.get(MODERATOR_SESSION_COOKIE)?.value,
  );
  let session: ModeratorSession | undefined = cookieSession;

  if (cookieSession) {
    try {
      const persistedAccount = await getStoredModeratorById(cookieSession.id);
      if (persistedAccount) {
        session = {
          id: persistedAccount.id,
          username: persistedAccount.username,
          name: persistedAccount.name,
          email: persistedAccount.email,
          avatarUrl: persistedAccount.avatarUrl,
          role: persistedAccount.role,
        };
      }
    } catch {
      session = cookieSession;
    }
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} ${boogaloo.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground min-h-full transition-colors duration-150">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-stone-900 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:outline-none dark:focus:bg-white dark:focus:text-stone-900"
        >
          Skip to main content
        </a>
        <TooltipProvider>
          <div className="wr-shell flex min-h-screen flex-col">
            <SiteMasthead session={session} />
            <div className="relative flex min-h-0 flex-1 flex-col">
              <div id="main-content" className="flex min-h-0 flex-1 flex-col">{children}</div>
              <footer className="relative z-0 border-t-2 border-[var(--wr-footer-rule)] bg-[var(--wr-footer-bg)] text-[var(--wr-footer-fg)] transition-colors duration-150">
                <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                  <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">

                    {/* Brand + social */}
                    <div className="flex flex-col gap-5">
                      <img src="/brand/rat.svg" alt="" aria-hidden width={28} height={28} className="opacity-40 dark:opacity-25" />
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: "LinkedIn", short: "in", href: "https://www.linkedin.com/in/mikekuzin" },
                          { label: "X", short: "X", href: "https://x.com/kuzin" },
                          { label: "Instagram", short: "IG", href: "https://instagram.com/kuzin" },
                          { label: "Dribbble", short: "DB", href: "https://dribbble.com/kuzin" },
                          { label: "GitHub", short: "GH", href: "https://github.com/kuzin" },
                        ].map(({ label, short, href }) => (
                          <a
                            key={label}
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={label}
                            title={label}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-900/18 bg-stone-900/6 text-[0.65rem] font-bold text-stone-500 transition hover:border-stone-900/35 hover:bg-stone-900/10 hover:text-stone-800 dark:border-white/18 dark:bg-white/8 dark:text-stone-400 dark:hover:border-white/35 dark:hover:text-stone-100"
                          >
                            {short}
                          </a>
                        ))}
                      </div>
                      <p className="text-xs text-stone-400 dark:text-stone-500">
                        © 2026{" "}
                        <a href="https://kuzn.me" target="_blank" rel="noreferrer" className="underline decoration-stone-400/50 underline-offset-2 hover:decoration-stone-600 dark:decoration-stone-600/50 dark:hover:decoration-stone-400">
                          kuz
                        </a>
                        {" "}· For Kaitlyn. ❤️
                      </p>
                    </div>

                    {/* Nav */}
                    <nav className="flex flex-col gap-2 sm:items-end" aria-label="Footer navigation">
                      {[
                        { label: "About", href: "/about" },
                        { label: "Guidelines", href: "/guidelines" },
                        { label: "Privacy", href: "/privacy" },
                      ].map(({ label, href }) => (
                        <Link
                          key={label}
                          href={href}
                          className="text-sm font-semibold text-stone-600 transition hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                        >
                          {label}
                        </Link>
                      ))}
                      {session ? (
                        <form action={logoutModerator}>
                          <button type="submit" className="text-sm font-semibold text-red-500/60 transition hover:text-red-700 dark:text-red-400/60 dark:hover:text-red-300">
                            Log out
                          </button>
                        </form>
                      ) : (
                        <Link href="/login" className="text-sm font-semibold text-stone-600 transition hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100">
                          Login
                        </Link>
                      )}
                    </nav>
                  </div>
                </div>
              </footer>
            </div>
          </div>
          <ScrollToTop />
          <Suspense><ToastNotifications /></Suspense>
        </TooltipProvider>
        <Analytics />
      </body>
    </html>
  );
}
