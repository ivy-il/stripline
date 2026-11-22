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
      pp_sizes: s.pp_sizes, pp_length: s.pp_length, pp_height: s.pp_height, pp_mm: s.pp_mm,
      pp_materials: s.pp_materials, pp_accessories: s.pp_accessories, pp_usage: s.pp_usage, pp_sheet_btn: s.pp_sheet_btn,
    },
  });
}
