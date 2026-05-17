"use client";

/**
 * Universal single-image upload card with drag-to-reposition and scroll-to-zoom.
 *
 * Used standalone (e.g. news cover image). Multi-image scenarios use
 * `<ImageUploadGallery>`, which composes `<ImagePositioner>` directly.
 *
 * File-in-form pattern: the selected file is held in the underlying file input
 * and shipped with the form on submit. The component also emits hidden inputs
 * for `currentUrl` (so server actions can detect "existing image, no
 * replacement"), positionX / positionY (0–100 percentages), zoom (1× minimum),
 * and optionally alt.
 */

import {
    useEffect,
    useRef,
    useState,
    type DragEvent,
} from "react";
import {
    ImagePositioner,
    type AspectRatio,
} from "@/components/forms/image-positioner";

export const IMAGE_UPLOAD_ACCEPTED_MIME = "image/jpeg,image/png,image/webp,image/gif";

type Props = {
    label?: string;
    hintSuffix?: string;
    aspectRatio?: AspectRatio;

    fileFieldName: string;
    urlFieldName: string;
    positionXFieldName: string;
    positionYFieldName: string;
    zoomFieldName: string;
    altFieldName?: string;

    initialUrl?: string;
    initialAlt?: string;
    initialX?: number;
    initialY?: number;
    initialZoom?: number;
};

export function ImageUploadBlock({
    label,
    hintSuffix,
    aspectRatio = "video",
    fileFieldName,
    urlFieldName,
    positionXFieldName,
    positionYFieldName,
    zoomFieldName,
    altFieldName,
    initialUrl,
    initialAlt,
    initialX = 50,
    initialY = 50,
    initialZoom = 1,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isFileDragging, setIsFileDragging] = useState(false);
    const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
    const [currentUrl, setCurrentUrl] = useState(initialUrl ?? "");
    const [alt, setAlt] = useState(initialAlt ?? "");
    const [x, setX] = useState(initialX);
    const [y, setY] = useState(initialY);
    const [zoom, setZoom] = useState(initialZoom);

    // Revoke blob URLs we created on unmount / preview swap
    useEffect(() => {
        return () => {
            if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const handleFile = (next: File) => {
        if (!IMAGE_UPLOAD_ACCEPTED_MIME.split(",").includes(next.type)) return;
        if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
        setPreview(URL.createObjectURL(next));
        setX(50);
        setY(50);
        setZoom(1);
        if (inputRef.current) {
            const dt = new DataTransfer();
            dt.items.add(next);
            inputRef.current.files = dt.files;
        }
    };

    const clearImage = () => {
        if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
        setPreview(null);
        setCurrentUrl("");
        setAlt("");
        setX(50);
        setY(50);
        setZoom(1);
        if (inputRef.current) inputRef.current.value = "";
    };

    const onDragOver = (e: DragEvent) => { e.preventDefault(); setIsFileDragging(true); };
    const onDragLeave = (e: DragEvent) => { e.preventDefault(); setIsFileDragging(false); };
    const onDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsFileDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    };

    return (
        <div className="flex flex-col gap-2">
            {label ? (
                <span className="text-sm font-bold text-stone-700 dark:text-stone-200">
                    {label}
                    {hintSuffix ? (
                        <span className="ml-1 font-medium text-stone-400 dark:text-stone-500">{hintSuffix}</span>
                    ) : null}
                </span>
            ) : null}

            {preview ? (
                <ImagePositioner
                    imageUrl={preview}
                    aspectRatio={aspectRatio}
                    x={x}
                    y={y}
                    zoom={zoom}
                    onPositionChange={(nx, ny) => { setX(nx); setY(ny); }}
                    onZoomChange={setZoom}
                    onReplace={() => inputRef.current?.click()}
                    onRemove={clearImage}
                />
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

            {altFieldName ? (
                <label className="flex flex-col gap-1 pt-1 text-xs font-bold text-stone-700 dark:text-stone-200">
                    <span className="flex items-baseline justify-between gap-2">
                        <span>Alt text</span>
                        <span className="font-medium text-stone-400 dark:text-stone-500">Optional</span>
                    </span>
                    <input
                        name={altFieldName}
                        value={alt}
                        onChange={(e) => setAlt(e.currentTarget.value)}
                        placeholder="Describe the image for screen readers"
                        className="wr-input h-9 text-sm"
                    />
                </label>
            ) : null}

            <input
                ref={inputRef}
                name={fileFieldName}
                type="file"
                accept={IMAGE_UPLOAD_ACCEPTED_MIME}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                className="sr-only"
            />
            <input type="hidden" name={urlFieldName} value={currentUrl} />
            <input type="hidden" name={positionXFieldName} value={x.toFixed(2)} />
            <input type="hidden" name={positionYFieldName} value={y.toFixed(2)} />
            <input type="hidden" name={zoomFieldName} value={zoom.toFixed(3)} />
        </div>
    );
}
