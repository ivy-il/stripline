/**
 * Where the reader was in the flip book, so a product opened from it leads back to the same page.
 * Before a product opens, the book's address is rewritten in place to ?product=<slug> (the page the book
 * opens on, see CatalogBook) and the address and scroll position are kept for this tab. Back then reopens
 * the book on that page, and the product page's "back to the catalogue" link points there.
 * Browser only.
 */
export type BookPlace = { href: string; slug: string; y: number };

const KEY = "stripline:book-place";

export function rememberBookPlace(slug: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("product", slug);
  url.hash = "";
  const href = url.pathname + url.search;
  // Next.js keeps its router in step with the native call; no navigation and no new history entry.
  window.history.replaceState(null, "", href);
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ href, slug, y: Math.round(window.scrollY) } satisfies BookPlace));
  } catch {
    // Storage blocked: Back still reopens the page from the address, only the scroll position is lost.
  }
}

/** The raw stored value: a stable string for useSyncExternalStore. */
export function storedBookPlace(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function parseBookPlace(raw: string | null): BookPlace | null {
  if (!raw) return null;
  try {
    const place = JSON.parse(raw) as BookPlace;
    return typeof place.href === "string" && typeof place.slug === "string" ? place : null;
  } catch {
    return null;
  }
}

/**
 * On arriving at a page with the book: back at the scroll position the reader left from, or, when the
 * address names a product but there is no stored position (a shared link), with the book in view.
 * The position is set again while the page settles (fonts, images and the router's own scroll can
 * move it), until the reader scrolls themselves.
 */
export function restoreBookPlace(book: HTMLElement | null) {
  const here = window.location.pathname + window.location.search;
  const place = parseBookPlace(storedBookPlace());
  if (place && place.href === here) {
    let stopped = false;
    const stop = () => { stopped = true; };
    const events = ["wheel", "touchstart", "keydown", "mousedown"] as const;
    events.forEach((e) => window.addEventListener(e, stop, { once: true, passive: true }));
    const timers = [0, 120, 350, 800].map((ms) => window.setTimeout(() => { if (!stopped) window.scrollTo({ top: place.y, behavior: "instant" }); }, ms));
    return () => {
      timers.forEach(clearTimeout);
      events.forEach((e) => window.removeEventListener(e, stop));
    };
  }
  if (book && new URLSearchParams(window.location.search).get("product") && book.getBoundingClientRect().top > window.innerHeight * 0.6) {
    book.scrollIntoView({ block: "center", behavior: "instant" });
  }
  return undefined;
}
