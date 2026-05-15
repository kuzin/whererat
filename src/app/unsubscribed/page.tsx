import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Unsubscribed — WhereRat",
    robots: "noindex",
};

type Props = {
    searchParams: Promise<{ status?: string }>;
};

export default async function UnsubscribedPage({ searchParams }: Props) {
    const { status } = await searchParams;
    const isOk = status === "ok";

    return (
        <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
            <div className="max-w-md">
                <p className="mb-4 text-5xl">{isOk ? "👋" : "🤔"}</p>
                <h1 className="wr-display mb-3 text-2xl font-bold text-stone-900 dark:text-amber-50">
                    {isOk ? "You're unsubscribed" : "Link not recognised"}
                </h1>
                <p className="mb-8 text-stone-600 dark:text-stone-400">
                    {isOk
                        ? "You've been removed from WhereRat update emails. You won't receive any more newsletters."
                        : "This unsubscribe link is no longer valid — you may have already been unsubscribed."}
                </p>
                <Link
                    href="/"
                    className="text-sm font-semibold text-amber-700 underline-offset-4 hover:underline dark:text-amber-400"
                >
                    Back to WhereRat
                </Link>
            </div>
        </main>
    );
}
