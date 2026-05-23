import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  transpilePackages: ["xlsx-js-style", "jspdf-autotable"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rtpgpoodjfutanpwhaok.supabase.co",
      },
    ],
  },
};

export default nextConfig;
