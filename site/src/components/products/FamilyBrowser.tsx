"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Arrow from "@/components/design/Arrow";
import { fill } from "@/components/design/Rich";
import { filterProducts, type SearchableProduct } from "@/lib/product-search";

export type BrowserFamily = { slug: string; name: string; text: string; image: string };
export type BrowserProduct = SearchableProduct;

/** The families grid with the design's search: matching products are listed, families without a match step aside. */
export default function FamilyBrowser({
  families,
  products,
  labels,
  initialQuery = "",
}: {
  families: BrowserFamily[];
  products: BrowserProduct[];
  labels: { search: string; none: string; more: string };
  initialQuery?: string;
}) {
  const [q, setQ] = useState(initialQuery);
  useEffect(() => {
    setQ(initialQuery);
  }, [initialQuery]);
  const hits = useMemo(() => filterProducts(products, q), [q, products]);
  const famHit = hits && new Set(hits.map((p) => p.family));

  return (
    <>
      <div className="psearch">
        <label htmlFor="psq">{labels.search}</label>
        <input id="psq" type="search" placeholder={labels.search} autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.8-4.8" /></svg>
      </div>
      {hits && (
        <ul className="presults" aria-live="polite">
          {hits.length === 0 && <li><span className="none">{labels.none}</span></li>}
          {hits.slice(0, 8).map((p) => (
            <li key={p.slug}>
              <Link href={`/products/${p.slug}`} className="presult-link">
                <b>{p.name}</b><span className="c">{p.code}</span><span className="f">{p.familyName}</span>
              </Link>
            </li>
          ))}
          {hits.length > 8 && <li><span className="none">{fill(labels.more, { n: hits.length - 8 })}</span></li>}
        </ul>
      )}
      <div className="bento" id="famgrid">
        {families.map((f) => (
          <Link key={f.slug} className="tile w3" href={`/products/family/${f.slug}`} hidden={famHit ? !famHit.has(f.slug) : undefined} aria-label={`${f.name}, לכל המוצרים במשפחה`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div className="ph"><img src={f.image} alt="" /></div>
            <div className="tx"><h2>{f.name}</h2><p>{f.text}</p><span className="go"><Arrow size={22} /></span></div>
          </Link>
        ))}
      </div>
    </>
  );
}
