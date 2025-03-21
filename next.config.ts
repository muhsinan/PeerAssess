import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Ensure proper handling of dynamic routes
  async rewrites() {
    return [
      {
        source: '/peer-reviews/:id',
        destination: '/peer-reviews/[id]',
      },
    ];
  },
};

export default nextConfig;
