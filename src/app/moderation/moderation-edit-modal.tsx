"use client";

import { useState } from "react";
import Link from "next/link";
import {
  SightingTimestampField,
  SightingRatCountField,
  SightingDescriptionField,
  SightingContentWarningsField,
  SightingRodentTypesField,
} from "@/components/sighting-fields";
import { EditableSightingImagesField } from "@/components/editable-sighting-images-field";
import {
  getSightingTimestampPercent,
  getSubmissionImageRefs,
  getSubmissionSightingTitle,
  RODENT_TYPE_OPTIONS,
  rodentCountFieldLabel,
  rodentSwarmNoun,
  type Submission,
} from "@/lib/whererat";

export function ModerationEditModal({
  submission,
  moderateAction,
}: {
  submission: Submission;
  moderateAction: (formData: FormData) => void | Promise<void>;
}) {
  const initialRodentTypes = submission.rodentTypes ?? ["rat"];
  const [selectedRodentTypes, setSelectedRodentTypes] = useState<string[]>(initialRodentTypes);
  const rodentOption =
    selectedRodentTypes.length === 1
      ? RODENT_TYPE_OPTIONS.find((o) => o.id === selectedRodentTypes[0])
      : undefined;
  const initialImages = getSubmissionImageRefs(submission);
  const initialPercent = getSightingTimestampPercent(submission.timestamp) ?? 50;
  const isSeriesTitle = submission.imdbKind === "series";

  return (
    <div className="fixed inset-0 z-[220] flex items-end justify-center bg-black/55 sm:items-start sm:px-4 sm:py-12">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border-2 border-stone-950/22 bg-[var(--wr-surface-cream)] p-6 pb-8 shadow-[0_-8px_40px_rgb(0_0_0/0.35)] sm:rounded-2xl sm:p-7 sm:pb-7 sm:shadow-[0_20px_60px_rgb(0_0_0/0.45)] dark:border-white/20 dark:bg-stone-900/95">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-stone-950 dark:text-stone-100">
              {getSubmissionSightingTitle(submission)}
            </h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
              {submission.movieTitle}
              {submission.movieYear ? ` (${submission.movieYear})` : ""}
            </p>
          </div>
          <Link
            href="/moderation"
            className="shrink-0 rounded-lg border border-stone-900/25 px-3 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-100 dark:border-white/18 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            Close
          </Link>
        </div>

        <form action={moderateAction} className="mt-6 grid gap-5">
          <input name="submissionId" type="hidden" value={submission.id} />
          <input name="imdbKind" type="hidden" value={submission.imdbKind ?? "movie"} />
          <input name="seasonNumber" type="hidden" value={submission.seasonNumber ?? ""} />
          <input name="episodeNumber" type="hidden" value={submission.episodeNumber ?? ""} />
          <input name="episodeTitle" type="hidden" value={submission.episodeTitle ?? ""} />

          {/* Sighting title */}
          <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
            Sighting title
            <input
              name="sightingTitle"
              required
              defaultValue={getSubmissionSightingTitle(submission)}
              className="wr-input"
            />
          </label>

          {/* Rodent types */}
          <SightingRodentTypesField
            initialTypes={initialRodentTypes}
            onTypesChange={setSelectedRodentTypes}
          />

          {/* Timestamp */}
          <SightingTimestampField
            defaultValue={initialPercent}
            label={`When in the ${isSeriesTitle ? "episode" : "movie"}?`}
          />

          {/* Rat count */}
          <SightingRatCountField
            defaultValue={submission.approximateRatCount}
            label={rodentCountFieldLabel(selectedRodentTypes)}
            openmojiCode={rodentOption?.openmojiCode ?? "1F400"}
            rodentId={rodentOption?.id}
            noun={rodentSwarmNoun(selectedRodentTypes)}
          />

          {/* Description */}
          <SightingDescriptionField
            required
            defaultValue={submission.description}
          />

          {/* Curator message */}
          <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
            Curator message
            <textarea
              name="curatorNote"
              rows={3}
              defaultValue={submission.curatorNote ?? ""}
              placeholder="Optional note shown with the published sighting."
              className="wr-input h-auto min-h-20 resize-y py-3 leading-relaxed"
            />
          </label>

          {/* Images */}
          <EditableSightingImagesField initialImages={initialImages} />

          {/* Spoiler + content warnings */}
          <div className="overflow-hidden rounded-xl border border-stone-900/12 bg-stone-50 dark:border-white/10 dark:bg-stone-900/50">
            <label className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-100 dark:text-stone-100 dark:hover:bg-white/5">
              <span>Contains plot spoilers</span>
              <span className="relative inline-flex shrink-0 items-center">
                <input
                  name="spoiler"
                  type="checkbox"
                  defaultChecked={submission.spoiler}
                  className="peer sr-only"
                />
                <span className="block h-6 w-11 rounded-full bg-stone-300 transition-colors peer-checked:bg-amber-500 dark:bg-stone-600 dark:peer-checked:bg-amber-500" />
                <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
              </span>
            </label>
            <SightingContentWarningsField
              embedded
              initialWarnings={submission.contentWarnings}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-end">
            <Link
              href="/moderation"
              className="wr-btn bg-white text-stone-900 dark:border-white/18 dark:bg-stone-800 dark:text-stone-100"
            >
              Cancel
            </Link>
            <button
              type="submit"
              name="decision"
              value="edited"
              className="wr-btn-primary"
            >
              Save edits
            </button>
            <button
              type="submit"
              name="decision"
              value="edited and approved"
              className="wr-btn bg-green-700 text-white hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-500"
            >
              Save &amp; Approve
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
