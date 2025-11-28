import type { NextConfig } from "next/types";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactStrictMode: true,
  experimental: {},
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: ["pdfkit"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "orylis.fr",
        pathname: "/wp-content/**",
      },
    ],
  },
};

export default nextConfig;
