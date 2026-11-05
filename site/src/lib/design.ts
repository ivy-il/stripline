import type { Family, Product } from "./types";

/** The product's cut-out from the CMS (trimmed to the product, so every product fills its tile at the same size). */
export function productImage(p: Pick<Product, "slug" | "image">): string {
  return p.image;
}

/** A family's room photo (WordPress > משפחות מוצרים), or the site's default scene. */
export function familyScene(f: Pick<Family, "image"> | undefined, fallback: string): string {
  return f?.image || fallback;
}

/** A family's tile on the products page: its own tile image, else its first product. */
export function familyTile(f: Family, products: Product[], fallback: string): string {
  const first = products.find((p) => p.family === f.slug);
  return f.tile || (first ? productImage(first) : fallback);
}

/**
 * WhatsApp button: the CMS phrase plus the agent's name.
 * A Hebrew prefix letter sticks to the next word (כתבו ל + דני → כתבו לדני).
 * Any other ending keeps a space (דברו עם דני).
 */
const HEBREW_PREFIX = /[בכהלמשו]$/;

export function agentButtonLabel(cta: string, name: string): string {
  const prefix = cta.trim();
  const who = name.trim();
  if (!prefix) return who;
  if (!who) return prefix;
  return HEBREW_PREFIX.test(prefix) ? prefix + who : `${prefix} ${who}`;
}

/** Pages that open on a full-bleed photo, so the header sits on it in white. */
export function hasPhotoHero(path: string): boolean {
  return path === "/" || /^\/(about|products|projects)(\/|$)/.test(path) && !path.endsWith("/sheet");
}
