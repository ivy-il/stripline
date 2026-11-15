import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFamilies, getProduct, getProducts, getSettings } from "@/lib/wp";
import ProductPage from "@/components/products/ProductPage";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  // The CMS falls back to the Hebrew name when no English name was written; show it once in that case.
  const he = p.name_he.trim();
  const en = p.name?.trim();
  return { title: en && en !== he ? `${en} – ${he}` : he, description: p.short_he };
}

export default async function Page({ params }: Params) {
  const { slug } = await params;
  const [product, families, products, settings] = await Promise.all([getProduct(slug), getFamilies(), getProducts(), getSettings()]);
  if (!product) notFound();
  const family = families.find((f) => f.slug === product.family);
  const related = products.filter((p) => p.family === product.family && p.slug !== product.slug);
  return <ProductPage product={product} family={family} related={related} s={settings} />;
}
