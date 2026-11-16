import type { Family, Product } from "./types";
import primaryFamilies from "@/data/primary-families.json";

/**
 * Products whose main family is set by hand, because the automatic rule (the family listed first on the products
 * page) would pick a family they were only added to. The ceiling diffusers stay in "מפזרי אוויר" and the swirl
 * diffusers in "מפזרי מערבולת", although they also appear in "מחליף אריח תקרתי" / "מפזרי אוויר".
 * Used only when the product is actually assigned to that family in WordPress.
 */
export const PRIMARY_FAMILY: Readonly<Record<string, string>> = primaryFamilies;

/** The product's main family: the hand-set one if it is assigned, else the one listed first (lowest order). */
export function mainFamily(slug: string, families: string[], order: ReadonlyMap<string, number>): string {
  const pinned = PRIMARY_FAMILY[slug];
  if (pinned && families.includes(pinned)) return pinned;
  return [...families].sort((a, b) => (order.get(a) ?? 999) - (order.get(b) ?? 999))[0];
}

/**
 * A family's products in catalog order, except that products whose main family is set by hand to another family
 * come after the family's own products ("מחליף אריח תקרתי" shows its own tile replacers before the added ceiling
 * diffusers). Every other family keeps the plain catalog order.
 */
export function familyMembers<P extends Pick<Product, "slug" | "family" | "families">>(products: P[], slug: string): P[] {
  const members = products.filter((p) => inFamily(p, slug));
  const addedOnly = (p: P) => Boolean(PRIMARY_FAMILY[p.slug]) && p.family !== slug;
  return [...members.filter((p) => !addedOnly(p)), ...members.filter(addedOnly)];
}

/** The product's cut-out from the CMS (trimmed to the product, so every product fills its tile at the same size). */
export function productImage(p: Pick<Product, "slug" | "image">): string {
  return p.image;
}

/** A family's room photo (WordPress > משפחות מוצרים), or the site's default scene. */
export function familyScene(f: Pick<Family, "image"> | undefined, fallback: string): string {
  return f?.image || fallback;
}

/** Is the product listed in this family: its main family or any other family it is assigned to. */
export function inFamily(p: Pick<Product, "family" | "families">, slug: string): boolean {
  return p.family === slug || (p.families ?? []).includes(slug);
}

/** A family's tile on the products page: its own tile image, else its first product. */
export function familyTile(f: Family, products: Product[], fallback: string): string {
  const first = familyMembers(products, f.slug)[0];
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
