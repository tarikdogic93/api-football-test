import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.api-sports.io",
        port: "",
        pathname: "/football/venues/**",
      },
    ],
  },
};

export default nextConfig;
