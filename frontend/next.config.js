const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript e ESLint são gates bloqueantes (Wave 0)
  // Não adicionar ignoreBuildErrors nem ignoreDuringBuilds
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    return [{ source: '/api/:path*', destination: `${backendUrl}/api/:path*` }];
  },
};

// Onda 5: Sentry no frontend — rastreamento de erros e performance
module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || undefined,
  project: process.env.SENTRY_PROJECT || 'solution-ticket-desktop',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  // Remover debug logging do bundle em produção
  webpack: {
    treeshake: { removeDebugLogging: true },
    automaticVercelMonitors: false,
  },
});
