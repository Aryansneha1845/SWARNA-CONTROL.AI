/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // do not fingerprint the framework version
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    // Next.js REQUIRES 'unsafe-inline' for its own runtime scripts (no nonce infra here).
    // Dev additionally needs 'unsafe-eval' for webpack/react-refresh. Everything else stays locked:
    // no third-party script/style/img sources, no object embeds, no framing.
    const scriptSrc = isProd ? `'self' 'unsafe-inline'` : `'self' 'unsafe-inline' 'unsafe-eval'`;
    const h = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy', value: `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` },
    ];
    if (isProd) h.push({ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' });
    return [{ source: '/:path*', headers: h }];
  },
};
module.exports = nextConfig;
