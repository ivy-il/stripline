import type { Product } from "./types";

/** Hebrew for the accessories the supplier catalogue lists in English; anything unrecognised stays as written. */
const ACCESSORY_TERMS: [RegExp, string][] = [
  [/settlement frame/i, "מסגרת התקנה CC מפח מגולוון"],
  [/air control damper/i, "דמפר ויסות עם להבים נגדיים OBD"],
  [/adapt[eo]r/i, "מתאם מבודד / לא מבודד ADP IZ/N"],
  [/air filter/i, "מסנן אוויר FIL"],
  [/(attachment|mounting) spring/i, "קפיץ התקנה A"],
  [/actuator|electric drive/i, "מפעיל חשמלי"],
];

export function productAccessories(p: Product): string[] {
  if (p.accessories_he.length) return p.accessories_he;
  return p.accessories_en.flatMap((line) => {
    const known = ACCESSORY_TERMS.filter(([term]) => term.test(line)).map(([, he]) => he);
    return known.length ? known : [line];
  });
}

/** Authored Hebrew usage only — never invent a default when the CMS field is empty. */
export function productUsage(p: Product): string {
  return (p.usage_he || "").trim();
}

/** Explicit authored features, otherwise only facts present in the source data. */
export function productFeatures(p: Product): string[] {
  if (p.features_he.length) return p.features_he.slice(0, 5);
  const usage = productUsage(p);
  return [p.short_he, usage ? `שימוש: ${usage}` : "", ...p.materials_he.slice(0, 2)].filter(Boolean).slice(0, 5);
}

export function productSizes(p: Product): string[] {
  if (p.sizes_he.length) return p.sizes_he;
  const out: string[] = [];
  if (p.lengths.length) out.push(`אורך: ${p.lengths[0]}–${p.lengths[p.lengths.length - 1]} מ״מ`);
  if (p.heights.length) out.push(`גובה: ${p.heights.join(", ")} מ״מ`);
  return out;
}

/** Name for WhatsApp / CTAs: include מק״ט in parentheses only when it exists. */
export function productLabel(product: Product): string {
  const code = product.code?.trim();
  return code ? `${product.name_he} (${code})` : product.name_he;
}

/** Value passed to /contact?product= — code when present, otherwise the Hebrew name. */
export function productContactRef(product: Product): string {
  return product.code?.trim() || product.name_he;
}

/** True when the product has a real technical drawing to show or download. */
export function productHasDrawing(product: Product): boolean {
  return Boolean(
    product.drawing_pdf_url?.trim()
    || product.drawing_image?.trim()
    || product.drawing_images?.some((src) => src?.trim()),
  );
}

/** Downloadable catalog / install / drawing file attached to the product. */
export function productHasAttachedCatalog(product: Product): boolean {
  return Boolean(
    product.drawing_pdf_url?.trim()
    || product.installation_pdf_url?.trim()
    || product.pdf_url?.trim(),
  );
}

/** Safe download stem for the product PDF sheet. */
export function productSheetFileStem(product: Product): string {
  const raw = product.code?.trim() || product.slug?.trim() || product.name_he?.trim() || "product";
  const safe = raw.replace(/[^\w\u0590-\u05FF-]+/g, "_").replace(/^_+|_+$/g, "");
  return safe || "product";
}

/** The drawing as a PDF: the uploaded file, the one exported beside the drawing image, or the product sheet. */
export function drawingPdf(product: Product): string {
  if (product.drawing_pdf_url) return product.drawing_pdf_url;
  if (product.drawing_image?.startsWith("/products/drawings/")) return product.drawing_image.replace(/\.png$/, ".pdf");
  return product.pdf_url || `/products/${product.slug}/sheet?download=1`;
}
