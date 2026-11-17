import type { NextConfig } from 'next';

/**
 * Two build modes:
 *  - default (`npm run build` / `npm run dev`): a normal Next.js app.
 *  - static export for GitHub Pages (`npm run build:pages`): PAGES_BASE_PATH=/setim/cs
 *    → plain HTML/JS/CSS in `out/`, served from https://<user>.github.io/setim/cs/.
 */
const base = process.env.PAGES_BASE_PATH ?? '';
const staticExport = base !== '' || process.env.STATIC_EXPORT === '1';

const nextConfig: NextConfig = {
  ...(staticExport
    ? { output: 'export' as const, basePath: base || undefined, trailingSlash: true, images: { unoptimized: true } }
    : {}),
  env: { NEXT_PUBLIC_BASE_PATH: base },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
