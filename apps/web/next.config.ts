import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Object form, not new URL(...): a URL pins `search` to "" and would
    // reject placehold.co's ?text=... query strings.
    remotePatterns: [{ protocol: "https", hostname: "placehold.co", pathname: "/**" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
