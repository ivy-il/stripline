import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AlbumBook from "@/components/book/AlbumBook";
import { albumLabels, buildAlbumSpreads } from "@/lib/album";
import type { Family, Product, Settings } from "@/lib/types";

export default function BookSection({ settings, families, products }: {
  settings: Settings; families: Family[]; products: Product[];
}) {
  const spreads = buildAlbumSpreads(settings, families, products);
  return (
    <section className="home-catalog" aria-label="הקטלוג המדפדף">
      <div data-anim="stagger" data-anim-delay="0.9" className="home-catalog-copy">
        <span>{settings.book_kicker}</span>
        <h2>{settings.book_title}</h2>
        <Link href="/catalog" className="btn btn-dark"><ArrowLeft size={14} />{settings.book_cta}</Link>
      </div>
      <div data-anim="up" data-anim-delay="1" className="home-catalog-book">
        <AlbumBook spreads={spreads} labels={albumLabels(settings)} />
      </div>
    </section>
  );
}
