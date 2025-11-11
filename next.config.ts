import type { NextConfig } from "next/types";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactStrictMode: true,
  experimental: {},
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

