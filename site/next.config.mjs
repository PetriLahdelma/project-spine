/** @type {import('next').NextConfig} */

// The Content-Security-Policy header is set per-request in middleware.ts so
// it can include a fresh nonce. Static headers here cover everything that
// doesn't need per-request variance.
const nextConfig = {
  reactStrictMode: true,
  // Hide the dev-only N badge / issues overlay in the bottom-left. It only
  // renders in `next dev`, never in production, so this is a dev-UX choice.
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
