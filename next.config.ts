import type { NextConfig } from 'next';

const nextConfig = {
  output: 'standalone',
  outputFileTracingIncludes: {
    '/guide': ['./src/content/user-guide.md'],
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
} satisfies NextConfig;

export default nextConfig;

