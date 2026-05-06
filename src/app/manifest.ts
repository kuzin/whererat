import type { MetadataRoute } from "next";
import { SEEDED_MODERATOR_AVATAR_URL } from "@/lib/auth";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WhereRat",
    short_name: "WhereRat",
    description: "The fun, spoiler-aware catalog of rat cameos in movies.",
    icons: [
      {
        src: SEEDED_MODERATOR_AVATAR_URL,
        sizes: "160x160",
        type: "image/png",
        purpose: "any",
      },
      {
        src: SEEDED_MODERATOR_AVATAR_URL,
        sizes: "160x160",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    theme_color: "#292524",
    background_color: "#fef3c7",
    display: "standalone",
  };
}
