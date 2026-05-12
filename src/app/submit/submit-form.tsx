"use client";

import { useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import { normalizeImdbId, RODENT_TYPE_OPTIONS, rodentCountFieldLabel, rodentSwarmNoun } from "@/lib/whererat";
import {
  SightingTimestampField,
  SightingRatCountField,
  SightingDescriptionField,
  SightingContentWarningsField,
  SightingRodentTypesField,
} from "@/components/sighting-fields";
import { MovieSearchField } from "./movie-search-field";
import { SightingImageUpload } from "./sighting-image-upload";

// ── Small shared pieces ───────────────────────────────────────────────────────

function RequiredMarker() {
  return (
    <span aria-hidden className="ml-1 text-red-600 dark:text-red-400">
      *
    </span>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <h2 className="wr-display text-2xl font-bold text-stone-900 dark:text-amber-50">
        {title}
      </h2>
      <div className="h-px flex-1 bg-amber-500/30 dark:bg-amber-500/20" />
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="wr-btn-primary w-full sm:w-auto">
      {pending ? (
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Submitting…
        </span>
      ) : (
        "Submit for review"
      )}
    </button>
  );
}

const FIELD_FOCUS_ORDER = [
  "movieSelection",
  "sightingTitle",
  "timestamp",
  "description",
  "seasonNumber",
  "episodeNumber",
  "submitterName",
  "submitterEmail",
] as const;

type FieldName = (typeof FIELD_FOCUS_ORDER)[number];

function focusField(name: string) {
  const el =
    document.querySelector<HTMLElement>(`[data-field="${name}"]`) ??
    document.querySelector<HTMLElement>(`[name="${name}"]`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus();
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

type PreselectedMovie = {
  title: string;
  year: string;
  yearRange?: string;
  imdbId: string;
  kind: "movie" | "series";
  posterUrl: string;
  runtime?: string;
  rating?: string;
  imdbRating?: string;
  totalSeasons?: number;
  totalEpisodes?: number;
};

type SubmitFormProps = {
  canAutoApprove: boolean;
  moderatorName?: string;
  loggedInName?: string;
  loggedInEmail?: string;
  submitAction: (formData: FormData) => void | Promise<void>;
  initialMovie?: PreselectedMovie;
};

// ── Main form ─────────────────────────────────────────────────────────────────

export function SubmitForm({
  canAutoApprove,
  moderatorName,
  loggedInName,
  loggedInEmail,
  submitAction,
  initialMovie,
}: SubmitFormProps) {
  const lockedSubmitterFields = Boolean(loggedInName && loggedInEmail);
  const [selectedImdbKind, setSelectedImdbKind] = useState<"movie" | "series" | undefined>(
    initialMovie?.kind,
  );
  const [selectedRodentTypes, setSelectedRodentTypes] = useState<string[]>(["rat"]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const inputErrorClass =
    "border-red-700/70 focus-visible:border-red-700 dark:border-red-400/65 dark:focus-visible:border-red-400";

  const errorFor = (name: string) => fieldErrors[name];

  // Errors in priority order for the summary
  const orderedErrors = FIELD_FOCUS_ORDER.filter((f) => fieldErrors[f]).map((f) => ({
    field: f as FieldName,
    message: fieldErrors[f]!,
  }));

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    const data = new FormData(form);
    const nextFieldErrors: Record<string, string> = {};

    const movieTitle = String(data.get("movieTitle") ?? "").trim();
    const timestamp = String(data.get("timestamp") ?? "").trim();
    const sightingTitle = String(data.get("sightingTitle") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();
    const imdbFromForm = normalizeImdbId(String(data.get("imdbId") ?? ""));
    const submitterName = String(data.get("submitterName") ?? "").trim();
    const submitterEmail = String(data.get("submitterEmail") ?? "").trim();
    const imdbKind = String(data.get("imdbKind") ?? "").trim();
    const seasonNumber = String(data.get("seasonNumber") ?? "").trim();
    const episodeNumber = String(data.get("episodeNumber") ?? "").trim();

    const setErr = (name: string, message: string) => {
      if (!nextFieldErrors[name]) nextFieldErrors[name] = message;
    };

    if (!movieTitle) {
      setErr("movieSelection", "Select a movie from search.");
    } else if (!imdbFromForm) {
      setErr("movieSelection", "Pick a result from the search so we have a real IMDb ID.");
    }
    if (!sightingTitle) setErr("sightingTitle", "Sighting title is required.");
    if (!timestamp) {
      setErr("timestamp", "Approximate point in movie is required.");
    } else {
      const percent = Number.parseInt(timestamp.replace("%", ""), 10);
      if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        setErr("timestamp", "Use a percentage from 0 to 100.");
      }
    }
    if (!description) setErr("description", "Description is required.");
    if (!submitterName) setErr("submitterName", "Your name is required.");
    if (imdbKind === "series") {
      const season = Number.parseInt(seasonNumber, 10);
      const episode = Number.parseInt(episodeNumber, 10);
      if (!Number.isFinite(season) || season < 1)
        setErr("seasonNumber", "Season number is required for shows.");
      if (!Number.isFinite(episode) || episode < 1)
        setErr("episodeNumber", "Episode number is required for shows.");
    }
    if (submitterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterEmail)) {
      setErr("submitterEmail", "Enter a valid email address or leave it blank.");
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      event.preventDefault();
      setFieldErrors(nextFieldErrors);
      const first = FIELD_FOCUS_ORDER.find((f) => nextFieldErrors[f]);
      if (first) requestAnimationFrame(() => focusField(first));
      return;
    }

    setFieldErrors({});
  };

  return (
    <form action={submitAction} noValidate onSubmit={onSubmit} className="grid gap-12">

      {/* Error summary — click each item to jump to the field */}
      {orderedErrors.length > 0 ? (
        <div className="rounded-xl border border-red-800/35 bg-red-50 p-4 text-sm text-red-900 dark:border-red-400/35 dark:bg-red-950/50 dark:text-red-100">
          <p className="font-bold">⚠️ Please fix the following:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {orderedErrors.map(({ field, message }) => (
              <li key={field}>
                <button
                  type="button"
                  onClick={() => focusField(field)}
                  className="text-left underline underline-offset-2 hover:no-underline"
                >
                  {message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* ── 01 · Find the film ─────────────────────────────────────────────── */}
      <div className="grid gap-4">
        <SectionHeader title="Find the film" />
        <MovieSearchField
          fieldErrors={fieldErrors}
          onKindChange={setSelectedImdbKind}
          initialMovie={
            initialMovie
              ? { ...initialMovie, genre: undefined, plot: undefined, source: "Seed" }
              : undefined
          }
        />
      </div>

      {/* ── 02 · The rat moment ────────────────────────────────────────────── */}
      <div className="grid gap-4">
        <SectionHeader title="The sighting" />

        {/* Sighting title */}
        <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
          <span>
            Name this moment
            <RequiredMarker />
          </span>
          <input
            data-field="sightingTitle"
            name="sightingTitle"
            required
            placeholder="e.g., Rat darts across the kitchen counter mid-chase"
            aria-invalid={Boolean(errorFor("sightingTitle"))}
            className={`wr-input ${errorFor("sightingTitle") ? inputErrorClass : ""}`}
          />
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
            Short and vivid — something anyone who&apos;s seen it would instantly picture.
          </p>
          {errorFor("sightingTitle") ? (
            <span className="text-xs font-semibold text-red-700 dark:text-red-300">
              {errorFor("sightingTitle")}
            </span>
          ) : null}
        </label>

        {/* Rodent type */}
        <SightingRodentTypesField onTypesChange={setSelectedRodentTypes} />

        {/* Timestamp */}
        <SightingTimestampField
          label={`When in the ${selectedImdbKind === "series" ? "episode" : "movie"}?`}
          errorMessage={errorFor("timestamp")}
        />

        {/* Rat count */}
        <SightingRatCountField
          label={rodentCountFieldLabel(selectedRodentTypes)}
          emoji={selectedRodentTypes.length === 1 ? (RODENT_TYPE_OPTIONS.find((o) => o.id === selectedRodentTypes[0])?.emoji ?? "🐀") : "🐀"}
          noun={rodentSwarmNoun(selectedRodentTypes)}
        />

        {/* Description */}
        <SightingDescriptionField required errorMessage={errorFor("description")} />

        {/* Images — part of the sighting, not "about you" */}
        <SightingImageUpload />
      </div>

      {/* ── 03 · Credit yourself ───────────────────────────────────────────── */}
      <div className="grid gap-4">
        <SectionHeader title="Credit yourself" />

          <div className="grid gap-4">
            <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
              <span>
                Your name
                <RequiredMarker />
              </span>
              {lockedSubmitterFields ? (
                <input name="submitterName" type="hidden" value={loggedInName} />
              ) : null}
              <input
                data-field="submitterName"
                name={lockedSubmitterFields ? "submitterNameDisplay" : "submitterName"}
                required
                autoComplete="name"
                placeholder="e.g. Jane Smith"
                defaultValue={lockedSubmitterFields ? loggedInName : undefined}
                disabled={lockedSubmitterFields}
                readOnly={lockedSubmitterFields}
                aria-invalid={Boolean(errorFor("submitterName"))}
                className={`wr-input ${lockedSubmitterFields ? "opacity-80" : ""} ${errorFor("submitterName") ? inputErrorClass : ""}`}
              />
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                Your name appears on the published sighting as the finder.
              </p>
              {errorFor("submitterName") ? (
                <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                  {errorFor("submitterName")}
                </span>
              ) : null}
            </label>

            <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
              <span className="flex items-baseline justify-between">
                Email{" "}
                <span className="text-xs font-medium text-stone-400 dark:text-stone-500">
                  (optional)
                </span>
              </span>
              {lockedSubmitterFields ? (
                <input name="submitterEmail" type="hidden" value={loggedInEmail} />
              ) : null}
              <input
                data-field="submitterEmail"
                name={lockedSubmitterFields ? "submitterEmailDisplay" : "submitterEmail"}
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                defaultValue={lockedSubmitterFields ? loggedInEmail : undefined}
                disabled={lockedSubmitterFields}
                readOnly={lockedSubmitterFields}
                aria-invalid={Boolean(errorFor("submitterEmail"))}
                className={`wr-input ${lockedSubmitterFields ? "opacity-80" : ""} ${errorFor("submitterEmail") ? inputErrorClass : ""}`}
              />
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                Only used if a moderator needs to follow up — never shown publicly.
              </p>
              {errorFor("submitterEmail") ? (
                <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                  {errorFor("submitterEmail")}
                </span>
              ) : null}
            </label>
          </div>

          {/* Flags */}
          <div className="overflow-hidden rounded-xl border border-stone-900/12 bg-stone-50 dark:border-white/10 dark:bg-stone-900/50">
            <label className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-100 dark:text-stone-100 dark:hover:bg-white/5">
              <span>Contains plot spoilers</span>
              <span className="relative inline-flex shrink-0 items-center">
                <input name="spoiler" type="checkbox" className="peer sr-only" />
                <span className="block h-6 w-11 rounded-full bg-stone-300 transition-colors peer-checked:bg-amber-500 dark:bg-stone-600 dark:peer-checked:bg-amber-500" />
                <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
              </span>
            </label>

            <SightingContentWarningsField embedded />

            {canAutoApprove ? (
              <label className="flex cursor-pointer items-center justify-between gap-4 border-t border-stone-900/8 px-4 py-3 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-100 dark:border-white/8 dark:text-stone-100 dark:hover:bg-white/5">
                <span>
                  <span className="block">Auto-approve this submission</span>
                  <span className="mt-0.5 block text-xs font-medium text-stone-500 dark:text-stone-400">
                    Signed in as {moderatorName} · skips the pending queue
                  </span>
                </span>
                <span className="relative inline-flex shrink-0 items-center">
                  <input name="autoApprove" type="checkbox" className="peer sr-only" />
                  <span className="block h-6 w-11 rounded-full bg-stone-300 transition-colors peer-checked:bg-amber-500 dark:bg-stone-600 dark:peer-checked:bg-amber-500" />
                  <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                </span>
              </label>
            ) : null}
          </div>

        <div>
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}
