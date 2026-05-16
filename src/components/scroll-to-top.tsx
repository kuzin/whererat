"use client";

import { useEffect, useRef, useState } from "react";

const SHOW_AFTER_PX = 400;
// Base distance from the bottom of the viewport (matches `bottom-5` / `sm:bottom-6`).
const BASE_OFFSET_PX = 20;
const BASE_OFFSET_PX_SM = 24;

export function ScrollToTop() {
    const [visible, setVisible] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const mq = window.matchMedia("(min-width: 640px)");
        let base = mq.matches ? BASE_OFFSET_PX_SM : BASE_OFFSET_PX;
        const syncBase = () => {
            base = mq.matches ? BASE_OFFSET_PX_SM : BASE_OFFSET_PX;
        };

        const footer = document.querySelector<HTMLElement>("footer");
        let raf = 0;
        let lastVisible = false;

        const apply = () => {
            raf = 0;
            const shouldShow = window.scrollY > SHOW_AFTER_PX;
            if (shouldShow !== lastVisible) {
                lastVisible = shouldShow;
                setVisible(shouldShow);
            }

            let lift = base;
            if (footer) {
                const rect = footer.getBoundingClientRect();
                const overlap = window.innerHeight - rect.top;
                if (overlap > 0) lift = base + overlap;
            }
            if (buttonRef.current) {
                buttonRef.current.style.bottom = `${lift}px`;
            }
        };

        const schedule = () => {
            if (raf) return;
            raf = requestAnimationFrame(apply);
        };

        apply();
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);
        mq.addEventListener("change", syncBase);
        return () => {
            if (raf) cancelAnimationFrame(raf);
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", schedule);
            mq.removeEventListener("change", syncBase);
        };
    }, []);

    const handleClick = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <button
            ref={buttonRef}
            type="button"
            onClick={handleClick}
            aria-label="Scroll to top"
            title="Scroll to top"
            className={`fixed right-5 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border-2 text-stone-900 outline-none transition-[opacity,transform] duration-200 focus-visible:ring-2 focus-visible:ring-stone-950/40 focus-visible:ring-offset-2 active:brightness-[0.97] sm:right-6 dark:text-stone-100 dark:focus-visible:ring-amber-400/55 dark:focus-visible:ring-offset-stone-900 ${
                visible
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-3 opacity-0"
            }`}
            style={{
                bottom: `${BASE_OFFSET_PX}px`,
                backgroundColor: "var(--wr-btn-ghost-bg)",
                borderColor: "var(--wr-btn-ghost-border)",
                boxShadow: "2px 2px 0 0 var(--wr-shadow-btn-soft)",
            }}
        >
            <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
            >
                <polyline points="18 15 12 9 6 15" />
            </svg>
        </button>
    );
}
