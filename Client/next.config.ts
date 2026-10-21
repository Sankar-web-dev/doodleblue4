import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "http", hostname: "localhost" }],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${
          process.env.API_INTERNAL_URL || "http://localhost:5000"
        }/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${
          process.env.API_INTERNAL_URL || "http://localhost:5000"
        }/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
