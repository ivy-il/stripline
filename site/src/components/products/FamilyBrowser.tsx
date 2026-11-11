"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Arrow from "@/components/design/Arrow";
import ProductCard from "@/components/products/ProductCard";
import { filterProducts, type SearchableProduct } from "@/lib/product-search";
import type { Product } from "@/lib/types";

export type BrowserFamily = { slug: string; name: string; text: string; image: string };

/** Families grid when idle; product cubes when searching. */
export default function FamilyBrowser({
  families,
  products,
  labels,
  initialQuery = "",
}: {
  families: BrowserFamily[];
  products: Product[];
  labels: { search: string; none: string; cardMore: string };
  initialQuery?: string;
}) {
  const [q, setQ] = useState(initialQuery);
  useEffect(() => {
    setQ(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (q.trim()) url.searchParams.set("q", q.trim());
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
  }, [q]);

  const searchable = useMemo<SearchableProduct[]>(
    () =>
      products.map((p) => ({
        slug: p.slug,
        code: p.code,
        name: p.name_he,
        family: p.family,
        familyName: "",
        nameEn: p.name,
        codes: p.codes,
      })),
    [products],
  );
  const bySlug = useMemo(() => new Map(products.map((p) => [p.slug, p])), [products]);
  const hits = useMemo(() => filterProducts(searchable, q), [q, searchable]);
  const hitProducts = hits?.map((h) => bySlug.get(h.slug)).filter((p): p is Product => Boolean(p)) ?? null;

  return (
    <>
      <div className="psearch">
        <label htmlFor="psq">{labels.search}</label>
        <input
          id="psq"
          type="search"
          placeholder={labels.search}
          autoComplete="off"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M20 20l-4.8-4.8" />
        </svg>
      </div>

      {hitProducts ? (
        hitProducts.length === 0 ? (
          <p className="psearch-none" aria-live="polite">
            {labels.none}
          </p>
        ) : (
          <div className="pgrid" id="searchgrid" aria-live="polite">
            {hitProducts.map((p) => (
              <ProductCard key={p.slug} product={p} more={labels.cardMore} />
            ))}
          </div>
        )
      ) : (
        <div className="bento" id="famgrid">
          {families.map((f) => (
            <Link
              key={f.slug}
              className="tile w3"
              href={`/products/family/${f.slug}`}
              aria-label={`${f.name}, לכל המוצרים במשפחה`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="ph">
                <img src={f.image} alt="" />
              </div>
              <div className="tx">
                <h2>{f.name}</h2>
                <p>{f.text}</p>
                <span className="go">
                  <Arrow size={22} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
