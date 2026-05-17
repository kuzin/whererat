/**
 * One-off seed script: publish the v0.2.0 product-news post.
 *
 * Usage: yarn tsx scripts/seed-news-v0.2.0.ts
 *
 * Looks up the author by email (defaults to kuzin@zoobean.com) and inserts a
 * single news_items row via the existing `createNewsItem` helper. Safe to
 * re-run: aborts if a published post with the same title already exists.
 */

import "./load-env";
import { closeDbPool, getDbPool } from "@/lib/db";
import { createNewsItem, getAllNewsItems } from "@/lib/news-store";

const AUTHOR_EMAIL = process.env.NEWS_AUTHOR_EMAIL ?? "kuzin@zoobean.com";

const TITLE = "v0.2.0 — Sightings get sharper, the editor gets snappier";

const BODY = `Lots of polish this week, mostly aimed at making the submission flow feel less like a form and more like a little crafting bench. Here's what's new.

---

## 🖼️ Frame each rat moment

Every sighting image now has its own crop. **Drag** to reposition, **scroll** to zoom — what you see in the editor is what shows up on the public carousel. Add up to five images per sighting; the thumbnail strip lets you switch between them and tune each one independently.

Existing images stay perfectly centered until someone moves them. The news cover image you're reading right now uses the same component under the hood.

---

## ✍️ A real markdown editor

The Description field gained a proper **Write / Preview** tab pair sitting above a small toolbar — bold, italics, headings, lists, links, code, blockquotes, all one click away. Numbered lists now render as numbers (not triangle bullets), and \`---\` actually draws a visible divider. The preview pane locks to the textarea's height so toggling between tabs doesn't make the page jump.

---

## 🎨 Movie pages, more movie-y

Every catalog page already had its own accent color sampled from the poster. We've leaned into it: the page background is more clearly tinted in light mode, and the **Submit a Sighting** button now picks a readable ink based on the actual button color — so light palettes get a dark accent-tinted label instead of disappearing white text. Same button color, same text color, light mode and dark.

---

## ✨ Smaller things

- Required-field asterisks added to *Rodent type*, *When in the movie?* and *Rats on screen*.
- Movie search box absorbed its own helper hint into the placeholder.
- Inline rodent and openmoji icons got a small size bump across moderation cards, swarm signal, and the ratviews tab.
- The "Switch to Light / Dark" text button in the masthead is now a compact ☀️ / 🌙 icon.
- More breathing room between fields on the submit form.

---

## 🐛 Bug squashed

In React 19 strict mode, the gallery's "active image" was getting an orphaned id after adding a second photo. The editor would vanish and the alt-text field with it. Now uses deterministic ids and keeps state updates out of state-setter callbacks.

---

*That's it for v0.2.0. Open the submit form and go find some rats* 🐀
`;

const TYPE = "product-news";

async function main() {
    const pool = getDbPool();

    const existing = await getAllNewsItems();
    if (existing.some((n) => n.title === TITLE)) {
        console.log(`A post titled "${TITLE}" already exists — skipping insert.`);
        return;
    }

    const author = await pool.query<{
        id: string;
        display_name: string;
        avatar_url: string;
    }>(
        `select id, display_name, avatar_url from accounts where email = $1 limit 1`,
        [AUTHOR_EMAIL],
    );
    const row = author.rows[0];
    if (!row) {
        throw new Error(
            `No account found for ${AUTHOR_EMAIL}. Set NEWS_AUTHOR_EMAIL or create the account first.`,
        );
    }

    const created = await createNewsItem({
        title: TITLE,
        body: BODY,
        type: TYPE,
        imageUrl: null,
        imageAlt: null,
        imagePositionX: 50,
        imagePositionY: 50,
        imageZoom: 1,
        authorId: row.id,
        authorName: row.display_name,
        authorAvatarUrl: row.avatar_url,
        publish: true,
    });

    console.log(`Published news item ${created.id} ("${created.title}").`);
}

main()
    .catch(async (err) => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await closeDbPool();
    });
