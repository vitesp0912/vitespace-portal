import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Turbopack rooted on this app (avoids picking up parent lockfiles)
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
