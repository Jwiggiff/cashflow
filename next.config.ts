import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  webpack: (config) => {
    // lib/version.json is only generated in Docker builds; its absence marks a dev build
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      { message: /version\.json/ },
    ];
    return config;
  },
};

export default nextConfig;
