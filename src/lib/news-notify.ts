/**
 * Newsletter email sent to marketing opt-in subscribers when a news item is
 * published with "Send newsletter" checked in the moderation UI.
 *
 * Best-effort — individual send failures are logged but never throw.
 */

import { sendBrandedEmail } from "@/lib/email-send";
import { renderBrandedEmail, type EmailContentBlock } from "@/lib/email-template";
import { getMarketingSubscribers, getSubscriber } from "@/lib/email-preferences-store";
import type { NewsItem } from "@/lib/news-store";
import { recordNewsletterSend } from "@/lib/newsletter-sends-store";

function siteUrl(): string {
    return process.env.NEXT_PUBLIC_SITE_URL ?? "https://whererat.com";
}

/** From address for newsletter / digest sends. Avoids `no-reply@` which is a
 *  spam-score nudge for bulk mail; falls back to a friendlier news@ identity. */
function newsletterFromAddr(): string {
    return process.env.NEWSLETTER_FROM ?? "WhereRat News <news@whererat.com>";
}

/** Build the standard List-Unsubscribe header pair for a given unsubscribe URL.
 *  Per RFC 8058 + Gmail/Apple/Yahoo bulk-sender guidance, mail clients use these
 *  to expose a native one-click unsubscribe and to weight legitimacy of the
 *  message far more heavily than an in-body unsubscribe link alone. */
function newsletterListHeaders(unsubscribeUrl: string): Record<string, string> {
    return {
        "List-Unsubscribe": `<${unsubscribeUrl}>, <mailto:unsubscribe@whererat.com>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };
}

/** Compute the unsubscribe URL the digest/single-post emails use. */
function unsubscribeUrlFor(token: string, baseUrl = siteUrl()): string {
    return `${baseUrl}/api/unsubscribe?token=${encodeURIComponent(token)}`;
}

export function buildNewsletterEmail(
    item: NewsItem,
    unsubscribeToken: string,
    baseUrl = siteUrl(),
): { subject: string; html: string; text: string } {
    const subject = item.title;
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;

    // Format date
    const pubDate = item.publishedAt || item.createdAt;
    const formattedDate = pubDate instanceof Date
        ? pubDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : "";

    // Type chip (inline style for email)
    const typeColors: Record<string, { bg: string; color: string; border: string }> = {
        announcement: { bg: "#e0edff", color: "#1e40af", border: "#93c5fd" },
        "product-news": { bg: "#ede9fe", color: "#7c3aed", border: "#c4b5fd" },
        community: { bg: "#d1fae5", color: "#047857", border: "#6ee7b7" },
        update: { bg: "#f5f5f4", color: "#44403c", border: "#d6d3d1" },
    };
    const typeStyle = typeColors[item.type] || typeColors.update;
    const typeLabel =
        item.type === "announcement"
            ? "Announcement"
            : item.type === "product-news"
                ? "Product news"
                : item.type === "community"
                    ? "Community"
                    : item.type === "update"
                        ? "Update"
                        : item.type;


    // --- Improved layout: tag chip, date, hero image, markdown body ---
    const blocks: EmailContentBlock[] = [];

    // Tag chip and date (as HTML block)
    blocks.push({
        kind: "paragraph",
        text: `<span style="display:inline-block;padding:2px 10px 2px 8px;font-size:12px;font-weight:700;border-radius:8px;background:${typeStyle.bg};color:${typeStyle.color};border:1px solid ${typeStyle.border};margin-right:8px;vertical-align:middle;">${typeLabel}</span><span style="font-size:13px;color:#888;vertical-align:middle;">${formattedDate}</span>`,
        // We'll allow HTML here and handle it in the renderer below
        // Custom margin handled in email-template renderer
        marginTop: 0,
        marginBottom: 28,
    });

    // Title as heading (removed, handled by email shell)
    // blocks.push({ kind: "heading", text: item.title });

    // Hero image (if present)
    if (item.imageUrl) {
        blocks.push({
            kind: "gallery",
            images: [
                {
                    url: item.imageUrl,
                    alt: item.imageAlt || "News image",
                },
            ],
        });
    }

    // Body: show only the first 4 lines, add ellipsis if truncated
    const bodyLines = item.body.split(/\r?\n/);
    let previewBody = bodyLines.slice(0, 4).join("\n");
    if (bodyLines.length > 4) {
        previewBody += "\n…";
    }
    blocks.push({ kind: "paragraph", text: previewBody });

    // Author (avatar and name, if present)
    // Removed from email content to match news page layout

    // Read on WhereRat button
    blocks.push({
        kind: "button",
        button: { label: "Read on WhereRat", href: `${baseUrl}/news` },
    });

    const { html, text } = renderBrandedEmail({
        preheader: item.body.slice(0, 120),
        // eyebrow: "WhereRat news", // Removed to match news page layout
        heading: item.title,
        footerNote: `You're receiving this because you opted in to WhereRat updates. · Unsubscribe: ${unsubscribeUrl}`,
        blocks,
        baseUrl,
    });

    // Append unsubscribe link to the HTML footer note — inject before closing body
    const unsubscribeLink = `<a href="${unsubscribeUrl}" style="color:inherit;text-decoration:underline">Unsubscribe</a>`;
    const htmlWithUnsub = html.replace(
        `Unsubscribe: ${unsubscribeUrl}`,
        unsubscribeLink,
    );

    return { subject, html: htmlWithUnsub, text };
}

export async function sendNewsletterToSubscribers(item: NewsItem): Promise<void> {
    const subscribers = await getMarketingSubscribers();
    if (!subscribers.length) return;

    await Promise.allSettled(
        subscribers.map(({ email, unsubscribeToken }) => {
            const { subject, html, text } = buildNewsletterEmail(item, unsubscribeToken);
            return sendBrandedEmail({
                to: email,
                subject,
                html,
                text,
                from: newsletterFromAddr(),
                headers: newsletterListHeaders(unsubscribeUrlFor(unsubscribeToken)),
                logTag: "newsletter",
            });
        }),
    );
}

/**
 * Auto-suggested subject for a digest. Caller can override before sending.
 * Single-item digests reuse the post title for continuity with the legacy
 * single-post newsletter.
 */
export function defaultDigestSubject(items: NewsItem[]): string {
    if (items.length === 0) return "WhereRat news";
    if (items.length === 1) return items[0].title;
    return `WhereRat — ${items.length} new posts`;
}

/**
 * Render a digest email containing multiple news items as stacked cards.
 * Each card mirrors the single-item newsletter layout (type chip + date +
 * optional hero image + 4-line preview) and is separated by a divider.
 */
export function buildNewsletterDigestEmail(
    items: NewsItem[],
    unsubscribeToken: string,
    subject: string,
    baseUrl = siteUrl(),
): { subject: string; html: string; text: string } {
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;

    const typeColors: Record<string, { bg: string; color: string; border: string }> = {
        announcement: { bg: "#e0edff", color: "#1e40af", border: "#93c5fd" },
        "product-news": { bg: "#ede9fe", color: "#7c3aed", border: "#c4b5fd" },
        community: { bg: "#d1fae5", color: "#047857", border: "#6ee7b7" },
        update: { bg: "#f5f5f4", color: "#44403c", border: "#d6d3d1" },
    };

    const typeLabelMap: Record<string, string> = {
        announcement: "Announcement",
        "product-news": "Product news",
        community: "Community",
        update: "Update",
    };

    const blocks: EmailContentBlock[] = [];
    items.forEach((item, index) => {
        if (index > 0) blocks.push({ kind: "divider" });

        const pubDate = item.publishedAt || item.createdAt;
        const formattedDate = pubDate instanceof Date
            ? pubDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
            : "";
        const typeStyle = typeColors[item.type] || typeColors.update;
        const typeLabel = typeLabelMap[item.type] ?? item.type;

        blocks.push({
            kind: "paragraph",
            text: `<span style="display:inline-block;padding:2px 10px 2px 8px;font-size:12px;font-weight:700;border-radius:8px;background:${typeStyle.bg};color:${typeStyle.color};border:1px solid ${typeStyle.border};margin-right:8px;vertical-align:middle;">${typeLabel}</span><span style="font-size:13px;color:#888;vertical-align:middle;">${formattedDate}</span>`,
            marginTop: index === 0 ? 0 : 20,
            marginBottom: 12,
        });

        blocks.push({ kind: "heading", text: item.title });

        if (item.imageUrl) {
            blocks.push({
                kind: "gallery",
                images: [{ url: item.imageUrl, alt: item.imageAlt || "News image" }],
            });
        }

        const bodyLines = item.body.split(/\r?\n/);
        let previewBody = bodyLines.slice(0, 4).join("\n");
        if (bodyLines.length > 4) previewBody += "\n…";
        blocks.push({ kind: "paragraph", text: previewBody });
    });

    blocks.push({
        kind: "button",
        button: { label: "Read all on WhereRat", href: `${baseUrl}/news` },
    });

    const heading = items.length === 1 ? items[0].title : "Fresh from WhereRat";
    const preheaderSource = items[0]?.body ?? "";

    const { html, text } = renderBrandedEmail({
        preheader: preheaderSource.slice(0, 120),
        heading,
        footerNote: `You're receiving this because you opted in to WhereRat updates. · Unsubscribe: ${unsubscribeUrl}`,
        blocks,
        baseUrl,
    });

    const unsubscribeLink = `<a href="${unsubscribeUrl}" style="color:inherit;text-decoration:underline">Unsubscribe</a>`;
    const htmlWithUnsub = html.replace(
        `Unsubscribe: ${unsubscribeUrl}`,
        unsubscribeLink,
    );

    return { subject, html: htmlWithUnsub, text };
}

/**
 * Send a digest of the given items to every marketing-opt-in subscriber.
 * Records the send (with intended recipient count) BEFORE fanning out so a
 * partial Resend failure still leaves a complete history record. Best-effort
 * on individual sends.
 */
export async function sendDigestNewsletterToSubscribers(
    items: NewsItem[],
    moderator: { id: string; name: string },
    subject: string,
): Promise<{ recipientCount: number; sendId: string | null }> {
    if (items.length === 0) return { recipientCount: 0, sendId: null };
    const subscribers = await getMarketingSubscribers();
    if (!subscribers.length) return { recipientCount: 0, sendId: null };

    const sendId = await recordNewsletterSend({
        subject,
        sentById: moderator.id,
        sentByName: moderator.name,
        recipientCount: subscribers.length,
        newsItemIds: items.map((item) => item.id),
    });

    await Promise.allSettled(
        subscribers.map(({ email, unsubscribeToken }) => {
            const built = buildNewsletterDigestEmail(items, unsubscribeToken, subject);
            return sendBrandedEmail({
                to: email,
                subject: built.subject,
                html: built.html,
                text: built.text,
                from: newsletterFromAddr(),
                headers: newsletterListHeaders(unsubscribeUrlFor(unsubscribeToken)),
                logTag: "newsletter-digest",
            });
        }),
    );

    return { recipientCount: subscribers.length, sendId };
}

/**
 * Send a test digest to a single email address. Uses the recipient's own
 * unsubscribe token when they are an existing subscriber, otherwise mints a
 * dummy token (test emails should never expose a real-looking unsubscribe
 * link to a non-subscriber).
 */
export async function sendDigestNewsletterTest(
    items: NewsItem[],
    toEmail: string,
    subject: string,
): Promise<{ delivered: boolean }> {
    if (items.length === 0 || !toEmail) return { delivered: false };
    const existing = await getSubscriber(toEmail);
    const token = existing?.unsubscribeToken ?? "test-preview";
    const built = buildNewsletterDigestEmail(items, token, `[TEST] ${subject}`);
    await sendBrandedEmail({
        to: toEmail,
        subject: built.subject,
        html: built.html,
        text: built.text,
        from: newsletterFromAddr(),
        headers: newsletterListHeaders(unsubscribeUrlFor(token)),
        logTag: "newsletter-digest-test",
    });
    return { delivered: true };
}
