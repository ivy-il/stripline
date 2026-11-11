import type { Metadata } from "next";
import FamilyBrowser from "@/components/products/FamilyBrowser";
import { familyTile } from "@/lib/design";
import { getFamilies, getProducts, getSettings } from "@/lib/wp";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: s.products_title, description: s.seo_products_desc };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string | string[] }>;
}) {
  const [families, products, s] = await Promise.all([getFamilies(), getProducts(), getSettings()]);
  const params = searchParams ? await searchParams : undefined;
  const raw = params?.q;
  const initialQuery = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
  return (
    <>
      <div data-section="products-hero" className="phero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {s.products_image && <img src={s.products_image} alt="" />}
        <div className="wrap"><h1>{s.products_title}</h1></div>
      </div>
      <div data-section="products-grid" className="wrap">
        <FamilyBrowser
          labels={{ search: s.products_search, none: s.products_none, cardMore: s.card_more }}
          initialQuery={initialQuery}
          families={families
            .filter((f) => products.some((p) => p.family === f.slug))
            .map((f) => ({ slug: f.slug, name: f.name_he, text: f.description_he, image: familyTile(f, products, s.default_scene) }))}
          products={products}
        />
      </div>
    </>
  );
}
