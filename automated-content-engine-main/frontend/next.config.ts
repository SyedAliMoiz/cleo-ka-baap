import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false, // Disable React StrictMode to prevent double-mounting in development
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
