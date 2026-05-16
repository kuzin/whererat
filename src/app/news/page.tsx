import type { Metadata } from "next";
import { Fragment } from "react";
import { getPublishedNewsItems, type NewsItemType } from "@/lib/news-store";
import { TYPE_STYLES, ArticleView } from "@/components/news/article-view";
import { NewsDesktopLayout } from "@/components/news/news-desktop-layout";

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

export default async function NewsPage({
    searchParams,
}: {
    searchParams?: SearchParams;
}) {
    const params = searchParams ? await searchParams : {};
    const requestedId = single(params.post);

    const items = await getPublishedNewsItems();

    return (
        <main className="wr-page-shell py-10">
            <div className="mb-6 flex items-baseline justify-between gap-4 lg:hidden">
                <h1 className="wr-display text-3xl font-bold tracking-tight text-stone-950 dark:text-amber-50">
                    News
                </h1>
            </div>

            {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 py-20 text-center dark:border-stone-700">
                    <p className="text-lg font-semibold text-stone-500 dark:text-stone-400">Nothing here yet.</p>
                    <p className="mt-1 text-sm text-stone-400 dark:text-stone-500">Check back soon.</p>
                </div>
            ) : (
                <>
                    {/* Mobile: blog-style feed — all articles stacked */}
                    <div className="lg:hidden">
                        {items.length > 1 && (
                            <nav className="mb-8 flex flex-col gap-0.5">
                                {items.map((item) => {
                                    const dot = TYPE_STYLES[item.type as NewsItemType]?.dot ?? TYPE_STYLES.update.dot;
                                    const shortDate = item.publishedAt!.toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    });
                                    return (
                                        <a
                                            key={item.id}
                                            href={`#post-${item.id}`}
                                            className="group flex items-stretch gap-2.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-stone-900/4 dark:hover:bg-white/4"
                                        >
                                            <span className={`w-1.5 shrink-0 rounded-full opacity-35 transition-opacity group-hover:opacity-65 ${dot}`} />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold leading-snug text-stone-500 transition-colors group-hover:text-stone-900 dark:text-stone-400 dark:group-hover:text-stone-200">
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
                                                className="shrink-0 self-center text-stone-400 opacity-60 transition-opacity group-hover:opacity-100 dark:text-stone-500"
                                            >
                                                <polyline points="9 18 15 12 9 6" />
                                            </svg>
                                        </a>
                                    );
                                })}
                            </nav>
                        )}
                        <div className="space-y-0">
                            {items.map((item, i) => (
                                <Fragment key={item.id}>
                                    {i > 0 && <hr className="my-10 border-stone-900/10 dark:border-white/10" />}
                                    <div id={`post-${item.id}`} className="scroll-mt-24">
                                        <ArticleView item={item} titleAs="h2" />
                                    </div>
                                </Fragment>
                            ))}
                        </div>
                    </div>

                    {/* Desktop: scroll-spy sidebar + all articles */}
                    <NewsDesktopLayout items={items} initialId={requestedId} />
                </>
            )}
        </main>
    );
}
