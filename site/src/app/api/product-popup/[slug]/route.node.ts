import { NextResponse } from "next/server";
import { familyScene } from "@/lib/design";
import { productLabels } from "@/lib/product-labels";
import { getFamilies, getProduct, getSettings } from "@/lib/wp";

/**
 * Everything the product popup shows (WordPress > תוכן האתר > קטלוג > "חלון קופץ"): the product, its room photo
 * and the words of the product page. Read through the same cached WordPress calls as the product page, so a
 * save in WordPress refreshes it too.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, families, s] = await Promise.all([getProduct(slug), getFamilies(), getSettings()]);
  if (!product) return NextResponse.json({ error: "not found" }, { status: 404 });
  const family = families.find((f) => f.slug === product.family);
  return NextResponse.json({
    product,
    scene: product.hero_image || familyScene(family, s.default_scene),
    labels: {
      ...productLabels(s),
      pp_length: s.pp_length, pp_height: s.pp_height, pp_mm: s.pp_mm, pp_sheet_btn: s.pp_sheet_btn,
      // The popup's section headings (WordPress > תוכן האתר > קטלוג). Saving that tab with a heading left
      // empty would hide it, so an empty one keeps the default.
      popup_desc: s.popup_desc?.trim() || "תיאור",
      popup_models: s.popup_models?.trim() || "דגמים",
      popup_sizes: s.popup_sizes?.trim() || "מידות",
      popup_accessories: s.popup_accessories?.trim() || "אביזרים נלווים",
      popup_materials: s.popup_materials?.trim() || "חומרים",
      popup_usage: s.popup_usage?.trim() || "שימוש",
    },
  });
}
