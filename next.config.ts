import type { NextConfig } from "next";

const s3PublicBaseUrl = process.env.S3_PUBLIC_BASE_URL?.trim();
const s3PublicHostname = (() => {
  if (!s3PublicBaseUrl) return null;
  try {
    return new URL(s3PublicBaseUrl).hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.redd.it",
      },
      {
        protocol: "https",
        hostname: "preview.redd.it",
      },
      {
        protocol: "https",
        hostname: "external-preview.redd.it",
      },
      ...(s3PublicHostname
        ? [
            {
              protocol: "https" as const,
              hostname: s3PublicHostname,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
