import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/app",
  output: "standalone",
  skipTrailingSlashRedirect: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
