import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL('https://images.pexels.com/**', 'https://lh3.googleusercontent.com/**')],
  },
};

export default nextConfig;
