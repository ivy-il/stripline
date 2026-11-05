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

/** Hebrew for the supplier's "application" line, matched from the most specific wording to the most general. */
const USAGE_TERMS: [RegExp, string][] = [
  [/floor convector/i, "מערכות שונות לאספקה / יניקה של אוויר, למשל קונבקטור רצפתי."],
  [/pressure equalization/i, "מעבר אוויר ואיזון לחצים בין חדרים."],
  [/PFD/, "PFD לאספקת אוויר, PF ליניקת אוויר."],
  [/maintenance/i, "גישה לאזור התחזוקה הנדרש."],
  [/fire/i, "סגירה ואיטום של תעלות האוורור במקרה של שריפה."],
  [/fan stops/i, "מניעת חזרת אוויר כאשר המאוורר נעצר."],
  [/adjust/i, "ויסות זרימת האוויר במערכות אוורור ומיזוג אוויר."],
  [/recirculation/i, "יניקה וסחרור של אוויר."],
  [/supply.*exhaust|exhaust.*supply/i, "אספקה / יניקה של אוויר."],
  [/supply/i, "אספקת אוויר."],
  [/exhaust/i, "יניקת אוויר."],
];

export function productUsage(p: Product): string {
  if (p.usage_he) return p.usage_he;
  return USAGE_TERMS.find(([term]) => term.test(p.application_en))?.[1] ?? "מערכות מיזוג אוויר לאספקה / יניקה.";
}

/** Explicit authored features, otherwise only facts present in the source data. */
export function productFeatures(p: Product): string[] {
  if (p.features_he.length) return p.features_he.slice(0, 5);
  return [p.short_he, `שימוש: ${productUsage(p)}`, ...p.materials_he.slice(0, 2)].filter(Boolean).slice(0, 5);
}

export function productSizes(p: Product): string[] {
  if (p.sizes_he.length) return p.sizes_he;
  const out: string[] = [];
  if (p.lengths.length) out.push(`אורך: ${p.lengths[0]}–${p.lengths[p.lengths.length - 1]} מ״מ`);
  if (p.heights.length) out.push(`גובה: ${p.heights.join(", ")} מ״מ`);
  if (!out.length) out.push("המידות מפורטות בטבלת הבחירה שבדף הקטלוג הטכני");
  return out;
}

/** The drawing as a PDF: the uploaded file, the one exported beside the drawing image, or the product sheet. */
export function drawingPdf(product: Product): string {
  if (product.drawing_pdf_url) return product.drawing_pdf_url;
  if (product.drawing_image?.startsWith("/products/drawings/")) return product.drawing_image.replace(/\.png$/, ".pdf");
  return product.pdf_url || `/products/${product.slug}/sheet?download=1`;
}
