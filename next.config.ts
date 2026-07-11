import type { NextConfig } from 'next';

// Dynamic Next app (server runtime) deployed on Vercel. Public content is read
// from Neon; the /admin CMS + /api/admin routes write to it. (Previously a
// static export on GitHub Pages via `output: 'export'`.)
const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
