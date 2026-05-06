"use client";

import { useRef, useState, type ButtonHTMLAttributes, type MouseEvent } from "react";

type ConfirmSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  confirmMessage: string;
};

export function ConfirmSubmitButton({
  confirmMessage,
  className,
  children,
  onClick,
  ...props
}: ConfirmSubmitButtonProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || isSubmitting) return;
    event.preventDefault();
    event.stopPropagation();
    setOpen(true);
  };

  const handleConfirm = () => {
    const submitter = buttonRef.current;
    const form = submitter?.form;
    if (!submitter || !form) {
      setOpen(false);
      return;
    }
    setOpen(false);
    setIsSubmitting(true);
    form.requestSubmit(submitter);
  };

  return (
    <>
      <button
        {...props}
        ref={buttonRef}
        className={className}
        onClick={handleClick}
      >
        {children}
      </button>
      {open ? (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/55 px-4">
          <div className="w-full max-w-md rounded-2xl border-2 border-stone-950/85 bg-[var(--wr-surface-cream)] p-5 shadow-[0_20px_60px_rgb(0_0_0/0.45)] dark:border-white/16 dark:bg-stone-900">
            <p className="text-sm font-semibold leading-relaxed text-stone-800 dark:text-stone-100">
              {confirmMessage}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="wr-btn bg-white text-stone-900 dark:border-white/18 dark:bg-stone-800 dark:text-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="wr-btn bg-red-100 text-red-900 dark:border-red-400/20 dark:bg-red-950/40 dark:text-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
