"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ModalShell } from "@/components/modal-shell";
import { sendNewsletterDigestAction, sendNewsletterDigestTestAction } from "./actions";

type ComposeItem = {
  id: string;
  title: string;
  type: string;
  publishedAt: string;
  alreadySent: boolean;
};

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

  const effectiveSubject = subjectTouched ? subject : suggestedSubject;

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
      footer={
        <>
          <Link href="/moderation/news" className="wr-btn-ghost mr-auto">
            Cancel
          </Link>
          <button
            form="newsletter-test-form"
            type="submit"
            className="wr-btn-ghost"
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
            className="wr-btn-primary"
            disabled={!canSend}
          >
            {selectedItems.length > 0
              ? `Send to subscribers (${selectedItems.length})`
              : "Send to subscribers"}
          </button>
        </>
      }
    >
      <div className="grid gap-5 py-5">
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

        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-stone-700 dark:text-stone-200">
            Posts to include
          </p>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-stone-500 dark:text-stone-400">
            <input
              type="checkbox"
              checked={showAlreadySent}
              onChange={(e) => setShowAlreadySent(e.target.checked)}
              className="h-3.5 w-3.5 rounded accent-amber-600"
            />
            Show already-sent
          </label>
        </div>

        {visibleItems.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
            {items.length === 0
              ? "No published posts yet."
              : "All published posts have been newslettered. Toggle 'Show already-sent' to include them."}
          </p>
        ) : (
          <ul className="divide-y divide-stone-900/10 rounded-2xl border border-stone-900/12 bg-white dark:divide-white/10 dark:border-white/10 dark:bg-stone-900/70">
            {visibleItems.map((item) => {
              const checked = selectedIds.has(item.id);
              return (
                <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSelected(item.id)}
                    aria-label={`Include "${item.title}"`}
                    className="h-4 w-4 rounded accent-amber-600"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-stone-950 dark:text-stone-100">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                      {item.type} · Published {formattedDate(item.publishedAt)}
                      {item.alreadySent ? (
                        <span className="ml-2 inline-flex rounded border border-amber-700/35 bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-950 dark:border-amber-400/25 dark:bg-amber-950/35 dark:text-amber-200">
                          Already sent
                        </span>
                      ) : null}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <form id="newsletter-digest-form" action={sendNewsletterDigestAction} className="hidden">
          <input type="hidden" name="subject" value={effectiveSubject} />
          {selectedItems.map((i) => (
            <input key={i.id} type="hidden" name="newsItemId" value={i.id} />
          ))}
        </form>
        <form id="newsletter-test-form" action={sendNewsletterDigestTestAction} className="hidden">
          <input type="hidden" name="subject" value={effectiveSubject} />
          {selectedItems.map((i) => (
            <input key={i.id} type="hidden" name="newsItemId" value={i.id} />
          ))}
        </form>
      </div>
    </ModalShell>
  );
}
