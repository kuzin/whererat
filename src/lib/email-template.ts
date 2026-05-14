/**
 * Branded HTML/text shell for transactional emails. Inline styles + table layout
 * for broad email-client compatibility (Gmail, Apple Mail, Outlook). Logo and
 * rat mark are served as SVGs from `public/brand/email/` via absolute URLs.
 */

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://whererat.com";
}

const C = {
  bg: "#fff8ed",
  card: "#ffffff",
  border: "#e6dfd1",
  borderSoft: "#efe7d6",
  text: "#1c1410",
  muted: "#57534e",
  accent: "#ea580c",
  accentHover: "#c2410c",
  amber: "#a16207",
  panelBg: "#fef9ec",
  panelBorder: "#f1d9a8",
};

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export type EmailButton = {
  label: string;
  href: string;
};

export type EmailImage = {
  url: string;
  alt?: string;
};

export type EmailContentBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string; muted?: boolean }
  | { kind: "keyValue"; rows: Array<{ label: string; value: string }> }
  | { kind: "quote"; text: string }
  | { kind: "gallery"; images: EmailImage[] }
  | { kind: "button"; button: EmailButton }
  | { kind: "divider" };

export type BrandedEmail = {
  /** Pre-header text — shows in the inbox preview line, hidden in the body. */
  preheader?: string;
  /** Short kicker shown above the heading (e.g. "New submission"). */
  eyebrow?: string;
  heading: string;
  blocks: EmailContentBlock[];
  /** Override the base URL used for brand image links (defaults to siteUrl()). */
  baseUrl?: string;
};

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderBlock(block: EmailContentBlock): string {
  switch (block.kind) {
    case "heading":
      return `<h2 style="margin:0 0 12px;font-family:${FONT_STACK};font-size:20px;line-height:1.3;color:${C.text};font-weight:700">${escapeHtml(block.text)}</h2>`;
    case "paragraph":
      return `<p style="margin:0 0 14px;font-family:${FONT_STACK};font-size:15px;line-height:1.55;color:${block.muted ? C.muted : C.text}">${escapeHtml(block.text)}</p>`;
    case "keyValue": {
      const rowsHtml = block.rows
        .map(
          (r) => `
            <tr>
              <td style="padding:6px 14px 6px 0;font-family:${FONT_STACK};font-size:13px;line-height:1.5;color:${C.muted};white-space:nowrap;vertical-align:top">${escapeHtml(r.label)}</td>
              <td style="padding:6px 0;font-family:${FONT_STACK};font-size:14px;line-height:1.5;color:${C.text};vertical-align:top">${escapeHtml(r.value)}</td>
            </tr>`,
        )
        .join("");
      return `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 18px;border-collapse:collapse">
          ${rowsHtml}
        </table>`;
    }
    case "quote":
      return `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 18px;border-collapse:collapse">
          <tr>
            <td style="padding:14px 16px;background:${C.panelBg};border-left:3px solid ${C.accent};border-radius:4px;font-family:${FONT_STACK};font-size:14px;line-height:1.6;color:${C.text};white-space:pre-wrap">${escapeHtml(block.text)}</td>
          </tr>
        </table>`;
    case "gallery": {
      const images = block.images.slice(0, 5);
      if (!images.length) return "";
      const cells = images
        .map(
          (img) => `
            <td valign="top" style="padding:0 6px 0 0;vertical-align:top">
              <img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.alt ?? "")}" width="104" height="104" style="display:block;width:104px;height:104px;object-fit:cover;border-radius:10px;border:1px solid ${C.borderSoft};outline:none">
            </td>`,
        )
        .join("");
      return `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:2px 0 18px;border-collapse:separate">
          <tr>${cells}</tr>
        </table>`;
    }
    case "button":
      return `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 12px;border-collapse:separate;border-spacing:0">
          <tr>
            <td style="background:${C.accent};border:2px solid #0c0a09;border-radius:12px;box-shadow:3px 3px 0 0 rgba(87,83,78,0.5)">
              <a href="${escapeHtml(block.button.href)}" style="display:inline-block;padding:10px 20px;font-family:${FONT_STACK};font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;letter-spacing:-0.005em">${escapeHtml(block.button.label)}</a>
            </td>
          </tr>
        </table>`;
    case "divider":
      return `<div style="height:1px;background:${C.borderSoft};margin:18px 0"></div>`;
  }
}

function blockToText(block: EmailContentBlock): string {
  switch (block.kind) {
    case "heading":
      return `\n${block.text}\n${"-".repeat(Math.min(block.text.length, 40))}`;
    case "paragraph":
      return block.text;
    case "keyValue":
      return block.rows.map((r) => `${r.label}: ${r.value}`).join("\n");
    case "quote":
      return block.text
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
    case "gallery":
      return block.images.length
        ? `(${block.images.length} image${block.images.length === 1 ? "" : "s"} attached — view in the moderation queue)`
        : "";
    case "button":
      return `${block.button.label}: ${block.button.href}`;
    case "divider":
      return "---";
  }
}

export function renderBrandedEmail(email: BrandedEmail): { html: string; text: string } {
  const SITE = email.baseUrl ?? siteUrl();
  const blocksHtml = email.blocks.map(renderBlock).join("\n");
  const wordmarkUrl = `${SITE}/brand/email/wordmark.svg`;
  const ratUrl = `${SITE}/brand/email/rat-amber.svg`;
  const preheader = email.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.bg};opacity:0">${escapeHtml(email.preheader)}</div>`
    : "";
  const eyebrow = email.eyebrow
    ? `<p style="margin:0 0 6px;font-family:${FONT_STACK};font-size:11px;line-height:1.2;color:${C.accent};letter-spacing:0.08em;text-transform:uppercase;font-weight:600">${escapeHtml(email.eyebrow)}</p>`
    : "";

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>${escapeHtml(email.heading)}</title>
  </head>
  <body style="margin:0;padding:0;background:${C.bg};color:${C.text};font-family:${FONT_STACK}">
    ${preheader}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.bg};border-collapse:collapse">
      <tr>
        <td align="center" style="padding:32px 16px">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;border-collapse:separate;border-spacing:0">

            <!-- Header / wordmark -->
            <tr>
              <td align="center" style="padding:4px 0 20px">
                <a href="${SITE}" style="text-decoration:none;display:inline-block">
                  <img src="${wordmarkUrl}" alt="WhereRat" width="160" height="38" style="display:block;width:160px;height:auto;border:0;outline:none">
                </a>
              </td>
            </tr>

            <!-- Card -->
            <tr>
              <td style="background:${C.card};border:1px solid ${C.border};border-radius:18px;padding:28px 28px 24px">
                ${eyebrow}
                <h1 style="margin:0 0 16px;font-family:${FONT_STACK};font-size:22px;line-height:1.3;color:${C.text};font-weight:700">${escapeHtml(email.heading)}</h1>
                ${blocksHtml}
              </td>
            </tr>

            <!-- Footer pill (clickable to whererat.com) -->
            <tr>
              <td align="center" style="padding:24px 0 6px">
                <a href="${SITE}" style="display:block;text-decoration:none;color:inherit">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;border-spacing:0">
                    <tr>
                      <td style="background:${C.card};border:1px solid ${C.border};border-radius:18px;padding:14px 20px">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">
                          <tr>
                            <td width="44" valign="middle" style="vertical-align:middle;width:44px;padding-right:12px;text-align:left">
                              <img src="${ratUrl}" alt="" width="36" height="31" style="display:block;width:36px;height:auto;border:0;outline:none">
                            </td>
                            <td valign="middle" style="vertical-align:middle;font-family:${FONT_STACK};text-align:left">
                              <div style="font-family:${FONT_STACK};font-size:15px;line-height:1.2;color:${C.text};font-weight:700;letter-spacing:-0.01em">whererat.com</div>
                              <div style="margin-top:3px;font-family:${FONT_STACK};font-size:12px;line-height:1.4;color:${C.muted}">A spoiler-aware catalog of rat cameos in film &amp; TV.</div>
                            </td>
                            <td width="20" valign="middle" align="right" style="vertical-align:middle;width:20px;text-align:right;font-family:${FONT_STACK};font-size:22px;line-height:1;color:${C.muted};padding-left:8px">
                              &rsaquo;
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </a>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:4px 16px 0">
                <p style="margin:8px 0 0;font-family:${FONT_STACK};font-size:11px;line-height:1.5;color:${C.muted}">
                  You're receiving this because you're on the WhereRat moderation team.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const textParts = [
    email.eyebrow ? email.eyebrow.toUpperCase() : null,
    email.heading,
    "",
    ...email.blocks.map(blockToText),
    "",
    "—",
    `WhereRat · ${SITE}`,
  ].filter((x): x is string => x !== null);
  const text = textParts.join("\n");

  return { html, text };
}
