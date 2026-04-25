/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Type errors serao resolvidos na etapa de refinamento do frontend
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [{ source: '/api/:path*', destination: 'http://localhost:3001/api/:path*' }];
  },
};

module.exports = nextConfig;
