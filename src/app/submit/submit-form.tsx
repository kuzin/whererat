"use client";

import { useState, type FormEvent } from "react";
import { normalizeImdbId, CONTENT_WARNING_OPTIONS } from "@/lib/whererat";
import {
  SwarmSignal,
  SightingTimestampField,
  SightingRatCountField,
  SightingDescriptionField,
} from "@/components/sighting-fields";
import { MovieSearchField } from "./movie-search-field";
import { SightingImageUpload } from "./sighting-image-upload";

function RequiredMarker() {
  return (
    <span aria-hidden className="ml-1 text-red-600 dark:text-red-400">
      *
    </span>
  );
}

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
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const inputErrorClass =
    "border-red-700/70 focus-visible:border-red-700 dark:border-red-400/65 dark:focus-visible:border-red-400";

  const errorFor = (name: string) => fieldErrors[name];

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    const data = new FormData(form);
    const nextErrors: string[] = [];
    const nextFieldErrors: Record<string, string> = {};

    const selectedMovieTitle = String(data.get("movieTitle") ?? "").trim();
    const movieTitle = selectedMovieTitle;
    const timestamp = String(data.get("timestamp") ?? "").trim();
    const sightingTitle = String(data.get("sightingTitle") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();
    const imdbFromForm = normalizeImdbId(String(data.get("imdbId") ?? ""));
    const submitterName = String(data.get("submitterName") ?? "").trim();
    const submitterEmail = String(data.get("submitterEmail") ?? "").trim();
    const imdbKind = String(data.get("imdbKind") ?? "").trim();
    const seasonNumber = String(data.get("seasonNumber") ?? "").trim();
    const episodeNumber = String(data.get("episodeNumber") ?? "").trim();

    const setFieldError = (name: string, message: string) => {
      if (!nextFieldErrors[name]) nextFieldErrors[name] = message;
      nextErrors.push(message);
    };

    if (!movieTitle) {
      setFieldError("movieSelection", "Select a movie from search.");
    } else if (!imdbFromForm) {
      setFieldError(
        "movieSelection",
        "Pick a result from IMDb search so the title links to a real IMDb ID.",
      );
    }
    if (!sightingTitle) {
      setFieldError("sightingTitle", "Sighting title is required.");
    }
    if (!timestamp) {
      setFieldError("timestamp", "Approximate point in movie is required.");
    } else if (!/^\d{1,3}%?$/.test(timestamp)) {
      setFieldError("timestamp", "Use a percentage from 0 to 100.");
    } else {
      const percent = Number.parseInt(timestamp.replace("%", ""), 10);
      if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        setFieldError("timestamp", "Use a percentage from 0 to 100.");
      }
    }
    if (!description) {
      setFieldError("description", "Description is required.");
    }
    if (!submitterName) {
      setFieldError("submitterName", "Your name is required.");
    }
    if (imdbKind === "series") {
      const season = Number.parseInt(seasonNumber, 10);
      const episode = Number.parseInt(episodeNumber, 10);
      if (!Number.isFinite(season) || season < 1) {
        setFieldError("seasonNumber", "Season number is required for shows.");
      }
      if (!Number.isFinite(episode) || episode < 1) {
        setFieldError("episodeNumber", "Episode number is required for shows.");
      }
    }
    if (submitterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterEmail)) {
      setFieldError("submitterEmail", "Enter a valid email address or leave it blank.");
    }

    if (nextErrors.length > 0) {
      event.preventDefault();
      setErrors(nextErrors);
      setFieldErrors(nextFieldErrors);
      const focusPriority = [
        "movieSelection",
        "sightingTitle",
        "timestamp",
        "description",
        "seasonNumber",
        "episodeNumber",
        "submitterName",
        "submitterEmail",
      ];
      const firstInvalidField = focusPriority.find((field) => nextFieldErrors[field]);
      if (firstInvalidField) {
        requestAnimationFrame(() => {
          const target =
            document.querySelector<HTMLElement>(`[data-field='${firstInvalidField}']`) ??
            document.querySelector<HTMLElement>(`[name='${firstInvalidField}']`);
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "center" });
            target.focus();
          }
        });
      }
      return;
    }

    setErrors([]);
    setFieldErrors({});
  };

  return (
    <form
      action={submitAction}
      noValidate
      onSubmit={onSubmit}
      className="grid gap-6"
    >
      {errors.length > 0 ? (
        <div className="rounded-xl border border-red-800/35 bg-red-50 p-4 text-sm font-medium text-red-900 dark:border-red-400/35 dark:bg-red-950/50 dark:text-red-100">
          <p className="font-bold">⚠️ Please fix the following:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-6">
        <MovieSearchField
          fieldErrors={fieldErrors}
          onKindChange={setSelectedImdbKind}
          initialMovie={
            initialMovie
              ? { ...initialMovie, genre: undefined, plot: undefined, source: "Seed" }
              : undefined
          }
        />
        <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
          <span>
            Sighting title
            <RequiredMarker />
          </span>
          <input
            data-field="sightingTitle"
            name="sightingTitle"
            required
            placeholder="e.g., Stray rodent behind academy shelving"
            aria-invalid={Boolean(errorFor("sightingTitle"))}
            className={`wr-input ${errorFor("sightingTitle") ? inputErrorClass : ""}`}
          />
          {errorFor("sightingTitle") ? (
            <span className="text-xs font-semibold text-red-700 dark:text-red-300">
              {errorFor("sightingTitle")}
            </span>
          ) : null}
        </label>
      </div>

      <div className="flex flex-col gap-6">
        <SightingTimestampField
          label={`Approx. point in ${selectedImdbKind === "series" ? "episode" : "movie"}`}
          errorMessage={errorFor("timestamp")}
        />
        <SightingRatCountField />
      </div>

      <SightingDescriptionField required errorMessage={errorFor("description")} />

      <hr className="border-stone-900/10 dark:border-white/10" />

      <div>
        <h2 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest">About you</h2>
      </div>

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
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400">You’ll be credited as the author of this sighting on the public listing.</p>
          {errorFor("submitterName") ? (
            <span className="text-xs font-semibold text-red-700 dark:text-red-300">
              {errorFor("submitterName")}
            </span>
          ) : null}
        </label>
        <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
          <span className="flex items-baseline justify-between">Email <span className="text-xs font-medium text-stone-400 dark:text-stone-500">(optional)</span></span>
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
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400">Only used if a moderator needs to follow up — never shown publicly.</p>
          {errorFor("submitterEmail") ? (
            <span className="text-xs font-semibold text-red-700 dark:text-red-300">
              {errorFor("submitterEmail")}
            </span>
          ) : null}
        </label>
      </div>

      <SightingImageUpload />

      <div className="grid gap-2 rounded-xl border border-stone-900/12 bg-stone-50 p-1 dark:border-white/10 dark:bg-stone-900/50">
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-100 dark:text-stone-100 dark:hover:bg-white/5">
          <span>Contains plot spoilers</span>
          <span className="relative inline-flex shrink-0 items-center">
            <input name="spoiler" type="checkbox" className="peer sr-only" />
            <span className="block h-6 w-11 rounded-full bg-stone-300 transition-colors peer-checked:bg-amber-500 dark:bg-stone-600 dark:peer-checked:bg-amber-500" />
            <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
          </span>
        </label>

        <div className="mx-3 border-t border-stone-900/8 dark:border-white/8" />
        <div className="px-3 py-1.5">
          <p className="mb-2 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Content warnings (optional)</p>
          <div className="grid gap-1.5">
            {CONTENT_WARNING_OPTIONS.map((option) => (
              <label key={option.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-white/5">
                <input
                  type="checkbox"
                  name="contentWarnings"
                  value={option.id}
                  className="h-4 w-4 rounded border-stone-300 accent-amber-500 dark:border-stone-600"
                />
                <span>{option.emoji} {option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {canAutoApprove ? (
          <>
            <div className="mx-3 border-t border-stone-900/8 dark:border-white/8" />
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-100 dark:text-stone-100 dark:hover:bg-white/5">
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
          </>
        ) : null}
      </div>

      <div>
        <button type="submit" className="wr-btn-primary w-full sm:w-auto">
          Submit for review
        </button>
      </div>
    </form>
  );
}
