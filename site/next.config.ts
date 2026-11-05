import type { NextConfig } from "next";

const wpUrl = (() => {
  try {
    return process.env.WP_API_URL ? new URL(process.env.WP_API_URL) : undefined;
  } catch {
    return undefined;
  }
})();

/**
 * STATIC_EXPORT=1 (tools/pack-static.mjs) builds plain HTML into out/ for PHP-only hosting: no API routes
 * (contact goes through public/contact.php), no image optimizer, WordPress media copied into the build.
 * Otherwise: a self-contained Node server (tools/pack-hosting.mjs).
 */
const isStatic = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  // Lets a second build (e.g. against a test CMS) run beside the dev server without sharing .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: isStatic ? "export" : "standalone",
  // Static: /products/eilat/index.html, so Apache serves every page without rewrite rules.
  trailingSlash: isStatic,
  // Route handlers are named route.node.ts so a static build leaves them out.
  pageExtensions: isStatic ? ["tsx", "ts"] : ["tsx", "ts", "node.ts"],
  env: { NEXT_PUBLIC_STATIC_EXPORT: isStatic ? "1" : "" },
  // WordPress media, proxied same-origin (see src/lib/wp.ts).
  ...(!isStatic && {
    async rewrites() {
      return wpUrl ? [{ source: "/wp-media/:path*", destination: `${wpUrl.origin}/wp-content/uploads/:path*` }] : [];
    },
  }),
  images: {
    unoptimized: isStatic,
    remotePatterns: [
      ...(wpUrl ? [{ protocol: wpUrl.protocol.replace(":", "") as "http" | "https", hostname: wpUrl.hostname, port: wpUrl.port }] : []),
      ...(process.env.WP_MEDIA_HOST ? [{ protocol: "https" as const, hostname: process.env.WP_MEDIA_HOST }] : []),
    ],
  },
};

export default nextConfig;
