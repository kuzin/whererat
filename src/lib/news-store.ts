import { getDbPool } from "@/lib/db";

export type NewsItemType = "announcement" | "product-news" | "community" | "update";

export const NEWS_ITEM_TYPES: { value: NewsItemType; label: string }[] = [
    { value: "announcement", label: "Announcement" },
    { value: "product-news", label: "Product news" },
    { value: "community", label: "Community" },
    { value: "update", label: "Update" },
];

export type NewsItem = {
    id: string;
    title: string;
    body: string;
    type: NewsItemType;
    imageUrl: string | null;
    imageAlt: string | null;
    imagePositionX: number;
    imagePositionY: number;
    imageZoom: number;
    authorId: string;
    authorName: string;
    authorAvatarUrl: string;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

function toNewsItem(row: {
    id: string;
    title: string;
    body: string;
    type: string;
    image_url: string | null;
    image_alt: string | null;
    image_position_x: number;
    image_position_y: number;
    image_zoom: number;
    author_id: string;
    author_name: string;
    author_avatar_url: string;
    published_at: Date | null;
    created_at: Date;
    updated_at: Date;
}): NewsItem {
    return {
        id: row.id,
        title: row.title,
        body: row.body,
        type: row.type as NewsItemType,
        imageUrl: row.image_url,
        imageAlt: row.image_alt,
        imagePositionX: row.image_position_x ?? 50,
        imagePositionY: row.image_position_y ?? 50,
        imageZoom: row.image_zoom ?? 1,
        authorId: row.author_id,
        authorName: row.author_name,
        authorAvatarUrl: row.author_avatar_url,
        publishedAt: row.published_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export async function getPublishedNewsItems(): Promise<NewsItem[]> {
    const pool = getDbPool();
    const result = await pool.query(
        `SELECT * FROM news_items WHERE published_at IS NOT NULL ORDER BY published_at DESC`,
    );
    return result.rows.map(toNewsItem);
}

export async function getAllNewsItems(): Promise<NewsItem[]> {
    const pool = getDbPool();
    const result = await pool.query(
        `SELECT * FROM news_items ORDER BY created_at DESC`,
    );
    return result.rows.map(toNewsItem);
}

export async function getNewsItemById(id: string): Promise<NewsItem | undefined> {
    const pool = getDbPool();
    const result = await pool.query(
        `SELECT * FROM news_items WHERE id = $1`,
        [id],
    );
    return result.rows[0] ? toNewsItem(result.rows[0]) : undefined;
}

export async function createNewsItem(data: {
    title: string;
    body: string;
    type: NewsItemType;
    imageUrl: string | null;
    imageAlt: string | null;
    imagePositionX: number;
    imagePositionY: number;
    imageZoom: number;
    authorId: string;
    authorName: string;
    authorAvatarUrl: string;
    publish: boolean;
}): Promise<NewsItem> {
    const pool = getDbPool();
    const id = `news-${crypto.randomUUID()}`;
    const now = new Date();
    const publishedAt = data.publish ? now : null;
    const result = await pool.query(
        `INSERT INTO news_items
       (id, title, body, type, image_url, image_alt, image_position_x, image_position_y, image_zoom,
        author_id, author_name, author_avatar_url, published_at, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING *`,
        [
            id,
            data.title,
            data.body,
            data.type,
            data.imageUrl,
            data.imageAlt,
            data.imagePositionX,
            data.imagePositionY,
            data.imageZoom,
            data.authorId,
            data.authorName,
            data.authorAvatarUrl,
            publishedAt,
            now,
            now,
        ],
    );
    return toNewsItem(result.rows[0]);
}

export async function updateNewsItem(
    id: string,
    data: {
        title: string;
        body: string;
        type: NewsItemType;
        imageUrl: string | null;
        imageAlt: string | null;
        imagePositionX: number;
        imagePositionY: number;
        imageZoom: number;
    },
): Promise<void> {
    const pool = getDbPool();
    await pool.query(
        `UPDATE news_items
     SET title = $1, body = $2, type = $3, image_url = $4, image_alt = $5,
         image_position_x = $6, image_position_y = $7, image_zoom = $8, updated_at = now()
     WHERE id = $9`,
        [data.title, data.body, data.type, data.imageUrl, data.imageAlt,
        data.imagePositionX, data.imagePositionY, data.imageZoom, id],
    );
}

export async function toggleNewsItemPublished(id: string, publish: boolean): Promise<void> {
    const pool = getDbPool();
    if (publish) {
        await pool.query(
            `UPDATE news_items SET published_at = now(), updated_at = now()
       WHERE id = $1 AND published_at IS NULL`,
            [id],
        );
    } else {
        await pool.query(
            `UPDATE news_items SET published_at = NULL, updated_at = now() WHERE id = $1`,
            [id],
        );
    }
}

export async function deleteNewsItem(id: string): Promise<void> {
    const pool = getDbPool();
    await pool.query(`DELETE FROM news_items WHERE id = $1`, [id]);
}
