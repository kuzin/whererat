"use client";

import {
    useRef,
    useState,
    useEffect,
    type DragEvent,
    type MouseEvent as ReactMouseEvent,
} from "react";

const ACCEPTED_MIME_TYPES = "image/jpeg,image/png,image/webp,image/gif";
const MIN_ZOOM = 1.0;
const MAX_ZOOM = 4.0;
const ZOOM_STEP_SCROLL = 0.08;
const ZOOM_STEP_BTN = 0.25;

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}

interface Props {
    initialImageUrl?: string;
    initialPositionX?: number;
    initialPositionY?: number;
    initialZoom?: number;
}

export function NewsImageUpload({
    initialImageUrl,
    initialPositionX = 50,
    initialPositionY = 50,
    initialZoom = 1,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFileDragging, setIsFileDragging] = useState(false);
    const [displayPreview, setDisplayPreview] = useState<string | null>(initialImageUrl ?? null);
    const [currentUrl, setCurrentUrl] = useState(initialImageUrl ?? "");
    const [x, setX] = useState(initialPositionX);
    const [y, setY] = useState(initialPositionY);
    const [zoom, setZoom] = useState(initialZoom);

    // Ref so event handlers always read current values without stale closures
    const liveState = useRef({ x, y, zoom });
    useEffect(() => {
        liveState.current = { x, y, zoom };
    }, [x, y, zoom]);

    const handleFile = (file: File) => {
        if (!ACCEPTED_MIME_TYPES.split(",").includes(file.type)) return;
        setDisplayPreview(URL.createObjectURL(file));
        setX(50);
        setY(50);
        setZoom(1);
        if (inputRef.current) {
            const dt = new DataTransfer();
            dt.items.add(file);
            inputRef.current.files = dt.files;
        }
    };

    const clearImage = () => {
        if (displayPreview && !displayPreview.startsWith("http")) {
            URL.revokeObjectURL(displayPreview);
        }
        setDisplayPreview(null);
        setCurrentUrl("");
        setX(50);
        setY(50);
        setZoom(1);
        if (inputRef.current) inputRef.current.value = "";
    };

    // Non-passive wheel listener — must be native to call preventDefault
    useEffect(() => {
        const el = containerRef.current;
        if (!el || !displayPreview) return;
        const handler = (e: Event) => {
            const we = e as globalThis.WheelEvent;
            we.preventDefault();
            const delta = we.deltaY > 0 ? -ZOOM_STEP_SCROLL : ZOOM_STEP_SCROLL;
            setZoom((prev) => clamp(prev + delta, MIN_ZOOM, MAX_ZOOM));
        };
        el.addEventListener("wheel", handler, { passive: false });
        return () => el.removeEventListener("wheel", handler);
    }, [displayPreview]);

    const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest("button")) return;
        e.preventDefault();
        const startMouseX = e.clientX;
        const startMouseY = e.clientY;
        const startX = liveState.current.x;
        const startY = liveState.current.y;
        const container = containerRef.current;
        if (!container) return;
        const W = container.clientWidth;
        const H = container.clientHeight;

        const onMove = (ev: MouseEvent) => {
            const dx = ev.clientX - startMouseX;
            const dy = ev.clientY - startMouseY;
            // Dragging ~80% of the container spans the full 0–100 position range
            setX(clamp(startX - (dx * 80) / W, 0, 100));
            setY(clamp(startY - (dy * 80) / H, 0, 100));
        };
        const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    };

    const onDragOver = (e: DragEvent) => { e.preventDefault(); setIsFileDragging(true); };
    const onDragLeave = (e: DragEvent) => { e.preventDefault(); setIsFileDragging(false); };
    const onDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsFileDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-stone-700 dark:text-stone-200">
                Cover image{" "}
                <span className="font-medium text-stone-400 dark:text-stone-500">(optional)</span>
            </span>

            {displayPreview ? (
                <div className="overflow-hidden rounded-xl border border-stone-900/15 dark:border-white/12">
                    {/* Draggable image editor */}
                    <div
                        ref={containerRef}
                        className="group relative h-48 w-full cursor-grab overflow-hidden select-none active:cursor-grabbing"
                        onMouseDown={handleMouseDown}
                    >
                        <img
                            src={displayPreview}
                            alt=""
                            draggable={false}
                            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                            style={{
                                objectPosition: `${x}% ${y}%`,
                                transform: zoom !== 1 ? `scale(${zoom})` : undefined,
                                transformOrigin: `${x}% ${y}%`,
                            }}
                        />
                        {/* Hover hint */}
                        <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                            <div className="flex items-center gap-1.5 rounded-lg bg-stone-900/65 px-3 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur-sm">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                    <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20" />
                                </svg>
                                Drag to reposition · scroll to zoom
                            </div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex items-center gap-1 border-t border-stone-900/10 bg-stone-50 px-2 py-1.5 dark:border-white/8 dark:bg-stone-900/60">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-stone-600 transition hover:bg-stone-200/70 dark:text-stone-300 dark:hover:bg-stone-700/70"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Replace
                        </button>

                        <div className="ml-auto flex items-center gap-0.5">
                            <button
                                type="button"
                                aria-label="Zoom out"
                                onClick={() => setZoom((z) => clamp(z - ZOOM_STEP_BTN, MIN_ZOOM, MAX_ZOOM))}
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
                                onClick={() => setZoom((z) => clamp(z + ZOOM_STEP_BTN, MIN_ZOOM, MAX_ZOOM))}
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

                        <button
                            type="button"
                            aria-label="Remove image"
                            onClick={clearImage}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition hover:bg-red-50 hover:text-red-600 dark:text-stone-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${isFileDragging
                        ? "border-amber-500 bg-amber-100/80 dark:border-amber-400 dark:bg-amber-900/35"
                        : "border-stone-950/18 bg-stone-50/60 hover:border-stone-950/30 hover:bg-stone-50 dark:border-white/14 dark:bg-stone-900/40 dark:hover:border-white/25 dark:hover:bg-stone-900/60"
                        }`}
                >
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-stone-500 dark:text-stone-400" aria-hidden>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </div>
                    <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                        Drop an image here, or{" "}
                        <span className="text-orange-600 underline underline-offset-2 decoration-dashed dark:text-amber-400">
                            browse
                        </span>
                    </p>
                    <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
                        JPEG, PNG, WebP or GIF · up to 8 MB
                    </p>
                </div>
            )}

            <input
                ref={inputRef}
                name="newsImage"
                type="file"
                accept={ACCEPTED_MIME_TYPES}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                className="sr-only"
            />
            <input type="hidden" name="currentImageUrl" value={currentUrl} />
            <input type="hidden" name="imagePositionX" value={x.toFixed(2)} />
            <input type="hidden" name="imagePositionY" value={y.toFixed(2)} />
            <input type="hidden" name="imageZoom" value={zoom.toFixed(3)} />
        </div>
    );
}

