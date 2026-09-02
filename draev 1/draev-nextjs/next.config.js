/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Applies to every route — these are all response headers with no
        // effect on rendering or client-side behavior, so they can't break
        // anything in the storefront or admin UI.
        source: "/:path*",
        headers: [
          // Stops the browser from guessing a different content type than
          // what the server declared (relevant mainly for the uploaded
          // product images served from /api/images/*).
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Nothing on this site is meant to be embedded in an iframe on
          // another site — blocks clickjacking attempts.
          { key: "X-Frame-Options", value: "DENY" },
          // Sends the full referrer to same-origin requests (useful for
          // your own analytics) but only the origin, not the full path/
          // query, to third-party destinations.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // This storefront never needs camera/mic/location access —
          // explicitly deny it so an injected third-party script couldn't
          // request it either.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
