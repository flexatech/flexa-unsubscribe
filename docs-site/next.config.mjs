/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export so the docs can be hosted from any static file
  // host (or opened from `out/`) without a Node server.
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
