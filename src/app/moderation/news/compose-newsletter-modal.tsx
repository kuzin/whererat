"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ModalShell } from "@/components/modal-shell";
import { sendNewsletterDigestAction, sendNewsletterDigestTestAction } from "./actions";

type ComposeItem = {
  id: string;
  title: string;
  type: string;
  publishedAt: string;
  alreadySent: boolean;
};

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 ${checked ? "bg-amber-500" : "bg-stone-300 dark:bg-stone-600"}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[18px]" : "translate-x-[3px]"}`}
      />
    </button>
  );
}

function wrapSelection(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
  setValue: (v: string) => void,
) {
  const { selectionStart: start, selectionEnd: end, value } = textarea;
  const selected = value.slice(start, end);
  const wrapped = `${before}${selected || "text"}${after}`;
  const next = value.slice(0, start) + wrapped + value.slice(end);
  setValue(next);
  requestAnimationFrame(() => {
    textarea.focus();
    const newCursor = start + before.length + (selected || "text").length + after.length;
    textarea.setSelectionRange(newCursor, newCursor);
  });
}

export function ComposeNewsletterModal({
  items,
  moderatorEmail,
  initialShowAlreadySent,
}: {
  items: ComposeItem[];
  moderatorEmail: string;
  initialShowAlreadySent: boolean;
}) {
  const [showAlreadySent, setShowAlreadySent] = useState(initialShowAlreadySent);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("");
  const [subjectTouched, setSubjectTouched] = useState(false);
  const [heading, setHeading] = useState("");
  const [headingTouched, setHeadingTouched] = useState(false);
  const [subhead, setSubhead] = useState("");
  const [subheadTouched, setSubheadTouched] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const subheadRef = useRef<HTMLTextAreaElement>(null);

  const visibleItems = useMemo(
    () => (showAlreadySent ? items : items.filter((i) => !i.alreadySent)),
    [items, showAlreadySent],
  );

  const selectedItems = useMemo(
    () => items.filter((i) => selectedIds.has(i.id)),
    [items, selectedIds],
  );

  const suggestedSubject = useMemo(() => {
    if (selectedItems.length === 0) return "";
    if (selectedItems.length === 1) return selectedItems[0].title;
    return `WhereRat — ${selectedItems.length} new posts`;
  }, [selectedItems]);

  const suggestedHeading = useMemo(() => {
    if (selectedItems.length === 0) return "";
    if (selectedItems.length === 1) return selectedItems[0].title;
    return "Fresh from WhereRat";
  }, [selectedItems]);

  const suggestedSubhead = useMemo(() => {
    if (selectedItems.length === 0) return "";
    if (selectedItems.length === 1) return "A fresh update from the WhereRat catalog.";
    return `${selectedItems.length} new updates from the WhereRat catalog.`;
  }, [selectedItems]);

  const effectiveSubject = subjectTouched ? subject : suggestedSubject;
  const effectiveHeading = headingTouched ? heading : suggestedHeading;
  const effectiveSubhead = subheadTouched ? subhead : suggestedSubhead;

  // Build preview URL with 600ms debounce (empty state clears immediately)
  useEffect(() => {
    const delay = selectedItems.length === 0 ? 0 : 600;
    const timer = setTimeout(() => {
      if (selectedItems.length === 0) {
        setPreviewUrl("");
        return;
      }
      const params = new URLSearchParams();
      selectedItems.forEach((i) => params.append("id", i.id));
      if (effectiveHeading) params.set("heading", effectiveHeading);
      if (effectiveSubhead) params.set("subhead", effectiveSubhead);
      setPreviewUrl(`/email-preview/newsletter?${params.toString()}`);
    }, delay);
    return () => clearTimeout(timer);
  }, [selectedItems, effectiveHeading, effectiveSubhead]);

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const canSend = selectedItems.length > 0;
  const formattedDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <ModalShell
      title="Compose newsletter"
      closeHref="/moderation/news"
      containerClassName="bg-white dark:border-white/20 dark:bg-stone-900 max-w-5xl"
      bodyClassName="flex min-h-0 flex-col overflow-hidden lg:flex-row lg:divide-x lg:divide-stone-900/10 dark:lg:divide-white/10"
      footer={
        <>
          <button
            form="newsletter-test-form"
            type="submit"
            className="wr-btn-ghost w-full sm:mr-auto sm:w-auto"
            disabled={!canSend}
            title={
              canSend
                ? `Send a test copy to ${moderatorEmail}`
                : "Pick at least one post"
            }
          >
            Send test to me
          </button>
          <button
            form="newsletter-digest-form"
            type="submit"
            className="wr-btn-primary w-full sm:w-auto"
            disabled={!canSend}
          >
            {selectedItems.length > 0
              ? `Send to subscribers (${selectedItems.length})`
              : "Send to subscribers"}
          </button>
        </>
      }
    >
      {/* Left pane — form */}
      <div className="flex min-h-0 w-full flex-col gap-5 overflow-y-auto px-5 py-5 sm:px-6 lg:w-96 lg:shrink-0">
        <div>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-stone-700 dark:text-stone-200">
              Subject
            </span>
            <input
              type="text"
              value={effectiveSubject}
              onChange={(e) => {
                setSubjectTouched(true);
                setSubject(e.target.value);
              }}
              placeholder={suggestedSubject || "Subject line"}
              className="wr-input"
              maxLength={140}
            />
            <span className="text-xs font-medium text-stone-400 dark:text-stone-500">
              Auto-suggested from your selection. Edit freely.
            </span>
          </label>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-stone-700 dark:text-stone-200">
              Email heading
            </span>
            <input
              type="text"
              value={effectiveHeading}
              onChange={(e) => {
                setHeadingTouched(true);
                setHeading(e.target.value);
              }}
              placeholder={suggestedHeading || "Email heading"}
              className="wr-input"
              maxLength={100}
            />
          </label>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-stone-700 dark:text-stone-200">
                Subhead
              </span>
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  title="Bold (**text**)"
                  onClick={() =>
                    subheadRef.current &&
                    wrapSelection(subheadRef.current, "**", "**", (v) => {
                      setSubheadTouched(true);
                      setSubhead(v);
                    })
                  }
                  className="flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                >
                  B
                </button>
                <button
                  type="button"
                  title="Italic (_text_)"
                  onClick={() =>
                    subheadRef.current &&
                    wrapSelection(subheadRef.current, "_", "_", (v) => {
                      setSubheadTouched(true);
                      setSubhead(v);
                    })
                  }
                  className="flex h-6 w-6 items-center justify-center rounded text-xs italic text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                >
                  I
                </button>
              </span>
            </div>
            <textarea
              ref={subheadRef}
              value={effectiveSubhead}
              onChange={(e) => {
                setSubheadTouched(true);
                setSubhead(e.target.value);
              }}
              placeholder={suggestedSubhead || "Subhead"}
              className="wr-input h-auto resize-none py-3"
              rows={3}
              maxLength={400}
            />
            <span className="text-xs font-medium text-stone-400 dark:text-stone-500">
              Supports **bold** and _italic_.
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <p className="text-sm font-bold text-stone-700 dark:text-stone-200">
                Posts to include
              </p>
              {selectedItems.length > 0 && (
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  {selectedItems.length} selected
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-stone-500 dark:text-stone-400">Already sent</span>
              <Toggle
                checked={showAlreadySent}
                onChange={setShowAlreadySent}
                label="Show already-sent posts"
              />
            </div>
          </div>

          {visibleItems.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
              {items.length === 0
                ? "No published posts yet."
                : "All posts have been sent. Toggle 'Show already-sent' to include them."}
            </p>
          ) : (
            <ul className="overflow-hidden rounded-2xl border border-stone-900/12 dark:border-white/10">
              {visibleItems.map((item, i) => {
                const checked = selectedIds.has(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggleSelected(item.id)}
                      aria-pressed={checked}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${i > 0 ? "border-t border-stone-900/10 dark:border-white/10" : ""} ${
                        checked
                          ? "bg-amber-50 dark:bg-amber-950/30"
                          : "bg-white hover:bg-stone-50 dark:bg-stone-900/70 dark:hover:bg-stone-800/50"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          checked
                            ? "border-amber-500 bg-amber-500"
                            : "border-stone-300 dark:border-stone-600"
                        }`}
                      >
                        {checked && (
                          <svg viewBox="0 0 10 8" fill="none" className="h-2.5 w-2.5" aria-hidden="true">
                            <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-semibold ${checked ? "text-amber-900 dark:text-amber-200" : "text-stone-950 dark:text-stone-100"}`}>
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                          {item.type} · {formattedDate(item.publishedAt)}
                          {item.alreadySent && (
                            <span className="ml-2 inline-flex rounded border border-amber-700/35 bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-950 dark:border-amber-400/25 dark:bg-amber-950/35 dark:text-amber-200">
                              Sent
                            </span>
                          )}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <form id="newsletter-digest-form" action={sendNewsletterDigestAction} className="hidden">
          <input type="hidden" name="subject" value={effectiveSubject} />
          <input type="hidden" name="heading" value={effectiveHeading} />
          <input type="hidden" name="subhead" value={effectiveSubhead} />
          {selectedItems.map((i) => (
            <input key={i.id} type="hidden" name="newsItemId" value={i.id} />
          ))}
        </form>
        <form id="newsletter-test-form" action={sendNewsletterDigestTestAction} className="hidden">
          <input type="hidden" name="subject" value={effectiveSubject} />
          <input type="hidden" name="heading" value={effectiveHeading} />
          <input type="hidden" name="subhead" value={effectiveSubhead} />
          {selectedItems.map((i) => (
            <input key={i.id} type="hidden" name="newsItemId" value={i.id} />
          ))}
        </form>
      </div>

      {/* Right pane — live email preview (desktop only) */}
      <div className="relative hidden min-h-0 flex-1 overflow-hidden bg-stone-50 lg:block dark:bg-stone-950">
        {selectedItems.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8 text-center text-sm text-stone-400 dark:text-stone-500">
            Select posts on the left to preview the email.
          </div>
        ) : (
          <>
            <iframe
              key={previewUrl}
              src={previewUrl}
              className="h-full w-full border-0"
              title="Email preview"
            />
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in new tab"
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg bg-white/80 text-stone-500 shadow-sm backdrop-blur-sm hover:bg-white hover:text-stone-800 dark:bg-stone-800/80 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-stone-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5" aria-hidden="true">
                <path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z" />
                <path d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5Z" />
              </svg>
            </a>
          </>
        )}
      </div>
    </ModalShell>
  );
}
