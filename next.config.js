/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['frontend', 'backend', 'shared'],
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.vercel.app'],
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
      '@frontend': path.resolve(__dirname, 'frontend'),
      '@backend': path.resolve(__dirname, 'backend'),
      '@shared': path.resolve(__dirname, 'shared'),
    }
    return config
  },
}

module.exports = nextConfig
