"use client";

/**
 * Multi-image upload gallery with per-image drag-to-reposition + scroll-to-zoom.
 *
 * Adaptive UX:
 *   • Empty   → full drop zone, like `<ImageUploadBlock>`.
 *   • Single  → just the active editor + alt text + "Add another" affordance.
 *   • Multi   → horizontal thumbnail strip on top, active editor below.
 *
 * File-in-form pattern: each slot renders its own file input (with the SAME
 * field name across slots, so the server reads `formData.getAll(...)` to get
 * an ordered array). For existing images the file input stays empty and the
 * persisted URL ships in the matching hidden URL input. Server pairs files +
 * urls by index.
 */

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type DragEvent,
} from "react";
import {
    ImagePositioner,
    imagePositionStyle,
    type AspectRatio,
} from "@/components/forms/image-positioner";

const ACCEPTED_MIME = "image/jpeg,image/png,image/webp,image/gif";

export type InitialGalleryImage = {
    url: string;
    alt?: string;
    x?: number;
    y?: number;
    zoom?: number;
};

type Slot = {
    id: string;
    /** Persisted URL for existing images. Empty when the slot represents a brand-new file. */
    persistedUrl: string;
    /** Set for newly added files. Shipped with the form on submit. */
    file: File | null;
    /** Local blob URL when a file is queued, used as the preview src. */
    blobPreview: string | null;
    alt: string;
    x: number;
    y: number;
    zoom: number;
};

type Props = {
    initialImages?: InitialGalleryImage[];
    maxImages?: number;
    aspectRatio?: AspectRatio;

    /** Field names — server reads these via `getAll(...)` to recover the ordered list. */
    fileFieldName: string;
    urlFieldName: string;
    altFieldName: string;
    positionXFieldName: string;
    positionYFieldName: string;
    zoomFieldName: string;
    /** Optional sentinel field emitted once so the server can detect the list-managed payload. */
    sentinelFieldName?: string;

    label?: string;
    hintSuffix?: string;
};

// IDs come from a per-component counter (see `idCounterRef`) instead of `Math.random()`,
// because `useState` initializers and state-updater callbacks run twice in dev under
// React 19's strict mode. With random IDs that double-invoke produced ghost IDs that
// no longer matched any committed slot, leaving `activeId` orphaned.

function makeSlotFromInitial(img: InitialGalleryImage, id: string): Slot {
    return {
        id,
        persistedUrl: img.url,
        file: null,
        blobPreview: null,
        alt: img.alt ?? "",
        x: img.x ?? 50,
        y: img.y ?? 50,
        zoom: img.zoom ?? 1,
    };
}

function makeSlotFromFile(file: File, id: string): Slot {
    return {
        id,
        persistedUrl: "",
        file,
        blobPreview: URL.createObjectURL(file),
        alt: "",
        x: 50,
        y: 50,
        zoom: 1,
    };
}

export function ImageUploadGallery({
    initialImages = [],
    maxImages = 5,
    aspectRatio = "wide",
    fileFieldName,
    urlFieldName,
    altFieldName,
    positionXFieldName,
    positionYFieldName,
    zoomFieldName,
    sentinelFieldName,
    label,
    hintSuffix,
}: Props) {
    // Stable, monotonic ID generator (see comment above makeSlotFromInitial).
    const idCounterRef = useRef(0);
    const nextSlotId = useCallback(() => `slot-${++idCounterRef.current}`, []);

    const [slots, setSlots] = useState<Slot[]>(() =>
        initialImages
            .slice(0, maxImages)
            .map((img) => makeSlotFromInitial(img, `slot-${++idCounterRef.current}`)),
    );
    const [activeId, setActiveId] = useState<string | null>(() => slots[0]?.id ?? null);
    const [isFileDragging, setIsFileDragging] = useState(false);

    // Per-slot file input refs (so we can stuff File objects in via DataTransfer)
    const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
    // Hidden file input used to add new images
    const addInputRef = useRef<HTMLInputElement>(null);
    // Latest slots seen by handlers; refreshed after each commit so we can
    // create new slots and update active state outside of setState updaters.
    const slotsRef = useRef(slots);

    const canAddMore = slots.length < maxImages;

    const activeSlot = useMemo(
        () => slots.find((s) => s.id === activeId) ?? null,
        [slots, activeId],
    );

    // Sync slot.file → its file input on every render (input lives on, file gets attached).
    // Also refreshes the slots ref so handlers below can read the latest committed value
    // without depending on setState callbacks.
    useEffect(() => {
        slotsRef.current = slots;
        for (const slot of slots) {
            const input = fileInputRefs.current.get(slot.id);
            if (!input) continue;
            const currentFile = input.files?.[0];
            if (slot.file && currentFile !== slot.file) {
                const dt = new DataTransfer();
                dt.items.add(slot.file);
                input.files = dt.files;
            } else if (!slot.file && input.files && input.files.length > 0) {
                input.value = "";
            }
        }
    }, [slots]);

    // Cleanup any blob URLs we created when the component unmounts
    useEffect(() => {
        return () => {
            for (const slot of slots) {
                if (slot.blobPreview) URL.revokeObjectURL(slot.blobPreview);
            }
        };
        // Run cleanup only on unmount — referencing slots without re-running on each change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addFiles = useCallback(
        (incoming: File[]) => {
            const valid = incoming.filter((f) => ACCEPTED_MIME.split(",").includes(f.type));
            if (valid.length === 0) return;
            // Compute everything outside the updater so strict-mode double-invoke can't
            // produce orphaned IDs or duplicate blob URLs.
            const room = maxImages - slotsRef.current.length;
            if (room <= 0) return;
            const newSlots = valid
                .slice(0, room)
                .map((file) => makeSlotFromFile(file, nextSlotId()));
            setSlots((prev) => [...prev, ...newSlots]);
            if (newSlots[0]) setActiveId(newSlots[0].id);
        },
        [maxImages, nextSlotId],
    );

    const removeSlot = useCallback(
        (id: string) => {
            const current = slotsRef.current;
            const idx = current.findIndex((s) => s.id === id);
            if (idx === -1) return;
            const removed = current[idx];
            if (removed.blobPreview) URL.revokeObjectURL(removed.blobPreview);
            fileInputRefs.current.delete(id);
            const next = current.filter((s) => s.id !== id);
            setSlots(next);
            if (id === activeId) {
                const fallback = next[idx] ?? next[idx - 1] ?? null;
                setActiveId(fallback?.id ?? null);
            }
        },
        [activeId],
    );

    const updateActiveSlot = useCallback(
        (patch: Partial<Pick<Slot, "x" | "y" | "zoom" | "alt">>) => {
            setSlots((prev) =>
                prev.map((s) => (s.id === activeId ? { ...s, ...patch } : s)),
            );
        },
        [activeId],
    );

    // ── Drag/drop on the gallery area ─────────────────────────────────────────
    const onDragOver = (e: DragEvent) => { e.preventDefault(); if (canAddMore) setIsFileDragging(true); };
    const onDragLeave = (e: DragEvent) => { e.preventDefault(); setIsFileDragging(false); };
    const onDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsFileDragging(false);
        if (!canAddMore) return;
        addFiles(Array.from(e.dataTransfer.files));
    };

    const triggerAddPicker = () => addInputRef.current?.click();

    // ── Render helpers ───────────────────────────────────────────────────────

    const labelHeader = label ? (
        <span className="flex items-baseline gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
            {label}
            {hintSuffix ? (
                <span className="text-xs font-medium text-stone-400 dark:text-stone-500">{hintSuffix}</span>
            ) : null}
            <span className="ml-auto text-xs font-medium tabular-nums text-stone-400 dark:text-stone-500">
                {slots.length} / {maxImages}
            </span>
        </span>
    ) : null;

    // ── Empty state ──────────────────────────────────────────────────────────
    if (slots.length === 0) {
        return (
            <div className="flex flex-col gap-2">
                {labelHeader}
                <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={triggerAddPicker}
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
                        Drop {maxImages > 1 ? "images" : "an image"} here, or{" "}
                        <span className="text-orange-600 underline underline-offset-2 decoration-dashed dark:text-amber-400">
                            browse
                        </span>
                    </p>
                    <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
                        JPEG, PNG, WebP or GIF · up to 8 MB
                        {maxImages > 1 ? <> · up to {maxImages} images</> : null}
                    </p>
                </div>
                {/* Add picker (multi when maxImages > 1) */}
                <input
                    ref={addInputRef}
                    type="file"
                    accept={ACCEPTED_MIME}
                    multiple={maxImages > 1}
                    onChange={(e) => {
                        addFiles(Array.from(e.target.files ?? []));
                        e.currentTarget.value = "";
                    }}
                    className="sr-only"
                />
                {sentinelFieldName ? (
                    <input type="hidden" name={sentinelFieldName} value="1" />
                ) : null}
            </div>
        );
    }

    // The thumbnail strip is the multi-image affordance. When `maxImages > 1` we show
    // it as soon as there's a slot — the strip's Add tile is the only "add another"
    // entry point in that mode. When `maxImages === 1` (e.g. news cover image) we
    // skip the strip entirely so the single editor stands on its own.
    const showThumbStrip = maxImages > 1;

    return (
        <div
            className="flex flex-col gap-3"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            {labelHeader}

            {showThumbStrip ? (
                <div className="flex flex-wrap gap-2">
                    {slots.map((slot, i) => {
                        const isActive = slot.id === activeId;
                        const src = slot.blobPreview || slot.persistedUrl;
                        return (
                            <button
                                key={slot.id}
                                type="button"
                                onClick={() => setActiveId(slot.id)}
                                aria-label={`Edit image ${i + 1}`}
                                aria-pressed={isActive}
                                className={`group relative h-16 w-24 overflow-hidden rounded-lg border-2 transition ${isActive
                                    ? "border-amber-500 ring-2 ring-amber-500/30"
                                    : "border-stone-900/12 hover:border-stone-900/25 dark:border-white/12 dark:hover:border-white/25"
                                    }`}
                            >
                                <img
                                    src={src}
                                    alt=""
                                    className="pointer-events-none h-full w-full object-cover"
                                    style={imagePositionStyle(slot.x, slot.y, slot.zoom)}
                                />
                                <span className="pointer-events-none absolute left-1 top-1 rounded bg-stone-900/70 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                                    {i + 1}
                                </span>
                            </button>
                        );
                    })}

                    {canAddMore ? (
                        <button
                            type="button"
                            onClick={triggerAddPicker}
                            aria-label="Add another image"
                            className={`flex h-16 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed transition-colors ${isFileDragging
                                ? "border-amber-500 bg-amber-100/80 text-amber-700 dark:border-amber-400 dark:bg-amber-900/35 dark:text-amber-300"
                                : "border-stone-950/18 text-stone-400 hover:border-stone-950/30 hover:text-stone-600 dark:border-white/14 dark:text-stone-500 dark:hover:border-white/25 dark:hover:text-stone-300"
                                }`}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <path d="M5 12h14M12 5v14" />
                            </svg>
                            <span className="text-[10px] font-semibold">Add</span>
                        </button>
                    ) : null}
                </div>
            ) : null}

            {/* Active image editor */}
            {activeSlot ? (
                <ImagePositioner
                    imageUrl={activeSlot.blobPreview || activeSlot.persistedUrl}
                    aspectRatio={aspectRatio}
                    x={activeSlot.x}
                    y={activeSlot.y}
                    zoom={activeSlot.zoom}
                    onPositionChange={(x, y) => updateActiveSlot({ x, y })}
                    onZoomChange={(zoom) => updateActiveSlot({ zoom })}
                    onReplace={() => fileInputRefs.current.get(activeSlot.id)?.click()}
                    onRemove={() => removeSlot(activeSlot.id)}
                />
            ) : null}

            {/* Alt text for the active image */}
            {activeSlot ? (
                <label className="flex flex-col gap-1 pt-1 text-xs font-bold text-stone-700 dark:text-stone-200">
                    <span className="flex items-baseline justify-between gap-2">
                        <span>Alt text</span>
                        <span className="font-medium text-stone-400 dark:text-stone-500">Optional</span>
                    </span>
                    <input
                        type="text"
                        value={activeSlot.alt}
                        onChange={(e) => updateActiveSlot({ alt: e.currentTarget.value })}
                        placeholder="Describe the image for screen readers"
                        className="wr-input h-9 text-sm"
                    />
                </label>
            ) : null}


            {/* ── Hidden form payload — one set per slot, in slot order ───────── */}
            {slots.map((slot) => (
                <div key={`payload-${slot.id}`} className="contents">
                    <input
                        ref={(el) => {
                            if (el) fileInputRefs.current.set(slot.id, el);
                            else fileInputRefs.current.delete(slot.id);
                        }}
                        type="file"
                        name={fileFieldName}
                        accept={ACCEPTED_MIME}
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            // Create the blob URL outside the setState updater — strict
                            // mode would otherwise double-invoke and leak a blob.
                            const blobPreview = URL.createObjectURL(f);
                            const previousBlob = slotsRef.current.find((s) => s.id === slot.id)?.blobPreview;
                            if (previousBlob) URL.revokeObjectURL(previousBlob);
                            setSlots((prev) =>
                                prev.map((s) =>
                                    s.id === slot.id
                                        ? { ...s, file: f, blobPreview, persistedUrl: "", x: 50, y: 50, zoom: 1 }
                                        : s,
                                ),
                            );
                        }}
                        className="sr-only"
                    />
                    <input type="hidden" name={urlFieldName} value={slot.persistedUrl} />
                    <input type="hidden" name={altFieldName} value={slot.alt} />
                    <input type="hidden" name={positionXFieldName} value={slot.x.toFixed(2)} />
                    <input type="hidden" name={positionYFieldName} value={slot.y.toFixed(2)} />
                    <input type="hidden" name={zoomFieldName} value={slot.zoom.toFixed(3)} />
                </div>
            ))}

            {/* Add picker — separate from per-slot file inputs */}
            <input
                ref={addInputRef}
                type="file"
                accept={ACCEPTED_MIME}
                multiple={maxImages > 1}
                onChange={(e) => {
                    addFiles(Array.from(e.target.files ?? []));
                    e.currentTarget.value = "";
                }}
                className="sr-only"
            />

            {sentinelFieldName ? (
                <input type="hidden" name={sentinelFieldName} value="1" />
            ) : null}
        </div>
    );
}
