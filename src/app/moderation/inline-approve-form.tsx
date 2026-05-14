"use client";

export function InlineApproveForm({
  submissionId,
  editHref,
  moderateAction,
}: {
  submissionId: string;
  editHref: string;
  moderateAction: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={moderateAction} className="grid gap-3">
      <input name="submissionId" type="hidden" value={submissionId} />

      <label className="flex flex-col gap-1.5">
        <span className="flex items-baseline gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
          Curator note
          <span className="text-xs font-medium text-stone-400 dark:text-stone-500">Optional</span>
        </span>
        <textarea
          name="curatorNote"
          rows={2}
          placeholder="Shown with the published sighting."
          className="wr-input h-auto resize-y py-2.5 leading-relaxed text-sm"
        />
      </label>

      <div className="flex gap-2">
        <a href={editHref} className="wr-btn-ghost flex-1 text-center">
          Edit
        </a>
        <button
          type="submit"
          name="decision"
          value="approved"
          className="wr-btn flex-1 bg-green-700 text-white hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-500"
        >
          Approve
        </button>
        <button
          type="submit"
          name="decision"
          value="rejected"
          className="wr-btn flex-1 bg-red-700 text-white hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-500"
        >
          Deny
        </button>
      </div>
    </form>
  );
}
