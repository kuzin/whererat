import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getPublishedNewsItems, NEWS_ITEM_TYPES, type NewsItem, type NewsItemType } from "@/lib/news-store";
import { SightingMarkdown } from "@/components/sighting-markdown";

export const metadata: Metadata = {
    title: "News",
    description: "Announcements, updates, and community news from the WhereRat team.",
    alternates: {
        canonical: "/news",
    },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function single(v: string | string[] | undefined) {
    return Array.isArray(v) ? v[0] : v;
}

const TYPE_STYLES: Record<NewsItemType, { chip: string; dot: string }> = {
    announcement: {
        chip: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/40",
        dot: "bg-blue-500 dark:bg-blue-400",
    },
    "product-news": {
        chip: "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700/40",
        dot: "bg-violet-500 dark:bg-violet-400",
    },
    community: {
        chip: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/40",
        dot: "bg-emerald-500 dark:bg-emerald-400",
    },
    update: {
        chip: "bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800/60 dark:text-stone-300 dark:border-stone-600/40",
        dot: "bg-stone-400 dark:bg-stone-500",
    },
};

function typeLabel(type: NewsItemType) {
    return NEWS_ITEM_TYPES.find((t) => t.value === type)?.label ?? type;
}

function TypeChip({ type }: { type: NewsItemType }) {
    const style = TYPE_STYLES[type] ?? TYPE_STYLES.update;
    return (
        <span
            className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-bold uppercase tracking-[0.1em] ${style.chip}`}
        >
            {typeLabel(type)}
        </span>
    );
}

function SidebarItem({
    item,
    isActive,
}: {
    item: NewsItem;
    isActive: boolean;
}) {
    const pubDate = item.publishedAt!;
    const shortDate = pubDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    return (
        <Link
            href={`/news?post=${item.id}`}
            className={`group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${isActive
                ? "bg-stone-900/8 dark:bg-white/8"
                : "hover:bg-stone-900/4 dark:hover:bg-white/4"
                }`}
        >
            <div className="min-w-0 flex-1">
                <p
                    className={`truncate text-sm font-semibold leading-snug ${isActive
                        ? "text-stone-950 dark:text-stone-50"
                        : "text-stone-600 group-hover:text-stone-900 dark:text-stone-400 dark:group-hover:text-stone-200"
                        }`}
                >
                    {item.title}
                </p>
                <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">{shortDate}</p>
            </div>
            {isActive && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-stone-400 dark:text-stone-500" aria-hidden>
                    <path d="M9 18l6-6-6-6" />
                </svg>
            )}
        </Link>
    );
}

function ArticleView({ item, titleAs: Title = "h1" }: { item: NewsItem; titleAs?: "h1" | "h2" }) {
    const pubDate = item.publishedAt!;
    const formattedDate = pubDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <article>
            {/* Hero image */}
            {item.imageUrl && (
                <div className="relative mb-8 h-52 w-full overflow-hidden rounded-2xl sm:h-72">
                    <Image
                        src={item.imageUrl}
                        alt={item.imageAlt ?? ""}
                        fill
                        className="object-cover"
                        style={{
                            objectPosition: `${item.imagePositionX}% ${item.imagePositionY}%`,
                            ...(item.imageZoom !== 1 && {
                                transform: `scale(${item.imageZoom})`,
                                transformOrigin: `${item.imagePositionX}% ${item.imagePositionY}%`,
                            }),
                        }}
                        sizes="(max-width: 1024px) 100vw, 700px"
                        priority
                    />
                </div>
            )}

            {/* Type + date */}
            <div className="flex flex-wrap items-center gap-3">
                <TypeChip type={item.type} />
                <time
                    dateTime={pubDate.toISOString()}
                    className="text-sm text-stone-500 dark:text-stone-400"
                >
                    {formattedDate}
                </time>
            </div>

            {/* Title */}
            <Title className="wr-display mt-3 text-3xl font-bold leading-tight tracking-tight text-stone-950 sm:text-4xl dark:text-stone-50">
                {item.title}
            </Title>

            {/* Body */}
            <div className="mt-6">
                <SightingMarkdown markdown={item.body} />
            </div>

            {/* Author */}
            <div className="mt-8 flex items-center gap-3 border-t border-stone-900/10 pt-6 dark:border-white/10">
                <Image
                    src={item.authorAvatarUrl || "/brand/rat.svg"}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
                <div>
                    <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                        {item.authorName}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">WhereRat team</p>
                </div>
            </div>
        </article>
    );
}

export default async function NewsPage({
    searchParams,
}: {
    searchParams?: SearchParams;
}) {
    const params = searchParams ? await searchParams : {};
    const requestedId = single(params.post);

    const items = await getPublishedNewsItems();

    const selected =
        (requestedId ? items.find((i) => i.id === requestedId) : undefined) ??
        items[0];

    return (
        <main className="wr-page-shell py-10">
            <div className="flex items-baseline justify-between gap-4 mb-6 lg:hidden">
                <h1 className="wr-display text-3xl font-bold tracking-tight text-stone-950 dark:text-amber-50">
                    News
                </h1>
            </div>

            {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 py-20 text-center dark:border-stone-700">
                    <p className="text-lg font-semibold text-stone-500 dark:text-stone-400">
                        Nothing here yet.
                    </p>
                    <p className="mt-1 text-sm text-stone-400 dark:text-stone-500">Check back soon.</p>
                </div>
            ) : (
                <>
                    {/* Mobile: blog-style feed — all articles stacked */}
                    <div className="lg:hidden space-y-0">
                        {items.map((item, i) => (
                            <div key={item.id}>
                                {i > 0 && (
                                    <hr className="my-10 border-stone-900/10 dark:border-white/10" />
                                )}
                                <ArticleView item={item} titleAs="h2" />
                            </div>
                        ))}
                    </div>

                    {/* Desktop: sidebar + selected article */}
                    <div className="hidden lg:grid gap-8 lg:grid-cols-[240px_1fr] lg:items-start lg:gap-10">
                        {/* Sidebar */}
                        <aside className="lg:sticky lg:top-6">
                            <nav className="flex flex-col gap-0.5">
                                {items.map((item) => (
                                    <SidebarItem
                                        key={item.id}
                                        item={item}
                                        isActive={selected?.id === item.id}
                                    />
                                ))}
                            </nav>
                        </aside>

                        {/* Article */}
                        <div className="min-w-0 rounded-2xl border border-stone-900/12 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-stone-900/60">
                            {selected ? (
                                <ArticleView item={selected} />
                            ) : (
                                <p className="text-stone-500 dark:text-stone-400">Select a post.</p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </main>
    );
}

