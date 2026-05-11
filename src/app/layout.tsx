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
import { TooltipProvider } from "@/components/tooltip-provider";
import { Suspense } from "react";
import { ToastNotifications } from "./toast-notifications";
import { logoutModerator } from "./login/actions";
import { getStoredModeratorById } from "@/lib/user-store";
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
        <TooltipProvider>
          <div className="wr-shell flex min-h-screen flex-col">
            <SiteMasthead session={session} />
            <div className="relative flex min-h-0 flex-1 flex-col">
              <div className="flex min-h-0 flex-1 flex-col">{children}</div>
              <footer className="relative z-0 border-t-2 border-[var(--wr-footer-rule)] bg-[var(--wr-footer-bg)] text-[var(--wr-footer-fg)] transition-colors duration-150">
                <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                  <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">

                    {/* Brand + social */}
                    <div className="flex flex-col gap-5">
                      <div>
                        <p className="text-lg font-bold tracking-tight text-amber-50">WhereRat</p>
                        <p className="mt-0.5 text-sm text-amber-100/50">An obsessive guide to 🐀 on film.</p>
                      </div>
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
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-100/20 bg-white/8 text-[0.65rem] font-bold text-amber-100/70 transition hover:border-amber-100/40 hover:bg-white/14 hover:text-amber-50"
                          >
                            {short}
                          </a>
                        ))}
                      </div>
                      <p className="text-xs text-amber-100/40">
                        © 2026{" "}
                        <a href="https://kuzn.me" target="_blank" rel="noreferrer" className="underline decoration-amber-100/25 underline-offset-2 hover:decoration-amber-100/60">
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
                          className="text-sm font-semibold text-amber-100/60 transition hover:text-amber-50"
                        >
                          {label}
                        </Link>
                      ))}
                      {session ? (
                        <form action={logoutModerator}>
                          <button type="submit" className="text-sm font-semibold text-red-300/60 transition hover:text-red-200">
                            Log out
                          </button>
                        </form>
                      ) : (
                        <Link href="/login" className="text-sm font-semibold text-amber-100/60 transition hover:text-amber-50">
                          Login
                        </Link>
                      )}
                    </nav>
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
