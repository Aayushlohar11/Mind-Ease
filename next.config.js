/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Tell SWC/webpack to transpile files from these directories
  // This fixes "Unexpected token" JSX errors for files in frontend/ and backend/
  transpilePackages: ['frontend', 'backend'],
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        '*.vercel.app',
      ],
    },
  },
  webpack: (config) => {
    // Ensure path aliases resolve correctly for both local and Vercel builds
    config.resolve.alias = {
      ...config.resolve.alias,
      '@frontend': path.resolve(__dirname, 'frontend'),
      '@backend': path.resolve(__dirname, 'backend'),
      '@': path.resolve(__dirname),
    }
    return config
  },
}

module.exports = nextConfig
