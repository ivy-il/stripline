import { notFound } from "next/navigation";
import { getFamilies, getProduct, getProducts, getSettings } from "@/lib/wp";
import ProductSheet from "@/components/products/ProductSheet";
import { isTransparentCutout } from "@/lib/sheet-image";

export const metadata = { title: "דף מוצר PDF" };

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export default async function SheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, settings, families] = await Promise.all([getProduct(slug), getSettings(), getFamilies()]);
  if (!product) notFound();
  const family = families.find((f) => f.slug === product.family);
  const bannerCutout = await isTransparentCutout(product.hero_image);
  return <ProductSheet product={product} settings={settings} family={family} bannerCutout={bannerCutout} />;
}
