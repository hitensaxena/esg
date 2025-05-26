import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Core Next.js features
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  output: 'standalone',
  
  // Image optimization
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
    disableStaticImages: false,
  },
  
  // Performance optimizations
  productionBrowserSourceMaps: false,
  staticPageGenerationTimeout: 1000,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Experimental features - only include properties that exist in the Next.js 15.3.2 type definitions
  experimental: {
    // Enable CSS optimizations
    optimizeCss: true,
    
    // Optimize package imports for better tree-shaking
    optimizePackageImports: [
      '@heroicons/react',
      'lucide-react',
      'date-fns',
      'lodash-es',
      '@mui/material',
      '@mui/icons-material',
      'recharts',
    ],
  },
  
  // Webpack configuration (only used in non-Turbopack mode)
  webpack: (config, { isServer, dev }) => {
    // Only apply in production builds
    if (!dev) {
      // Optimize moment.js by excluding locales
      config.plugins.push(
        new (require('webpack').ContextReplacementPlugin)(
          /moment[/\\]locale$/,
          /en|es|fr/ // Include only the locales you need
        )
      );
      
      // Disable source maps in production
      config.devtool = false;
    }
    
    return config;
  },
};

// Export the configuration
export default nextConfig;
