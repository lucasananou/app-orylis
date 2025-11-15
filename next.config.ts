import type { NextConfig } from "next/types";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactStrictMode: true,
  experimental: {},
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "orylis.fr",
        pathname: "/wp-content/**",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Inclure les fichiers de police pdfkit dans le bundle
      config.resolve.alias = {
        ...config.resolve.alias,
      };
    }
    return config;
  },
};

export default nextConfig;

