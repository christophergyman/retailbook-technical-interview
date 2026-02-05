import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@trading/api', '@trading/shared', '@trading/logger', '@trading/db'],
};

export default nextConfig;
