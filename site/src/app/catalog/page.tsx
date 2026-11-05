import type { Metadata } from "next";
import { Suspense } from "react";
import AlbumBook from "@/components/book/AlbumBook";
import CatalogBook from "@/components/book/CatalogBook";
import { albumLabels, buildAlbumSpreads } from "@/lib/album";
import { getFamilies, getProducts, getSettings } from "@/lib/wp";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: s.catalog_title, description: s.seo_catalog_desc };
}

/** The catalogue page: the album book, opened on a product when one is linked (?product=slug). */
export default async function CatalogPage() {
  const [settings, families, products] = await Promise.all([getSettings(), getFamilies(), getProducts()]);
  const spreads = buildAlbumSpreads(settings, families, products);
  const labels = albumLabels(settings);
  return (
    <section className="catalog-full" aria-label={settings.catalog_title}>
      <h1 className="sr-only">{settings.catalog_title} {settings.site_name}</h1>
      <Suspense fallback={<AlbumBook spreads={spreads} labels={labels} tools />}>
        <CatalogBook spreads={spreads} labels={labels} tools />
      </Suspense>
    </section>
  );
}
