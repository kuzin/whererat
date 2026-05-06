"use client";

import { useId, useState, type FormEvent } from "react";
import { normalizeImdbId } from "@/lib/whererat";
import { SightingMarkdown } from "@/components/sighting-markdown";
import { MovieSearchField } from "./movie-search-field";
import { SightingImageUpload } from "./sighting-image-upload";

type SubmitFormProps = {
  canAutoApprove: boolean;
  moderatorName?: string;
  loggedInName?: string;
  loggedInEmail?: string;
  submitAction: (formData: FormData) => void | Promise<void>;
};

export function SubmitForm({
  canAutoApprove,
  moderatorName,
  loggedInName,
  loggedInEmail,
  submitAction,
}: SubmitFormProps) {
  const lockedSubmitterFields = Boolean(loggedInName && loggedInEmail);
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sightingPercent, setSightingPercent] = useState(50);
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
      className="grid gap-9"
    >
      {errors.length > 0 ? (
        <div className="rounded-xl border border-red-800/35 bg-red-50 p-4 text-sm font-medium text-red-900 dark:border-red-400/35 dark:bg-red-950/50 dark:text-red-100">
          <p className="font-bold">Please fix the following:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-6">
        <MovieSearchField fieldErrors={fieldErrors} />
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
        <label className="flex w-full flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
          Approx. point in movie
          <div className="flex items-center justify-between text-xs font-semibold text-stone-600 dark:text-stone-300">
            <span>Opening</span>
            <span className="tabular-nums">{sightingPercent}%</span>
            <span>Ending</span>
          </div>
          <input
            data-field="timestamp"
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
            className={`w-full ${errorFor("timestamp") ? "accent-red-700 dark:accent-red-400" : ""}`}
          />
          {errorFor("timestamp") ? (
            <span className="text-xs font-semibold text-red-700 dark:text-red-300">
              {errorFor("timestamp")}
            </span>
          ) : null}
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
            Estimate how far into the movie the sighting begins.
          </p>
        </label>
        <label className="flex w-full max-w-xs flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
          Approx. rats on screen
          <input
            name="approximateRatCount"
            type="number"
            min={1}
            max={9999}
            defaultValue={1}
            className="wr-input tabular-nums"
          />
        </label>
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
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
              className="wr-btn-ghost shrink-0 self-start rounded-lg border border-stone-900/15 px-4 py-2 text-xs font-semibold text-stone-800 dark:border-white/18 dark:text-stone-100"
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

      <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
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
            placeholder="How we’ll credit you on the sighting"
            defaultValue={lockedSubmitterFields ? loggedInName : undefined}
            disabled={lockedSubmitterFields}
            readOnly={lockedSubmitterFields}
            aria-invalid={Boolean(errorFor("submitterName"))}
            className={`wr-input ${
              lockedSubmitterFields ? "opacity-80" : ""
            } ${errorFor("submitterName") ? inputErrorClass : ""}`}
          />
          {errorFor("submitterName") ? (
            <span className="text-xs font-semibold text-red-700 dark:text-red-300">
              {errorFor("submitterName")}
            </span>
          ) : null}
        </label>
        <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
          Email (optional)
          {lockedSubmitterFields ? (
            <input name="submitterEmail" type="hidden" value={loggedInEmail} />
          ) : null}
          <input
            data-field="submitterEmail"
            name={lockedSubmitterFields ? "submitterEmailDisplay" : "submitterEmail"}
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@domain.com · visible to moderators only"
            defaultValue={lockedSubmitterFields ? loggedInEmail : undefined}
            disabled={lockedSubmitterFields}
            readOnly={lockedSubmitterFields}
            aria-invalid={Boolean(errorFor("submitterEmail"))}
            className={`wr-input ${
              lockedSubmitterFields ? "opacity-80" : ""
            } ${errorFor("submitterEmail") ? inputErrorClass : ""}`}
          />
          {errorFor("submitterEmail") ? (
            <span className="text-xs font-semibold text-red-700 dark:text-red-300">
              {errorFor("submitterEmail")}
            </span>
          ) : null}
        </label>
      </div>

      <div className="pt-1">
        <SightingImageUpload />
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-stone-950/85 bg-[#fcd34d]/35 p-4 text-sm font-semibold text-stone-800 dark:border-white/16 dark:bg-stone-900/65 dark:text-stone-100">
        <input
          name="spoiler"
          type="checkbox"
          className="h-5 w-5 rounded border-2 border-stone-950/90"
        />
        Contains plot spoilers.
      </label>

      {canAutoApprove ? (
        <label className="flex items-start gap-3 rounded-xl border border-amber-800/35 bg-[#fef3c7]/95 p-4 text-sm font-semibold text-amber-950">
          <input
            name="autoApprove"
            type="checkbox"
            className="mt-1 h-5 w-5 rounded border-2 border-amber-900/60"
          />
          <span>
            <span className="block">Auto-approve this submission</span>
            <span className="mt-1 block font-medium text-stone-700">
              Signed in as {moderatorName}. This will skip the pending queue and
              record you as the approving curator.
            </span>
          </span>
        </label>
      ) : null}

      <div className="pt-2">
        <button type="submit" className="wr-btn w-full bg-[#fdba74] text-stone-950 sm:w-auto">
          Submit for review
        </button>
      </div>
    </form>
  );
}
