"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ConfirmSubmitButton } from "./confirm-submit-button";

const ICON_BTN_GHOST =
    "wr-btn-ghost inline-flex h-11 w-11 items-center justify-center px-0 py-0";

const ICON_BTN_DANGER =
    "inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border-2 border-red-700/30 bg-red-50/80 text-red-700 outline-none transition shadow-[2px_2px_0_0_rgb(185_28_28/0.28)] hover:border-red-700/45 hover:bg-red-100 hover:shadow-[2px_2px_0_0_rgb(185_28_28/0.35)] active:brightness-95 active:shadow-none dark:border-red-400/25 dark:bg-red-950/40 dark:text-red-400 dark:shadow-[2px_2px_0_0_rgb(0_0_0/0.32)] dark:hover:bg-red-950/60";

const MENU_ITEM =
    "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800 [&_svg]:h-4 [&_svg]:w-4";

const MENU_ITEM_DANGER =
    "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 [&_svg]:h-4 [&_svg]:w-4";

type Common = {
    key: string;
    label: string;
    icon: ReactNode;
    danger?: boolean;
};

export type Action =
    | (Common & { kind: "link"; href: string; external?: boolean })
    | (Common & {
        kind: "form";
        formAction: (formData: FormData) => void | Promise<void>;
        hidden?: Record<string, string>;
    })
    | (Common & {
        kind: "confirm-form";
        formAction: (formData: FormData) => void | Promise<void>;
        hidden?: Record<string, string>;
        confirmMessage: string;
    })
    | (Common & { kind: "copy"; url: string })
    | (Common & {
        kind: "custom";
        /** Pre-rendered DOM for the inline icon-button variant (typically a <form> wrapping a button). */
        iconNode: ReactNode;
        /** Pre-rendered DOM for the dropdown menu-item variant. Falls back to iconNode when omitted. */
        menuNode?: ReactNode;
    });

/**
 * Row of icon-only action buttons that auto-collapses to a "..." overflow menu
 * when more than `maxVisible` are provided. The first (maxVisible - 1) actions
 * stay as inline icon buttons; the rest move into the dropdown.
 */
export function ActionMenuRow({
    actions,
    maxVisible = 2,
    className = "",
}: {
    actions: Action[];
    maxVisible?: number;
    className?: string;
}) {
    const containerCls = `flex items-center gap-1.5 sm:gap-2 ${className}`;

    if (actions.length <= maxVisible) {
        return (
            <div className={containerCls}>
                {actions.map((a) => <ActionIcon key={a.key} action={a} />)}
            </div>
        );
    }

    const inline = actions.slice(0, maxVisible - 1);
    const overflow = actions.slice(maxVisible - 1);

    return (
        <div className={containerCls}>
            {inline.map((a) => <ActionIcon key={a.key} action={a} />)}
            <OverflowMenu actions={overflow} />
        </div>
    );
}

// ---------- Inline icon-button variants ----------

function ActionIcon({ action }: { action: Action }) {
    const btnCls = action.danger ? ICON_BTN_DANGER : ICON_BTN_GHOST;
    switch (action.kind) {
        case "link":
            if (action.external) {
                return (
                    <a
                        href={action.href}
                        target="_blank"
                        rel="noreferrer"
                        className={btnCls}
                        title={action.label}
                    >
                        {action.icon}
                        <span className="sr-only">{action.label}</span>
                    </a>
                );
            }
            return (
                <Link href={action.href} className={btnCls} title={action.label}>
                    {action.icon}
                    <span className="sr-only">{action.label}</span>
                </Link>
            );
        case "form":
            return (
                <form action={action.formAction}>
                    {Object.entries(action.hidden ?? {}).map(([k, v]) => (
                        <input key={k} type="hidden" name={k} value={v} />
                    ))}
                    <button type="submit" className={btnCls} title={action.label}>
                        {action.icon}
                        <span className="sr-only">{action.label}</span>
                    </button>
                </form>
            );
        case "confirm-form":
            return (
                <form action={action.formAction}>
                    {Object.entries(action.hidden ?? {}).map(([k, v]) => (
                        <input key={k} type="hidden" name={k} value={v} />
                    ))}
                    <ConfirmSubmitButton
                        type="submit"
                        className={btnCls}
                        title={action.label}
                        confirmMessage={action.confirmMessage}
                    >
                        {action.icon}
                        <span className="sr-only">{action.label}</span>
                    </ConfirmSubmitButton>
                </form>
            );
        case "copy":
            return <CopyIconButton url={action.url} icon={action.icon} label={action.label} />;
        case "custom":
            return <>{action.iconNode}</>;
    }
}

function CopyIconButton({ url, icon, label }: { url: string; icon: ReactNode; label: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            type="button"
            onClick={() => doCopy(url, () => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            })}
            className={ICON_BTN_GHOST}
            title={copied ? "Copied!" : label}
        >
            {copied ? <CheckIcon /> : icon}
            <span className="sr-only">{copied ? "Copied!" : label}</span>
        </button>
    );
}

// ---------- Overflow menu + menu-item variants ----------

function OverflowMenu({ actions }: { actions: Action[] }) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return (
        <div ref={menuRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-label="More actions"
                title="More actions"
                aria-haspopup="menu"
                aria-expanded={open}
                className={ICON_BTN_GHOST}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                </svg>
            </button>
            {open && (
                <div
                    role="menu"
                    className="absolute right-0 top-full z-40 mt-1.5 min-w-[180px] overflow-hidden rounded-xl border border-stone-900/12 bg-white py-1 shadow-[0_10px_30px_rgb(0_0_0/0.18)] dark:border-white/10 dark:bg-stone-900 dark:shadow-[0_10px_30px_rgb(0_0_0/0.55)]"
                >
                    {actions.map((a) => (
                        <ActionMenuItem key={a.key} action={a} onClose={() => setOpen(false)} />
                    ))}
                </div>
            )}
        </div>
    );
}

function ActionMenuItem({ action, onClose }: { action: Action; onClose: () => void }) {
    const cls = action.danger ? MENU_ITEM_DANGER : MENU_ITEM;
    switch (action.kind) {
        case "link":
            if (action.external) {
                return (
                    <a
                        href={action.href}
                        target="_blank"
                        rel="noreferrer"
                        className={cls}
                        role="menuitem"
                        onClick={onClose}
                    >
                        {action.icon}
                        {action.label}
                    </a>
                );
            }
            return (
                <Link href={action.href} className={cls} role="menuitem" onClick={onClose}>
                    {action.icon}
                    {action.label}
                </Link>
            );
        case "form":
            return (
                <form action={action.formAction} className="contents">
                    {Object.entries(action.hidden ?? {}).map(([k, v]) => (
                        <input key={k} type="hidden" name={k} value={v} />
                    ))}
                    <button
                        type="submit"
                        className={cls}
                        role="menuitem"
                        onClick={onClose}
                    >
                        {action.icon}
                        {action.label}
                    </button>
                </form>
            );
        case "confirm-form":
            // Do NOT close the menu here — ConfirmSubmitButton renders its modal
            // as a sibling, and unmounting the menu would unmount the modal too.
            // The menu stays mounted behind the modal until the user confirms
            // (page navigates / revalidates) or clicks outside after cancelling.
            return (
                <form action={action.formAction} className="contents">
                    {Object.entries(action.hidden ?? {}).map(([k, v]) => (
                        <input key={k} type="hidden" name={k} value={v} />
                    ))}
                    <ConfirmSubmitButton
                        type="submit"
                        className={cls}
                        confirmMessage={action.confirmMessage}
                    >
                        {action.icon}
                        {action.label}
                    </ConfirmSubmitButton>
                </form>
            );
        case "copy":
            return <CopyMenuItem url={action.url} icon={action.icon} label={action.label} />;
        case "custom":
            return <>{action.menuNode ?? action.iconNode}</>;
    }
}

function CopyMenuItem({ url, icon, label }: { url: string; icon: ReactNode; label: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            type="button"
            onClick={() => doCopy(url, () => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
            })}
            className={MENU_ITEM}
            role="menuitem"
        >
            {copied ? <CheckIcon /> : icon}
            {copied ? "Copied!" : label}
        </button>
    );
}

// ---------- Helpers ----------

async function doCopy(url: string, onDone: () => void) {
    // Resolve relative URLs against the current origin so we always copy
    // a full shareable link.
    const fullUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;
    try {
        await navigator.clipboard.writeText(fullUrl);
    } catch {
        const el = document.createElement("textarea");
        el.value = fullUrl;
        el.style.cssText = "position:fixed;opacity:0;pointer-events:none";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
    }
    onDone();
}

function CheckIcon() {
    return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}
