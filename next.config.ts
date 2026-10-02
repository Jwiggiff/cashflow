import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    ignoreIssue: [
      // lib/version.json is only generated in Docker builds; its absence marks a dev build
      { path: "**/lib/version.ts", title: /version\.json/ },
    ],
  },
};

export default nextConfig;
