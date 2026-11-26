import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the tracking token in /orders/…?t= from leaking through the Referer header (TDD §7.2).
  async headers() {
    return [
      { source: "/:path*", headers: [{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }] },
      { source: "/orders/:path*", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
    ];
  },
  // PGlite (local database) ships WASM that must load from node_modules, not the bundle.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
