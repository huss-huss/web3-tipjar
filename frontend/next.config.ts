import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // wagmi's WalletConnect/MetaMask SDK dependencies reference optional Node-only
  // modules (pino-pretty) that are not needed in the browser bundle.
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "pino-pretty": false,
    };
    return config;
  },
  serverExternalPackages: ["pino", "pino-pretty"],
};

export default nextConfig;
