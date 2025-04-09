import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   /* config options here */
  reactStrictMode: true,
   swcMinify: true,
   compiler: {
     // Enables the styled-components SWC transform
     styledComponents: true
   },
   output: 'standalone'
 };
};

export default nextConfig;
