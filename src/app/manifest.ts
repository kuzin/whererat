import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WhereRat",
    short_name: "WhereRat",
    description: "The fun, spoiler-aware catalog of rat cameos in movies.",
    icons: [
      {
        src: "/brand/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/brand/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    theme_color: "#292524",
    background_color: "#fef3c7",
    display: "standalone",
  };
}
