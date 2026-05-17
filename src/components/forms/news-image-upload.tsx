"use client";

import { ImageUploadBlock } from "@/components/forms/image-upload-block";

interface Props {
    initialImageUrl?: string;
    initialPositionX?: number;
    initialPositionY?: number;
    initialZoom?: number;
}

/**
 * News cover image picker. Field names match `createNewsItemAction` / `updateNewsItemAction`
 * in `src/app/moderation/news/actions.ts` so this remains a drop-in replacement.
 */
export function NewsImageUpload({
    initialImageUrl,
    initialPositionX,
    initialPositionY,
    initialZoom,
}: Props) {
    return (
        <ImageUploadBlock
            label="Cover image"
            hintSuffix="(optional)"
            aspectRatio="news"
            fileFieldName="newsImage"
            urlFieldName="currentImageUrl"
            positionXFieldName="imagePositionX"
            positionYFieldName="imagePositionY"
            zoomFieldName="imageZoom"
            initialUrl={initialImageUrl}
            initialX={initialPositionX}
            initialY={initialPositionY}
            initialZoom={initialZoom}
        />
    );
}
