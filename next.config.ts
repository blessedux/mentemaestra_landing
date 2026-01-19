import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
        pathname: '/images/**',
      },
    ],
  },
  // Transpile Sanity packages to fix build issues with Turbopack
  transpilePackages: [
    'next-sanity',
    '@sanity/client',
    '@sanity/image-url',
    '@sanity/vision',
  ],
};

export default nextConfig;
