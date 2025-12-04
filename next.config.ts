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
  // Increase the body size limit for file uploads
  experimental: {
    // This is deprecated in Next.js 15, but keeping for backwards compatibility
  },
  // Configure serverActions and other settings
  serverExternalPackages: ['pg'],
};

export default nextConfig;
