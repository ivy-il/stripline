import type { MetadataRoute } from "next";

// Static in both builds: read at build time (SITE_NOINDEX), required by the static export.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  if (process.env.SITE_NOINDEX === "1") return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/" } };
}
