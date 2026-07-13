import type { NextConfig } from "next";

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Auth keeps its original path so the refresh cookie (Path=/v1/auth)
      // set by the backend matches requests made from the browser.
      {
        source: "/v1/auth/:path*",
        destination: `${API_ORIGIN}/v1/auth/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${API_ORIGIN}/:path*`,
      },
    ];
  },
};

export default nextConfig;
