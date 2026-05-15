import { notFound } from "next/navigation";
import type { Submission } from "@/lib/whererat";

/** Call at the top of every email-preview route to 404 in production. */
export function assertPreviewAllowed(): void {
  if (process.env.NODE_ENV === "production") notFound();
}

export const FAKE_SUBMISSION: Submission = {
  id: "sub-preview-0001",
  movieTitle: "Ratatouille",
  movieYear: 2007,
  imdbId: "tt0382932",
  imdbKind: "movie",
  timestamp: "42%",
  title: "Remy on the windowsill",
  description:
    "Remy peeks over the windowsill of Gusteau's kitchen, sniffing the air before vanishing back into the rain. Brief but unmistakable — small chittering audible at 41:58.",
  spoiler: false,
  approximateRatCount: 3,
  rodentTypes: ["mouse"],
  status: "pending",
  submittedBy: "Jordan Sterling",
  submitterEmail: "jordan@example.com",
  submittedAt: new Date(),
  images: [
    { url: "https://picsum.photos/seed/wr-1/240/240", alt: "" },
    { url: "https://picsum.photos/seed/wr-2/240/240", alt: "" },
    { url: "https://picsum.photos/seed/wr-3/240/240", alt: "" },
    { url: "https://picsum.photos/seed/wr-4/240/240", alt: "" },
  ],
};

export const PREVIEW_BASE_URL = "http://localhost:3000";

const PREVIEWS = [
  { slug: "moderation", label: "Moderator", sublabel: "new sighting" },
  { slug: "submitter-receipt", label: "Submitter", sublabel: "receipt" },
  { slug: "submitter-approved", label: "Submitter", sublabel: "approved" },
  { slug: "submitter-declined", label: "Submitter", sublabel: "declined" },
] as const;

export type PreviewSlug = (typeof PREVIEWS)[number]["slug"];

/** Injects a sticky preview-switcher nav bar into the email HTML. */
export function wrapWithPreviewNav(html: string, current: PreviewSlug): string {
  const links = PREVIEWS.map(({ slug, label, sublabel }) => {
    const active = slug === current;
    return `<a href="/email-preview/${slug}" style="
      display:inline-flex;flex-direction:column;align-items:center;
      padding:6px 14px;border-radius:8px;text-decoration:none;
      background:${active ? "#1c1410" : "transparent"};
      color:${active ? "#fff" : "#57534e"};
      transition:background 0.15s;
    ">
      <span style="font-size:12px;font-weight:600;line-height:1.3">${label}</span>
      <span style="font-size:11px;opacity:${active ? "0.7" : "0.8"};line-height:1.3">${sublabel}</span>
    </a>`;
  }).join("");

  const nav = `<div style="
    position:sticky;top:0;z-index:100;
    background:#fff8ed;border-bottom:1px solid #e6dfd1;
    padding:8px 16px;display:flex;align-items:center;gap:4px;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
  ">
    <a href="/email-preview" style="
      margin-right:8px;padding:6px 10px;border-radius:8px;
      font-size:12px;font-weight:600;color:#57534e;text-decoration:none;
      display:inline-flex;align-items:center;gap:4px;
    ">← All</a>
    <div style="width:1px;height:28px;background:#e6dfd1;margin-right:8px"></div>
    ${links}
  </div>`;

  return html.replace("<body", `<body data-preview-nav="true"`).replace(
    /(<body[^>]*>)/,
    `$1\n${nav}`,
  );
}
