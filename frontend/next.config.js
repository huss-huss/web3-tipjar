/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Ignore pino-pretty module to prevent build errors
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'pino-pretty': false,
    }
    return config
  },
  serverExternalPackages: ['pino', 'pino-pretty'],
}

module.exports = nextConfig
