/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Transpile files outside the root (frontend/, backend/) so Vercel can build them
  transpilePackages: [],
  experimental: {
    serverActions: {
      // Allow localhost in dev + any Vercel domain in production
      allowedOrigins: [
        'localhost:3000',
        '*.vercel.app',
      ],
    },
  },
}

module.exports = nextConfig
