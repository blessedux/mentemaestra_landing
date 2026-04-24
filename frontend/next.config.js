const path = require("path");
const webpack = require("webpack");

/** r91 namespace for legacy 3dbrain + three-bas + postprocessing (rest of app uses `three` ^0.17x). */
const THREE_R91_ROOT = path.resolve(__dirname, "node_modules/three-r91");

function legacyThreeIssuer(resource) {
  const issuer = resource.contextInfo?.issuer ?? "";
  const ctx = resource.context ?? "";
  const n = `${issuer} ${ctx}`.replace(/\\/g, "/");
  return (
    n.includes("/src/3dbrain/legacy/") ||
    n.includes("/node_modules/three-bas/") ||
    n.includes("/node_modules/postprocessing/")
  );
}

function mapRequestToThreeR91(request) {
  if (request === "three") {
    return path.join(THREE_R91_ROOT, "build/three.module.js");
  }
  if (request.startsWith("three/")) {
    return path.join(THREE_R91_ROOT, request.slice("three/".length));
  }
  return null;
}

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
  webpack: (config, { isServer }) => {
    // Client-only: R3F's react-reconciler must resolve the same `react` as the app.
    // Do not alias on the server — it breaks RSC / prerender (hooks dispatcher becomes null).
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        react: path.resolve(__dirname, "node_modules/react"),
        "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
        "react/jsx-runtime": path.resolve(
          __dirname,
          "node_modules/react/jsx-runtime",
        ),
        "react/jsx-dev-runtime": path.resolve(
          __dirname,
          "node_modules/react/jsx-dev-runtime",
        ),
      };

      config.plugins.push(
        new webpack.ProvidePlugin({
          THREE: path.join(THREE_R91_ROOT, "build/three.module.js"),
        }),
      );
    }

    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^three(\/.*)?$/, (resource) => {
        if (!legacyThreeIssuer(resource)) return;
        const mapped = mapRequestToThreeR91(resource.request);
        if (mapped) {
          resource.request = mapped;
        }
      }),
    );

    config.module.rules.push(
      {
        test: /\.(vert|frag)$/i,
        type: "asset/source",
      },
      {
        test: /\.raw\.xml$/i,
        type: "asset/source",
      },
    );
    return config;
  },
};

module.exports = nextConfig;
