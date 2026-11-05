import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Arrow from "@/components/design/Arrow";
import ProductCard from "@/components/products/ProductCard";
import { familyScene } from "@/lib/design";
import { getFamilies, getProducts, getSettings } from "@/lib/wp";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getFamilies()).map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const family = (await getFamilies()).find((f) => f.slug === slug);
  if (!family) return {};
  return { title: family.name_he, description: family.description_he };
}

/* eslint-disable @next/next/no-img-element */
/** One family: every product that belongs to it, each linking to its full product page. */
export default async function FamilyPage({ params }: Params) {
  const { slug } = await params;
  const [families, products, s] = await Promise.all([getFamilies(), getProducts(), getSettings()]);
  const withProducts = families.filter((f) => products.some((p) => p.family === f.slug));
  const index = withProducts.findIndex((f) => f.slug === slug);
  const family = withProducts[index];
  if (!family) notFound();
  const members = products.filter((p) => p.family === slug);
  const next = withProducts[(index + 1) % withProducts.length];

  return (
    <>
      <div data-section="family-hero" className="phero">
        <img src={familyScene(family, s.default_scene)} alt="" />
        <div className="wrap">
          <Link className="arrow back" href="/products"><Arrow className="flip" /> {s.products_title}</Link>
          <h1>{family.name_he}</h1>
        </div>
      </div>
      <div data-section="family-products" className="wrap">
        <p className="fam-lead">{family.description_he}</p>
        <div className="pgrid">
          {members.map((p) => (
            <ProductCard key={p.slug} product={p} more={s.card_more} />
          ))}
        </div>
        {next && next.slug !== slug && (
          <Link className="next fam-next" href={`/products/family/${next.slug}`}>
            <div className="ph bleed-start"><img src={familyScene(next, s.default_scene)} alt="" loading="lazy" /></div>
            <div className="t"><h2>{next.name_he}</h2><Arrow /></div>
          </Link>
        )}
      </div>
    </>
  );
}
