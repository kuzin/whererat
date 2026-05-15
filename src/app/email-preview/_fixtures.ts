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
