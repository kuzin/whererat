"use client";

import { useRef } from "react";
import { MarkdownToolbar, applyAction } from "@/components/forms/markdown-toolbar";

export function NewsBodyEditor({ defaultValue }: { defaultValue?: string }) {
    const ref = useRef<HTMLTextAreaElement>(null);

    const handleTool = (action: Parameters<typeof applyAction>[1]) => {
        if (!ref.current) return;
        applyAction(ref.current, action);
    };

    return (
        <div className="flex flex-col overflow-hidden rounded-xl border border-[var(--wr-input-border)] bg-[var(--wr-input-bg)] transition-colors focus-within:border-[var(--wr-input-border-focus)] focus-within:shadow-[0_0_0_3px_var(--wr-shadow-input-focus)]">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--wr-input-border)] bg-stone-50 px-2 py-1.5 dark:bg-stone-900/50">
                <MarkdownToolbar onAction={handleTool} />
            </div>

            {/* Textarea */}
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
