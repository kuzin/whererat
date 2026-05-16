"use client";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ToolAction =
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

// ── Toolbar definition ────────────────────────────────────────────────────────

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

export function applyAction(
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

    textarea.focus();
    textarea.setSelectionRange(0, value.length);
    const ok = document.execCommand("insertText", false, newValue);
    if (!ok) {
        textarea.value = newValue;
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
    textarea.setSelectionRange(newStart, newEnd);
}

// ── Component ─────────────────────────────────────────────────────────────────

const BTN =
    "rounded px-2 py-1 font-mono text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-200 hover:text-stone-900 active:bg-stone-300 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-stone-100 dark:active:bg-stone-600";

export function MarkdownToolbar({ onAction }: { onAction: (action: ToolAction) => void }) {
    return (
        <>
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
                            e.preventDefault();
                            onAction(item.action);
                        }}
                        className={BTN}
                    >
                        {item.label}
                    </button>
                ),
            )}
        </>
    );
}
