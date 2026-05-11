"use client";

import Link from "next/link";
import {
  SightingTimestampField,
  SightingRatCountField,
  SightingDescriptionField,
} from "@/components/sighting-fields";
import { EditableSightingImagesField } from "@/components/editable-sighting-images-field";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import {
  getSightingTimestampPercent,
  getSightingImageRefs,
  type Sighting,
} from "@/lib/whererat";

type EditSightingFormProps = {
  sighting: Sighting;
  slug: string;
  returnTo: string;
  isSeriesTitle: boolean;
  updateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
};

export function EditSightingForm({
  sighting,
  slug,
  returnTo,
  isSeriesTitle,
  updateAction,
  deleteAction,
}: EditSightingFormProps) {
  const initialImages = getSightingImageRefs(sighting);
  const initialPercent = getSightingTimestampPercent(sighting.timestamp) ?? 50;

  return (
    <form action={updateAction} className="mt-6 grid gap-5">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="sightingId" value={sighting.id} />
      <input type="hidden" name="returnTo" value={returnTo} />

      {/* Title */}
      <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
        Sighting title
        <input
          name="title"
          required
          defaultValue={sighting.title}
          className="wr-input"
        />
      </label>

      {/* Timestamp slider */}
      <SightingTimestampField
        defaultValue={initialPercent}
        label={`Approx. point in ${isSeriesTitle ? "episode" : "movie"}`}
      />

      {/* Rat count stepper */}
      <SightingRatCountField defaultValue={sighting.approximateRatCount} />

      {/* Description + preview */}
      <SightingDescriptionField
        defaultValue={sighting.description}
        required
        minRows={5}
      />

      {/* Curator note */}
      <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
        Curator note
        <textarea
          name="curatorNote"
          rows={3}
          defaultValue={sighting.curatorNote ?? ""}
          placeholder="Optional note shown alongside the published sighting."
          className="wr-input h-auto resize-y py-3 leading-relaxed"
          style={{ minHeight: "5rem" }}
        />
      </label>

      {/* Images */}
      <EditableSightingImagesField initialImages={initialImages} />

      {/* Spoiler toggle */}
      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-stone-900/12 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-100 dark:border-white/10 dark:bg-stone-900/50 dark:text-stone-100 dark:hover:bg-white/5">
        <div>
          <p>Contains spoilers</p>
          <p className="mt-0.5 text-xs font-normal text-stone-500 dark:text-stone-400">
            Hides the title, description, and images until the viewer opts in.
          </p>
        </div>
        <span className="relative inline-flex shrink-0 items-center">
          <input
            name="spoiler"
            type="checkbox"
            defaultChecked={sighting.spoiler}
            className="peer sr-only"
          />
          <span className="block h-6 w-11 rounded-full bg-stone-300 transition-colors peer-checked:bg-amber-500 dark:bg-stone-600 dark:peer-checked:bg-amber-500" />
          <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
        </span>
      </label>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-end">
        <ConfirmSubmitButton
          confirmMessage="Delete this sighting? This cannot be undone."
          type="submit"
          formAction={deleteAction}
          className="wr-btn bg-red-100 text-red-900 dark:border-red-400/20 dark:bg-red-950/40 dark:text-red-100"
        >
          Delete sighting
        </ConfirmSubmitButton>
        <Link
          href={returnTo}
          className="wr-btn bg-white text-stone-900 dark:border-white/18 dark:bg-stone-800 dark:text-stone-100"
        >
          Cancel
        </Link>
        <button type="submit" className="wr-btn-primary">
          Save sighting
        </button>
      </div>
    </form>
  );
}
