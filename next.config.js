/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/backgrounds/:path*',
        destination: '/backgrounds/:path*',
      },
      {
        source: '/icons/:path*',
        destination: '/icons/:path*',
      }
    ];
  }
};

module.exports = nextConfig;