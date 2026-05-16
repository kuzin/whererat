"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { NewsItem } from "@/lib/news-store";
import { TYPE_STYLES, ArticleView } from "@/components/news/article-view";

const CONTENT_GAP = 24; // px below header where content starts

export function NewsDesktopLayout({
    items,
    initialId,
}: {
    items: NewsItem[];
    initialId?: string;
}) {
    const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");
    const asideRef = useRef<HTMLElement>(null);
    const articlesRef = useRef<HTMLDivElement>(null);
    const headerBottomRef = useRef(64 + CONTENT_GAP); // updated on mount

    // Look up an article element only inside the desktop layout — there are
    // duplicate IDs in the mobile feed (hidden via `lg:hidden`) that would
    // otherwise win `document.getElementById`.
    const getArticleEl = useCallback((id: string) => {
        return articlesRef.current?.querySelector<HTMLElement>(
            `[data-post-id="${id}"]`,
        ) ?? null;
    }, []);

    // Stable: update the URL without triggering navigation
    const syncUrl = useCallback((id: string) => {
        try {
            const url = new URL(window.location.href);
            if (url.searchParams.get("post") !== id) {
                url.searchParams.set("post", id);
                history.replaceState(null, "", url.toString());
            }
        } catch { /* ignore */ }
    }, []);

    // Stable: smooth-scroll an article into view
    const scrollTo = useCallback((id: string) => {
        getArticleEl(id)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }, [getArticleEl]);

    // One-time setup: measure header, pin sidebar top, set scroll margins
    useEffect(() => {
        const header = document.querySelector<HTMLElement>("header");
        const h = header?.offsetHeight ?? 64;
        const offset = h + CONTENT_GAP;
        headerBottomRef.current = offset;

        if (asideRef.current) {
            asideRef.current.style.top = `${offset}px`;
        }
        for (const item of items) {
            const el = getArticleEl(item.id);
            if (el) el.style.scrollMarginTop = `${offset}px`;
        }
        if (initialId) {
            getArticleEl(initialId)?.scrollIntoView({
                behavior: "instant",
                block: "start",
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Scroll spy: whichever article has the most pixels visible below the
    // header is the active one — transitions at the natural 50/50 crossover.
    useEffect(() => {
        const update = () => {
            const headerBottom = headerBottomRef.current;
            const viewportBottom = window.innerHeight;
            let maxVisible = 0;
            let current = items[0]?.id ?? "";

            for (const item of items) {
                const el = getArticleEl(item.id);
                if (!el) continue;
                const rect = el.getBoundingClientRect();
                const visTop = Math.max(rect.top, headerBottom);
                const visBottom = Math.min(rect.bottom, viewportBottom);
                const visible = Math.max(0, visBottom - visTop);
                if (visible > maxVisible) {
                    maxVisible = visible;
                    current = item.id;
                }
            }

            setActiveId(current);
            syncUrl(current);
        };

        window.addEventListener("scroll", update, { passive: true });
        // Run once after layout settles to set the correct initial active item
        const raf = requestAnimationFrame(update);
        return () => {
            window.removeEventListener("scroll", update);
            cancelAnimationFrame(raf);
        };
    }, [items, syncUrl, getArticleEl]);

    return (
        <div className="hidden lg:grid lg:grid-cols-[240px_1fr] lg:gap-6">
            <aside
                ref={asideRef}
                className="self-start"
                style={{ position: "sticky", top: 64 + CONTENT_GAP }}
            >
                <nav className="flex flex-col gap-0.5">
                    {items.map((item) => {
                        const isActive = activeId === item.id;
                        const dot = TYPE_STYLES[item.type]?.dot ?? TYPE_STYLES.update.dot;
                        const shortDate = item.publishedAt!.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                        });
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => { scrollTo(item.id); syncUrl(item.id); }}
                                className={`group flex w-full items-stretch gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors ${
                                    isActive
                                        ? "bg-stone-900/8 dark:bg-white/8"
                                        : "hover:bg-stone-900/4 dark:hover:bg-white/4"
                                }`}
                            >
                                <span className={`w-1.5 shrink-0 rounded-full transition-opacity ${dot} ${
                                    isActive ? "opacity-100" : "opacity-35 group-hover:opacity-65"
                                }`} />
                                <div className="min-w-0 flex-1">
                                    <p className={`truncate text-sm font-semibold leading-snug transition-colors ${
                                        isActive
                                            ? "text-stone-950 dark:text-stone-50"
                                            : "text-stone-500 group-hover:text-stone-900 dark:text-stone-400 dark:group-hover:text-stone-200"
                                    }`}>
                                        {item.title}
                                    </p>
                                    <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">{shortDate}</p>
                                </div>
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden
                                    className={`shrink-0 self-center transition-all duration-150 ${
                                        isActive
                                            ? "translate-x-0 text-stone-700 opacity-90 dark:text-stone-200"
                                            : "-translate-x-1 text-stone-400 opacity-0 group-hover:translate-x-0 group-hover:opacity-90 dark:text-stone-500"
                                    }`}
                                >
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>
                        );
                    })}
                </nav>
            </aside>

            <div ref={articlesRef} className="min-w-0 space-y-8">
                {items.map((item) => (
                    <div
                        key={item.id}
                        data-post-id={item.id}
                        className="rounded-xl border border-stone-900/12 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-stone-900/60"
                    >
                        <ArticleView item={item} titleAs="h2" />
                    </div>
                ))}
            </div>
        </div>
    );
}
