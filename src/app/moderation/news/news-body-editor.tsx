"use client";

import { useRef } from "react";

// ── Toolbar definition ────────────────────────────────────────────────────────

type ToolAction =
    | { kind: "wrap"; prefix: string; suffix: string; placeholder: string }
    | { kind: "line"; prefix: string };

type ToolButton = {
    type: "button";
    label: string;
    title: string;
    action: ToolAction;
};
type Separator = { type: "sep" };
type ToolItem = ToolButton | Separator;

const TOOLBAR: ToolItem[] = [
    {
        type: "button", label: "H2", title: "Heading 2",
        action: { kind: "line", prefix: "## " },
    },
    {
        type: "button", label: "H3", title: "Heading 3",
        action: { kind: "line", prefix: "### " },
    },
    { type: "sep" },
    {
        type: "button", label: "B", title: "Bold",
        action: { kind: "wrap", prefix: "**", suffix: "**", placeholder: "bold text" },
    },
    {
        type: "button", label: "I", title: "Italic",
        action: { kind: "wrap", prefix: "_", suffix: "_", placeholder: "italic text" },
    },
    { type: "sep" },
    {
        type: "button", label: "Link", title: "Link",
        action: { kind: "wrap", prefix: "[", suffix: "](https://)", placeholder: "link text" },
    },
    { type: "sep" },
    {
        type: "button", label: "• List", title: "Bullet list",
        action: { kind: "line", prefix: "- " },
    },
    {
        type: "button", label: "1. List", title: "Numbered list",
        action: { kind: "line", prefix: "1. " },
    },
    { type: "sep" },
    {
        type: "button", label: "Quote", title: "Blockquote",
        action: { kind: "line", prefix: "> " },
    },
    {
        type: "button", label: "Code", title: "Inline code",
        action: { kind: "wrap", prefix: "`", suffix: "`", placeholder: "code" },
    },
    {
        type: "button", label: "```", title: "Code block",
        action: { kind: "wrap", prefix: "```\n", suffix: "\n```", placeholder: "code" },
    },
    { type: "sep" },
    {
        type: "button", label: "—", title: "Horizontal rule",
        action: { kind: "wrap", prefix: "\n\n---\n\n", suffix: "", placeholder: "" },
    },
];

// ── Text manipulation ─────────────────────────────────────────────────────────

function applyAction(
    textarea: HTMLTextAreaElement,
    action: ToolAction,
) {
    const { selectionStart: start, selectionEnd: end, value } = textarea;
    const selected = value.slice(start, end);

    let newValue: string;
    let newStart: number;
    let newEnd: number;

    if (action.kind === "wrap") {
        const text = selected || action.placeholder;
        newValue = value.slice(0, start) + action.prefix + text + action.suffix + value.slice(end);
        newStart = start + action.prefix.length;
        newEnd = newStart + text.length;
    } else {
        // "line" — prefix the start of each selected line (or current line)
        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const lineEnd = end === start ? value.indexOf("\n", start) : end;
        const safeEnd = lineEnd === -1 ? value.length : lineEnd;
        const block = value.slice(lineStart, safeEnd);
        const lines = block.split("\n");
        const prefixed = lines.map((l) => action.prefix + l).join("\n");
        newValue = value.slice(0, lineStart) + prefixed + value.slice(safeEnd);
        newStart = lineStart + action.prefix.length;
        newEnd = newStart + (selected ? prefixed.length - action.prefix.length : 0);
    }

    // Apply via execCommand so undo history is preserved, fall back to direct assignment
    textarea.focus();
    textarea.setSelectionRange(0, value.length);
    const ok = document.execCommand("insertText", false, newValue);
    if (!ok) {
        // execCommand not supported (Firefox nightly, some SSR hydration paths)
        textarea.value = newValue;
        // Dispatch input event so React synthetic state updates if needed
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
    textarea.setSelectionRange(newStart, newEnd);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NewsBodyEditor({ defaultValue }: { defaultValue?: string }) {
    const ref = useRef<HTMLTextAreaElement>(null);

    const handleTool = (action: ToolAction) => {
        if (!ref.current) return;
        applyAction(ref.current, action);
    };

    return (
        <div className="flex flex-col overflow-hidden rounded-xl border border-[var(--wr-input-border)] bg-[var(--wr-input-bg)] transition-colors focus-within:border-[var(--wr-input-border-focus)] focus-within:shadow-[0_0_0_3px_var(--wr-shadow-input-focus)]">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--wr-input-border)] bg-stone-50 px-2 py-1.5 dark:bg-stone-900/50">
                {TOOLBAR.map((item, i) =>
                    item.type === "sep" ? (
                        <span
                            key={i}
                            className="mx-1 h-4 w-px shrink-0 bg-stone-300 dark:bg-stone-700"
                            aria-hidden
                        />
                    ) : (
                        <button
                            key={i}
                            type="button"
                            title={item.title}
                            onMouseDown={(e) => {
                                // Prevent textarea losing focus
                                e.preventDefault();
                                handleTool(item.action);
                            }}
                            className="rounded px-2 py-1 font-mono text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-200 hover:text-stone-900 active:bg-stone-300 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-stone-100 dark:active:bg-stone-600"
                        >
                            {item.label}
                        </button>
                    ),
                )}
            </div>

            {/* Textarea — no wr-input border/focus styles (handled by wrapper) */}
            <textarea
                ref={ref}
                name="body"
                required
                rows={16}
                defaultValue={defaultValue ?? ""}
                placeholder="Write your post in Markdown…"
                className="h-auto w-full resize-y bg-transparent px-4 py-3 font-mono text-sm leading-relaxed text-[var(--wr-input-text)] outline-none placeholder:text-stone-400 dark:placeholder:text-stone-600"
            />
        </div>
    );
}
