import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // basePath removed for custom domain (dkcoleman.com)
  // Previously: '/dkcoleman' for GitHub Pages subpath
  trailingSlash: true,
};

export default nextConfig;
