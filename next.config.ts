import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    domains: [
      'localhost',
      'search.mirrar.io',
      'static.mirrar.io',
      'storage.googleapis.com',
      'pub-2a9cb6dd10e44d13-a19o-45g6-b7e1-2b7e8bf1c5bc.r2.dev'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
    ],
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  }
};

export default nextConfig;
