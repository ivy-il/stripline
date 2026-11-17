/**
 * Resized copies of WordPress images, for srcset. WordPress already writes them on upload (300 / 768 /
 * 1024 wide, and 1536 / 2048 for large images), next to the original, so the browser can pick the
 * smallest copy that is sharp enough for the slot and the screen. This replaces Vercel's image
 * optimizer, whose quota ran out (402).
 *
 * Keys are the site's own image URLs (/wp-media/..., see wp.ts), decoded.
 */
export type MediaSize = { w: number; src: string; bytes?: number };
export type MediaEntry = { w: number; h: number; bytes?: number; sizes: MediaSize[] };
export type MediaSizes = Record<string, MediaEntry>;

const decode = (url: string) => {
  try {
    return decodeURI(url);
  } catch {
    return url;
  }
};

/** WordPress media details → the copies worth offering: same proportions (not the square crop),
 * narrower than the original, and lighter than it when the sizes are known. */
export function mediaEntry(details: {
  width?: number; height?: number; filesize?: number;
  sizes?: Record<string, { width?: number; height?: number; filesize?: number; source_url?: string }>;
}): MediaEntry | null {
  const { width: w, height: h } = details;
  if (!w || !h) return null;
  const ratio = w / h;
  const byWidth = new Map<number, MediaSize>();
  for (const [name, s] of Object.entries(details.sizes ?? {})) {
    if (name === "full" || !s.width || !s.height || !s.source_url || s.width >= w) continue;
    if (Math.abs(s.width / s.height - ratio) / ratio > 0.02) continue;
    if (details.filesize && s.filesize && s.filesize >= details.filesize) continue;
    byWidth.set(s.width, { w: s.width, src: s.source_url, bytes: s.filesize });
  }
  const sizes = [...byWidth.values()].sort((a, b) => a.w - b.w);
  return { w, h, bytes: details.filesize, sizes };
}

export function mediaKey(url: string) {
  return decode(url);
}

/** A srcset of the image's resized copies and the original, or undefined when there are none. */
export function srcSetFor(src: string, media: MediaSizes | undefined): string | undefined {
  const entry = src ? media?.[mediaKey(src)] : undefined;
  if (!entry?.sizes.length) return undefined;
  // srcset is split on commas and spaces: encode both in the URLs.
  const url = (u: string) => encodeURI(decode(u)).replace(/,/g, "%2C");
  return [...entry.sizes.map((s) => `${url(s.src)} ${s.w}w`), `${url(src)} ${entry.w}w`].join(", ");
}

/** How wide the flip book shows its photos (measured: product ~11.5vw / ~21vw on phones, photo ~42.5vw /
 * ~75vw), a little over, for the browser to pick from a srcset. */
export const BOOK_SCENE_SIZES = "(max-width: 767px) 76vw, 43vw";
export const BOOK_PRODUCT_SIZES = "(max-width: 767px) 22vw, 12vw";
