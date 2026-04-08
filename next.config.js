const path = require("path");
const webpack = require("webpack");

/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["three-bas", "postprocessing"],
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
    webpack: (config) => {
      config.plugins.push(
        new webpack.ProvidePlugin({
          THREE: path.resolve(__dirname, "three-provide-shim.cjs"),
        })
      );
      config.module.rules.push(
        {
          test: /\.(vert|frag)$/i,
          type: "asset/source",
        },
        {
          test: /\.raw\.xml$/i,
          type: "asset/source",
        }
      );
      return config;
    },
  };
  
  module.exports = nextConfig;
  