import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 experimental: {
    optimizeCss: true, // Ensures CSS is properly processed
  }
};

export default nextConfig;
