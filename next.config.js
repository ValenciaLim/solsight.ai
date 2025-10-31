/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimize for better performance
  swcMinify: true,
  experimental: {
    // Enable modern bundling
    esmExternals: true,
  },
  // Reduce rebuilds in development
  onDemandEntries: {
    // Keep pages in memory longer
    maxInactiveAge: 60 * 1000,
    // Keep more pages in buffer
    pagesBufferLength: 5,
  },
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Optimize for development
    if (dev) {
      config.watchOptions = {
        // Don't use polling on Windows - let Next.js handle it
        poll: false,
        aggregateTimeout: 200,
        ignored: ['**/node_modules', '**/.next'],
      };
      
      // Faster rebuilds
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;
