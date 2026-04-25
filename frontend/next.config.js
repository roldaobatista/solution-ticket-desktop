/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript e ESLint são gates bloqueantes (Wave 0)
  // Não adicionar ignoreBuildErrors nem ignoreDuringBuilds
  async rewrites() {
    return [{ source: '/api/:path*', destination: 'http://localhost:3001/api/:path*' }];
  },
};

module.exports = nextConfig;
