/** @type {import('next').NextConfig} */
const nextConfig = {
    allowedDevOrigins: ["*.preview.same-app.com"],
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "ext.same-assets.com",
          pathname: "/**",
        },
        {
          protocol: "https",
          hostname: "images.unsplash.com",
          pathname: "/**",
        },
      ],
      unoptimized: true,
    },
  };
  
  module.exports = nextConfig;
  