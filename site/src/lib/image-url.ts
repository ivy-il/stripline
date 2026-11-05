/** Resized WebP/AVIF through the Next image optimizer, for same-origin images
 * (including WordPress media proxied under /wp-media). Other URLs pass through, and so does
 * everything in a static export, which has no optimizer. */
export function optimizedImage(src: string, width: number) {
  return !process.env.NEXT_PUBLIC_STATIC_EXPORT && src.startsWith("/") && !src.startsWith("//") && !src.startsWith("/_next/") ? `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75` : src;
}

/** The source URL behind an optimizer URL, used when the optimizer fails. */
export function originalImage(src: string) {
  const match = /^\/_next\/image\?url=([^&]+)/.exec(src);
  return match ? decodeURIComponent(match[1]) : null;
}
