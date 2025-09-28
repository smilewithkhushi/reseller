import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      '@lighthouse-web3/sdk',
      'crypto-js',
      'multer',
      'formidable',
      'sharp',
      'pdf-parse'
    ]
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude server-only packages from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        crypto: false,
        stream: false,
        buffer: false,
        "pino-pretty": false,
      };
    }
    return config;
  },
};

export default nextConfig;


