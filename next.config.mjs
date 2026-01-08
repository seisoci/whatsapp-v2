import './src/env.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */

const nextConfig = {
  // output: 'standalone', // Required for Docker deployment - disabled due to middleware bug in Next.js 16
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8001',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'api-smart.itn.net.id',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
        pathname: '/api/portraits/**',
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/u/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
        pathname: '/redqteam.com/isomorphic-furyroad/public/**',
      },
      {
        protocol: 'https',
        hostname: 'isomorphic-furyroad.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'isomorphic-furyroad.vercel.app',
      },
    ],
  },
  reactStrictMode: false, // Disabled to prevent double API calls in development
  // Optimization untuk development
  experimental: {
    optimizePackageImports: [
      'react-icons',
      'recharts',
      'rizzui',
      '@react-email/components',
    ],
    // Enable Turbopack filesystem cache for dev (build cache requires canary version)
    turbopackFileSystemCacheForDev: true,
    // turbopackFileSystemCacheForBuild: true,
  },
  // Turbopack configuration for Next.js 16
  turbopack: {
    resolveAlias: {
      '@public': path.resolve(__dirname, 'public'),
      '@': path.resolve(__dirname, 'src'),
      '@core': path.resolve(__dirname, 'src'),
    },
  },
  // Headers untuk Laravel Sanctum CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_API_URL },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-XSRF-TOKEN' },
        ],
      },
    ];
  },
  // Proxy /api requests to backend
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  webpack: (config, { dev, isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@public': path.resolve(__dirname, 'public'),
      '@': path.resolve(__dirname, 'src'),
      '@core': path.resolve(__dirname, 'src'),
    };

    // Speed up development builds
    if (dev && !isServer) {
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

export default nextConfig;
