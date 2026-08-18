import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Turbopack rooted on this app (avoids picking up parent lockfiles)
  turbopack: {
    root: process.cwd(),
  },
  allowedDevOrigins: ["192.168.29.188"],
};

export default nextConfig;
