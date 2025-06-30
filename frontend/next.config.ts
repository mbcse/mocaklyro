import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during builds
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["avatars.githubusercontent.com", "images.spr.so", "res.cloudinary.com", "ethglobal.b-cdn.net", "assets.poap.xyz", "storage.googleapis.com",
      "gateway.pinata.cloud", "ipfs.io"
    ],
  },
};

export default nextConfig;
