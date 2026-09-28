import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    ignoreIssue: [
      // lib/version.json is only generated in Docker builds; its absence marks a dev build
      { path: "**/lib/version.ts", title: /version\.json/ },
    ],
  },
  async redirects() {
    // The dashboard lives at "/"
    return [{ source: "/dashboard", destination: "/", permanent: false }];
  },
};

export default nextConfig;
