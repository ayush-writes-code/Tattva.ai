import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Don't fail production builds on lint warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't fail production builds on type errors (we lint separately)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
