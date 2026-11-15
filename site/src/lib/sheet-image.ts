/**
 * Server-side check for the product sheet's top image. A banner is normally an atmosphere photo, shown
 * cropped to fill the dark frame. Some banners are product cut-outs on a transparent background; those
 * would show the product on black and cropped, so the sheet shows them like a product image instead.
 */
const WP = process.env.WP_API_URL?.replace(/\/$/, "");
const REVALIDATE = Number(process.env.WP_REVALIDATE_SECONDS ?? 300);
const SAMPLE = 64;

/** The address to read an image from on the server: WordPress media go back from /wp-media/ to the CMS. */
function sourceUrl(src: string): string | null {
  if (/^https?:\/\//.test(src)) return src;
  if (WP && src.startsWith("/wp-media/")) return `${new URL(WP).origin}/wp-content/uploads/${src.slice("/wp-media/".length)}`;
  return null;
}

/**
 * True when at least half of the image's border is transparent, i.e. a cut-out rather than a photo.
 * Any failure (no CMS, network, decoding) returns false, which keeps the sheet's photo layout.
 * Cached like the CMS data, so replacing an image in WordPress refreshes it with the next revalidation.
 */
export async function isTransparentCutout(src: string | undefined): Promise<boolean> {
  const url = src?.trim() ? sourceUrl(src.trim()) : null;
  if (!url) return false;
  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE, tags: ["products", "stripline"] } });
    if (!res.ok) return false;
    const { default: sharp } = await import("sharp");
    const { data } = await sharp(Buffer.from(await res.arrayBuffer()))
      .ensureAlpha()
      .resize(SAMPLE, SAMPLE, { fit: "fill", kernel: "nearest" })
      .raw()
      .toBuffer({ resolveWithObject: true });
    let transparent = 0;
    let border = 0;
    for (let y = 0; y < SAMPLE; y++) {
      for (let x = 0; x < SAMPLE; x++) {
        if (x !== 0 && y !== 0 && x !== SAMPLE - 1 && y !== SAMPLE - 1) continue;
        border++;
        if (data[(y * SAMPLE + x) * 4 + 3] < 20) transparent++;
      }
    }
    return transparent / border >= 0.5;
  } catch (err) {
    console.error(`[sheet-image] ${url} could not be checked:`, err);
    return false;
  }
}
