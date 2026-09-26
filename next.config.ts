import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 95],
  },
  experimental: {
    optimizePackageImports: ['lucide-react']
  }
};

export default nextConfig;
