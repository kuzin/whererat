"use client";

/**
 * Controlled drag-to-reposition + scroll-to-zoom rectangle. Used by both
 * `<ImageUploadBlock>` (single-image) and `<ImageUploadGallery>` (multi-image).
 *
 * Props are fully controlled — the parent owns x/y/zoom. The component handles
 * pointer + wheel + touch input and reports new values via the change callbacks.
 */

import {
    useEffect,
    useRef,
    type CSSProperties,
    type MouseEvent as ReactMouseEvent,
    type TouchEvent as ReactTouchEvent,
} from "react";

export const POSITIONER_MIN_ZOOM = 1.0;
export const POSITIONER_MAX_ZOOM = 4.0;
const ZOOM_STEP_SCROLL = 0.08;
const ZOOM_STEP_BTN = 0.25;

export function clampPosition(v: number) {
    return Math.max(0, Math.min(100, v));
}
export function clampZoom(v: number) {
    return Math.max(POSITIONER_MIN_ZOOM, Math.min(POSITIONER_MAX_ZOOM, v));
}

export type AspectRatio = "video" | "wide" | "square" | "news";

const ASPECT_CLASS: Record<AspectRatio, string> = {
    video: "aspect-video",
    wide: "aspect-[21/9]",
    square: "aspect-square",
    // Matches `<ArticleView>` cover image: taller on mobile, banner-y on desktop.
    news: "aspect-[5/3] sm:aspect-[5/2]",
};

export function imagePositionStyle(x: number, y: number, zoom: number): CSSProperties {
    return {
        objectPosition: `${x}% ${y}%`,
        transform: zoom !== 1 ? `scale(${zoom})` : undefined,
        transformOrigin: `${x}% ${y}%`,
    };
}

type Props = {
    imageUrl: string;
    aspectRatio?: AspectRatio;

    x: number;
    y: number;
    zoom: number;
    onPositionChange: (x: number, y: number) => void;
    onZoomChange: (zoom: number) => void;

    /** Render a Replace button on the left of the toolbar. */
    onReplace?: () => void;
    /** Render a Remove (X) button on the right of the toolbar. */
    onRemove?: () => void;

    /** Hide the toolbar entirely (used inside galleries that supply their own controls). */
    hideToolbar?: boolean;
};

export function ImagePositioner({
    imageUrl,
    aspectRatio = "video",
    x,
    y,
    zoom,
    onPositionChange,
    onZoomChange,
    onReplace,
    onRemove,
    hideToolbar = false,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Native non-passive wheel listener so we can preventDefault page scroll
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const handler = (e: Event) => {
            const we = e as globalThis.WheelEvent;
            we.preventDefault();
            const delta = we.deltaY > 0 ? -ZOOM_STEP_SCROLL : ZOOM_STEP_SCROLL;
            onZoomChange(clampZoom(zoom + delta));
        };
        el.addEventListener("wheel", handler, { passive: false });
        return () => el.removeEventListener("wheel", handler);
    }, [onZoomChange, zoom]);

    const startDrag = (clientX: number, clientY: number) => {
        const container = containerRef.current;
        if (!container) return null;
        return {
            startMouseX: clientX,
            startMouseY: clientY,
            startX: x,
            startY: y,
            width: container.clientWidth,
            height: container.clientHeight,
        };
    };

    const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest("button")) return;
        e.preventDefault();
        const ctx = startDrag(e.clientX, e.clientY);
        if (!ctx) return;
        const onMove = (ev: MouseEvent) => {
            const dx = ev.clientX - ctx.startMouseX;
            const dy = ev.clientY - ctx.startMouseY;
            onPositionChange(
                clampPosition(ctx.startX - (dx * 80) / ctx.width),
                clampPosition(ctx.startY - (dy * 80) / ctx.height),
            );
        };
        const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    };

    const handleTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
        const touch = e.touches[0];
        if (!touch) return;
        if ((e.target as HTMLElement).closest("button")) return;
        const ctx = startDrag(touch.clientX, touch.clientY);
        if (!ctx) return;
        const onMove = (ev: TouchEvent) => {
            const t = ev.touches[0];
            if (!t) return;
            const dx = t.clientX - ctx.startMouseX;
            const dy = t.clientY - ctx.startMouseY;
            onPositionChange(
                clampPosition(ctx.startX - (dx * 80) / ctx.width),
                clampPosition(ctx.startY - (dy * 80) / ctx.height),
            );
        };
        const onEnd = () => {
            window.removeEventListener("touchmove", onMove);
            window.removeEventListener("touchend", onEnd);
            window.removeEventListener("touchcancel", onEnd);
        };
        window.addEventListener("touchmove", onMove, { passive: true });
        window.addEventListener("touchend", onEnd);
        window.addEventListener("touchcancel", onEnd);
    };

    return (
        <div className="overflow-hidden rounded-xl border border-stone-900/15 dark:border-white/12">
            <div
                ref={containerRef}
                className={`group relative ${ASPECT_CLASS[aspectRatio]} w-full cursor-grab overflow-hidden select-none active:cursor-grabbing bg-stone-900/10 dark:bg-black/30`}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                <img
                    src={imageUrl}
                    alt=""
                    draggable={false}
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                    style={imagePositionStyle(x, y, zoom)}
                />
                <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    <div className="flex items-center gap-1.5 rounded-lg bg-stone-900/65 px-3 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur-sm">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20" />
                        </svg>
                        Drag to reposition · scroll to zoom
                    </div>
                </div>
            </div>

            {hideToolbar ? null : (
                <div className="flex items-center gap-1 border-t border-stone-900/10 bg-stone-50 px-2 py-1.5 dark:border-white/8 dark:bg-stone-900/60">
                    {onReplace ? (
                        <button
                            type="button"
                            onClick={onReplace}
                            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-stone-600 transition hover:bg-stone-200/70 dark:text-stone-300 dark:hover:bg-stone-700/70"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Replace
                        </button>
                    ) : null}

                    <div className="ml-auto flex items-center gap-0.5">
                        <button
                            type="button"
                            aria-label="Zoom out"
                            onClick={() => onZoomChange(clampZoom(zoom - ZOOM_STEP_BTN))}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-200/70 dark:text-stone-400 dark:hover:bg-stone-700/70"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                <line x1="8" y1="11" x2="14" y2="11" />
                            </svg>
                        </button>
                        <span className="min-w-[3rem] text-center text-xs font-semibold tabular-nums text-stone-500 dark:text-stone-400">
                            {zoom.toFixed(2)}×
                        </span>
                        <button
                            type="button"
                            aria-label="Zoom in"
                            onClick={() => onZoomChange(clampZoom(zoom + ZOOM_STEP_BTN))}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-200/70 dark:text-stone-400 dark:hover:bg-stone-700/70"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                <line x1="11" y1="8" x2="11" y2="14" />
                                <line x1="8" y1="11" x2="14" y2="11" />
                            </svg>
                        </button>
                    </div>

                    {onRemove ? (
                        <button
                            type="button"
                            aria-label="Remove image"
                            onClick={onRemove}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition hover:bg-red-50 hover:text-red-600 dark:text-stone-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    ) : null}
                </div>
            )}
        </div>
    );
}
