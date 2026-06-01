import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.1.116',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '192.168.1.116',
        port: '8000',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    allowedDevOrigins: ['localhost:3000', '127.0.0.1:3000', '192.168.1.116:3000'],
  },
};

export default nextConfig;
