"use client";

import { useState, type ReactNode } from "react";

type TabId = "pending" | "approved" | "denied";

export function SightingsTabs({
  pendingCount,
  approvedCount,
  deniedCount,
  pendingContent,
  approvedContent,
  deniedContent,
}: {
  pendingCount: number;
  approvedCount: number;
  deniedCount: number;
  pendingContent: ReactNode;
  approvedContent: ReactNode;
  deniedContent: ReactNode;
}) {
  const [tab, setTab] = useState<TabId>("pending");

  const tabs: Array<{ id: TabId; label: string; count: number; dotClass: string }> = [
    { id: "pending", label: "Pending", count: pendingCount, dotClass: "bg-yellow-500 dark:bg-yellow-400" },
    { id: "approved", label: "Approved", count: approvedCount, dotClass: "bg-emerald-500 dark:bg-emerald-400" },
    { id: "denied", label: "Denied", count: deniedCount, dotClass: "bg-rose-500 dark:bg-rose-400" },
  ];

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-black tracking-tight">Sightings</h2>
        <div
          role="tablist"
          aria-label="Sighting status"
          className="inline-flex flex-wrap rounded-xl border border-stone-900/18 bg-white p-1 dark:border-white/12 dark:bg-stone-900/70"
        >
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950/40 focus-visible:ring-offset-2 dark:focus-visible:ring-amber-400/55 dark:focus-visible:ring-offset-stone-900 ${
                  active
                    ? "bg-stone-950 text-amber-100"
                    : "text-stone-700 hover:text-stone-900 dark:text-stone-200 dark:hover:text-white"
                }`}
              >
                <span aria-hidden className={`inline-block h-2 w-2 rounded-full ${t.dotClass}`} />
                {t.label} ({t.count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6" role="tabpanel" hidden={tab !== "pending"}>
        {pendingContent}
      </div>
      <div className="mt-6" role="tabpanel" hidden={tab !== "approved"}>
        {approvedContent}
      </div>
      <div className="mt-6" role="tabpanel" hidden={tab !== "denied"}>
        {deniedContent}
      </div>
    </>
  );
}
