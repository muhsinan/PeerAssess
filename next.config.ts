import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // swcMinify is enabled by default in Next.js 15
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
