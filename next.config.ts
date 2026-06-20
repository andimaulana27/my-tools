import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb", // Atur batas maksimal menjadi 50 Megabytes
    },
  },
};

export default nextConfig;
