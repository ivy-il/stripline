/** Slim product row used by header search and the products page browser. */
export type SearchableProduct = {
  slug: string;
  code: string;
  name: string;
  family: string;
  familyName: string;
  nameEn?: string;
  codes?: string[];
  image?: string;
};

/** Collapse spaces, punctuation and Hebrew quotes so מק״ט / names match forgivingly. */
export function normalizeQuery(s: string): string {
  return (s || "").toLowerCase().replace(/[\s\-–_/.,׳'״"]+/g, "");
}

export function productMatches(product: SearchableProduct, needle: string): boolean {
  if (!needle) return false;
  const fields = [
    product.code,
    product.name,
    product.nameEn,
    ...(product.codes ?? []),
  ];
  return fields.some((field) => field && normalizeQuery(field).includes(needle));
}

/**
 * Empty / whitespace query → `null` (caller shows the idle UI).
 * Otherwise every matching product, order preserved.
 */
export function filterProducts<T extends SearchableProduct>(products: T[], query: string): T[] | null {
  const needle = normalizeQuery(query);
  if (!needle) return null;
  return products.filter((p) => productMatches(p, needle));
}
