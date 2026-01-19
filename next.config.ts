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
  // Transpile Sanity packages to fix build issues
  transpilePackages: [
    'next-sanity',
    '@sanity/client',
    '@sanity/image-url',
    '@sanity/vision',
    'sanity',
  ],
};

export default nextConfig;
