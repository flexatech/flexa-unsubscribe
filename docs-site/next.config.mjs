/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  // Static export so the docs can be hosted from any static file
  // host — or opened straight from disk — without a Node server.
  output: 'export',
  images: { unoptimized: true },

  // `trailingSlash` stays OFF so every route is a flat sibling file
  // (out/index.html, out/guide.html) at the same depth. Combined with
  // a relative `assetPrefix`, the bundle resolves whether the export
  // is opened via file://, served from a domain root, or nested in a
  // sub-path. (assetPrefix is prod-only; a relative prefix breaks
  // `next dev` HMR.)
  assetPrefix: isProd ? './' : undefined,
};

export default nextConfig;
