
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'fljrbmhfw9ech258.public.blob.vercel-storage.com',
      },
    ],
  },
};

module.exports = nextConfig;
