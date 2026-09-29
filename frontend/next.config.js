/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // do not fingerprint the framework version
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    const h = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      // No inline scripts/styles of our own; R3F/Flow need wasm/blob + data: for canvas/fonts.
      { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
    ];
    if (isProd) h.push({ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' });
    return [{ source: '/:path*', headers: h }];
  },
};
module.exports = nextConfig;
