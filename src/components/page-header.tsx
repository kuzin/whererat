import Link from "next/link";
import type { ReactNode } from "react";
import { ActionMenuRow, type Action } from "./action-menu-row";

type PrimaryAction = {
    href: string;
    label: string;
    icon: ReactNode;
};

type Props = {
    /**
     * Back-navigation chevron on the left. Omit to skip.
     * `label` is the short destination name (e.g. "Catalog", "Moderation") —
     * shown as "< {label}" text when there is no `title`, and used as the
     * a11y "Back to {label}" tooltip in all cases.
     */
    back?: { href: string; label: string };
    /** Optional page title shown next to the back chevron. */
    title?: string;
    /** Standard action buttons, collapse to "..." when more than ActionMenuRow's maxVisible. */
    actions?: Action[];
    /** Prominent primary action — icon-only on mobile, icon + label on `sm:` and up. Always visible. */
    primaryAction?: PrimaryAction;
    /**
     * When `true`, the back link picks up `var(--wr-accent-btn)` for its text/hover
     * color so it matches the page's accent palette. Use on themed pages such as
     * /movies/[slug] where the palette overrides `--wr-accent-btn` on `:root`.
     */
    themed?: boolean;
    /** Tailwind class for the wrapper (e.g., `mb-6`). Defaults to a 6-unit bottom margin. */
    className?: string;
};

/**
 * Shared page-header bar: bare back chevron, optional title, ActionMenuRow on the right
 * (with auto-overflow), and an optional always-visible primary action button.
 *
 * Used by /movies/[slug], /moderation/news, /moderation/users — same look everywhere.
 *
 * Convention for slotting actions:
 *  • **Submit / create** actions (the page's main CTA) belong in `primaryAction` —
 *    they sit OUTSIDE the overflow menu and are always visible (orange button).
 *  • **Delete / destructive** actions belong in `actions` and should be placed
 *    LAST so they fall to the bottom of the overflow dropdown. Always mark
 *    them with `danger: true`.
 *  • Everything else (edit, sync, external links, etc.) goes in `actions`,
 *    ordered by frequency-of-use (most-used first → most likely to stay inline
 *    when `ActionMenuRow` collapses to a `…` flyout).
 */
export function PageHeader({
    back,
    title,
    actions,
    primaryAction,
    themed = false,
    className = "mb-6",
}: Props) {
    const backTooltip = back ? `Back to ${back.label}` : undefined;

    // Themed: pick up the page's `--wr-accent-btn` palette override (75% opacity
    // at rest, 100% on hover). Untheme: muted stone with near-black hover.
    const backLinkColor = themed
        ? "text-[color-mix(in_srgb,var(--wr-accent-btn)_75%,transparent)] hover:text-[var(--wr-accent-btn)]"
        : "text-stone-500 hover:text-stone-950 dark:text-stone-400 dark:hover:text-stone-50";
    const chevron = (
        <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d="M15 18l-6-6 6-6" />
        </svg>
    );

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="flex min-w-0 flex-1 items-center gap-2">
                {back && (
                    title ? (
                        // With a title: chevron-only icon link, sr-only label
                        <Link
                            href={back.href}
                            title={backTooltip}
                            className={`-ml-1 inline-flex h-10 w-10 shrink-0 items-center justify-center transition-colors ${backLinkColor}`}
                        >
                            {chevron}
                            <span className="sr-only">{backTooltip}</span>
                        </Link>
                    ) : (
                        // No title: chevron + visible "Back to {label}" text
                        <Link
                            href={back.href}
                            title={backTooltip}
                            className={`-ml-1 inline-flex h-10 shrink-0 items-center gap-1 pr-2 text-base font-semibold transition-colors sm:text-lg ${backLinkColor}`}
                        >
                            {chevron}
                            <span>Back to {back.label}</span>
                        </Link>
                    )
                )}
                {title && (
                    <h1 className="truncate text-xl font-black text-stone-950 sm:text-2xl dark:text-stone-50">
                        {title}
                    </h1>
                )}
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                {actions && actions.length > 0 && <ActionMenuRow actions={actions} />}
                {primaryAction && <PrimaryActionButton {...primaryAction} />}
            </div>
        </div>
    );
}

function PrimaryActionButton({ href, label, icon }: PrimaryAction) {
    return (
        <>
            <Link
                href={href}
                className="wr-btn-primary h-11 w-11 px-0 sm:hidden"
                title={label}
            >
                {icon}
                <span className="sr-only">{label}</span>
            </Link>
            <Link
                href={href}
                className="wr-btn-primary hidden gap-1.5 text-sm sm:inline-flex"
            >
                {icon}
                {label}
            </Link>
        </>
    );
}
