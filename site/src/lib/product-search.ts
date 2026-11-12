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

/** Higher = better. Exact מק״ט beats a looser name hit. */
function matchScore(product: SearchableProduct, needle: string): number {
  const code = normalizeQuery(product.code);
  if (code && code === needle) return 100;
  const codes = (product.codes ?? []).map(normalizeQuery).filter(Boolean);
  if (codes.some((c) => c === needle)) return 90;
  if (code && (code.startsWith(needle) || needle.startsWith(code))) return 60;
  if (codes.some((c) => c.startsWith(needle) || needle.startsWith(c))) return 50;
  const name = normalizeQuery(product.name);
  const nameEn = normalizeQuery(product.nameEn || "");
  if (name === needle || nameEn === needle) return 40;
  if (name.startsWith(needle) || nameEn.startsWith(needle)) return 20;
  return 0;
}

/**
 * Empty / whitespace query → `null` (caller shows the idle UI).
 * Otherwise matching products, exact מק״ט first.
 */
export function filterProducts<T extends SearchableProduct>(products: T[], query: string): T[] | null {
  const needle = normalizeQuery(query);
  if (!needle) return null;
  return products
    .map((p, index) => ({ p, index, score: matchScore(p, needle) }))
    .filter(({ p }) => productMatches(p, needle))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ p }) => p);
}
