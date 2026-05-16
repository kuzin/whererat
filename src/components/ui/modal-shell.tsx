import Link from "next/link";
import type { ReactNode } from "react";

type ModalShellProps = {
    title: string;
    closeHref: string;
    /** Extra classes for the modal panel — include bg, dark border override, dark bg override */
    containerClassName?: string;
    /** Extra classes shared by the header and footer bars — include border-color and optional bg */
    headerFooterClassName?: string;
    /** Extra classes for the scrollable body div. When provided, replaces the default px-5 sm:px-6 padding classes. */
    bodyClassName?: string;
    children: ReactNode;
    footer: ReactNode;
};

export function ModalShell({
    title,
    closeHref,
    containerClassName = "max-w-3xl bg-white dark:border-white/20 dark:bg-stone-900",
    headerFooterClassName = "border-stone-900/10 dark:border-white/10",
    bodyClassName,
    children,
    footer,
}: ModalShellProps) {
    return (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/55 p-6">
            <div
                className={`flex w-full flex-col overflow-hidden rounded-2xl border-2 border-stone-950/22 shadow-[0_20px_60px_rgb(0_0_0/0.45)] ${containerClassName}`}
                style={{ maxHeight: "min(92dvh, calc(100dvh - 3rem))" }}
            >
                {/* Header */}
                <div className={`flex shrink-0 items-center gap-3 border-b px-5 py-4 sm:px-6 sm:py-5 ${headerFooterClassName}`}>
                    <h2 className="min-w-0 flex-1 truncate text-lg font-black text-stone-950 dark:text-stone-100">
                        {title}
                    </h2>
                    <Link
                        href={closeHref}
                        aria-label="Close"
                        title="Close"
                        className="wr-btn-ghost inline-flex h-9 w-9 shrink-0 items-center justify-center px-0 py-0"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4" aria-hidden="true">
                            <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                        </svg>
                    </Link>
                </div>

                {/* Scrollable body */}
                <div className={`min-h-0 flex-1 ${bodyClassName ?? "overflow-x-hidden overflow-y-auto px-5 sm:px-6"}`}>
                    {children}
                </div>

                {/* Footer */}
                <div
                    className={`flex shrink-0 flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:justify-end sm:px-6 ${headerFooterClassName}`}
                >
                    {footer}
                </div>
            </div>
        </div>
    );
}
