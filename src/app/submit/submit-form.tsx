"use client";

import { useId, useState, type FormEvent } from "react";
import { normalizeImdbId } from "@/lib/whererat";
import { SightingMarkdown } from "@/components/sighting-markdown";
import { MovieSearchField } from "./movie-search-field";
import { SightingImageUpload } from "./sighting-image-upload";

function SwarmSignal({ count }: { count: number }) {
  const { label, sublabel, fill } = (() => {
    if (count === 1) return { label: "Lone scout", sublabel: "A solitary rat. Brave.", fill: 1 };
    if (count <= 3) return { label: "Small pack", sublabel: "A couple of friends.", fill: 2 };
    if (count <= 7) return { label: "Growing colony", sublabel: "Things are getting ratty.", fill: 3 };
    if (count <= 15) return { label: "Swarm forming", sublabel: "Someone call an exterminator.", fill: 4 };
    if (count <= 40) return { label: "Full swarm", sublabel: "Absolute chaos.", fill: 5 };
    return { label: "Rat apocalypse", sublabel: "We bow to our new overlords.", fill: 6 };
  })();

  const maxFill = 6;
  const displayRats = Math.min(fill, maxFill);

  return (
    <div className="flex flex-1 items-center gap-3 rounded-lg border border-stone-900/8 bg-stone-50/80 px-3 py-2 dark:border-white/8 dark:bg-stone-900/40">
      <div className="flex gap-0.5 text-base leading-none" aria-hidden>
        {Array.from({ length: maxFill }).map((_, i) => (
          <span key={i} className={`transition-all duration-200 ${i < displayRats ? "opacity-100" : "opacity-15 grayscale"}`}>
            🐀
          </span>
        ))}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-stone-700 dark:text-stone-200">{label}</p>
        <p className="text-xs text-stone-500 dark:text-stone-400">{sublabel}</p>
      </div>
    </div>
  );
}

type PreselectedMovie = {
  title: string;
  year: string;
  imdbId: string;
  posterUrl: string;
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
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sightingPercent, setSightingPercent] = useState(50);
  const [ratCount, setRatCount] = useState(1);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewRegionId = useId();

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
          initialMovie={
            initialMovie
              ? { ...initialMovie, runtime: undefined, genre: undefined, rating: undefined, plot: undefined, source: "Seed" }
              : undefined
          }
        />
        <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
          Sighting title
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
        <div className="flex w-full flex-col gap-2" data-field="timestamp">
          <p className="text-sm font-bold text-stone-700 dark:text-stone-200">Approx. point in film</p>
          <div className="pt-1">
            <div>
              <span className="text-2xl font-black tabular-nums text-stone-950 dark:text-stone-50">{sightingPercent}%</span>
              <span className="ml-2 text-sm font-medium text-stone-500 dark:text-stone-400">into the film</span>
            </div>
            <div className="relative mt-4">
              <div className="h-5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-100"
                  style={{ width: `${sightingPercent}%` }}
                />
              </div>
              {/* thumb indicator */}
              <div
                className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-7 w-7 rounded-full border-2 border-amber-600 bg-white shadow-md transition-all duration-100 dark:border-amber-400 dark:bg-stone-100 flex items-center justify-center gap-[3px]"
                style={{ left: `${sightingPercent}%` }}
              >
                <span className="block h-3 w-px rounded-full bg-amber-500 dark:bg-amber-400" />
                <span className="block h-3 w-px rounded-full bg-amber-500 dark:bg-amber-400" />
                <span className="block h-3 w-px rounded-full bg-amber-500 dark:bg-amber-400" />
              </div>
              <input
                name="timestamp"
                required
                type="range"
                min={0}
                max={100}
                step={1}
                value={sightingPercent}
                onChange={(event) =>
                  setSightingPercent(Number.parseInt(event.currentTarget.value, 10) || 0)
                }
                aria-invalid={Boolean(errorFor("timestamp"))}
                aria-label="Approximate point in film"
                className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing opacity-0"
              />
            </div>
            <div className="mt-2 flex justify-between text-sm font-semibold text-stone-500 dark:text-stone-400">
              <span>Opening</span>
              <span>Ending</span>
            </div>
          </div>
          {errorFor("timestamp") ? (
            <span className="text-xs font-semibold text-red-700 dark:text-red-300">
              {errorFor("timestamp")}
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-stone-700 dark:text-stone-200">Approx. rats on screen</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-xl border-2 border-stone-900/12 bg-white dark:border-white/12 dark:bg-stone-900">
              <button
                type="button"
                onClick={() => setRatCount((c) => Math.max(1, c - 1))}
                className="flex h-10 w-10 items-center justify-center text-xl font-bold text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 rounded-l-[10px] dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                aria-label="Decrease rat count"
              >−</button>
              <input
                name="approximateRatCount"
                type="number"
                min={1}
                max={999}
                value={ratCount}
                onChange={(e) => setRatCount(Math.max(1, Number.parseInt(e.currentTarget.value, 10) || 1))}
                className="w-12 border-x-2 border-stone-900/12 bg-transparent py-2 text-center text-base font-bold tabular-nums text-stone-900 outline-none dark:border-white/12 dark:text-stone-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => setRatCount((c) => Math.min(999, c + 1))}
                className="flex h-10 w-10 items-center justify-center text-xl font-bold text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 rounded-r-[10px] dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                aria-label="Increase rat count"
              >+</button>
            </div>
            <SwarmSignal count={ratCount} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
          Description
          <textarea
            data-field="description"
            name="description"
            required
            rows={6}
            value={descriptionDraft}
            onChange={(event) => setDescriptionDraft(event.currentTarget.value)}
            placeholder="Describe exactly where the rat appears and what it is doing."
            aria-invalid={Boolean(errorFor("description"))}
            className={`wr-input ${errorFor("description") ? inputErrorClass : ""}`}
          />
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <p className="max-w-prose text-xs leading-relaxed text-stone-500 dark:text-stone-400">
              You can use{" "}
              <span className="font-semibold text-stone-600 dark:text-stone-300">
                Markdown
              </span>{" "}
              for emphasis, lists, and links. Open preview to check formatting—it updates as you
              type while visible.
            </p>
            <button
              type="button"
              onClick={() => setPreviewOpen((open) => !open)}
              aria-expanded={previewOpen}
              aria-controls={previewRegionId}
              aria-label={
                previewOpen ? "Hide markdown preview" : "Show markdown preview"
              }
              className="wr-btn-ghost shrink-0 self-start text-xs"
            >
              {previewOpen ? "Hide preview" : "Show preview"}
            </button>
          </div>
          {errorFor("description") ? (
            <span className="text-xs font-semibold text-red-700 dark:text-red-300">
              {errorFor("description")}
            </span>
          ) : null}
        </label>
        {previewOpen ? (
          <div
            id={previewRegionId}
            className="rounded-xl border border-stone-900/12 bg-stone-50/90 p-4 shadow-sm sm:p-5 dark:border-white/12 dark:bg-stone-950/45"
            role="region"
            aria-label="Markdown preview"
          >
            {descriptionDraft.trim() ? (
              <SightingMarkdown markdown={descriptionDraft} />
            ) : (
              <p className="text-sm italic text-stone-500 dark:text-stone-500">
                Start typing above—formatted output appears here.
              </p>
            )}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4">
        <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
          Your name
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
