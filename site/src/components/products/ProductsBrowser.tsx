"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, X } from "lucide-react";
import type { Family, Product } from "@/lib/types";
import { optimizedImage } from "@/lib/image-url";
import ProductTile from "./ProductTile";

const normalize = (s: string) => s.toLowerCase().replace(/[\s\-–_/.,]+/g, "");
const productCountLabel = (count: number) => `${count} ${count === 1 ? "מוצר" : "מוצרים"}`;

/** The families index. Each family opens its own page; searching lists matching products across families. */
export default function ProductsBrowser({
  families,
  products,
  initialQuery = "",
}: {
  families: Family[];
  products: Product[];
  initialQuery?: string;
}) {
  const [q, setQ] = useState(initialQuery);
  const query = useDeferredValue(q);
  const searching = Boolean(normalize(query));

  // Keep the search shareable without triggering a server round trip.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (query.trim()) url.searchParams.set("q", query.trim());
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
  }, [query]);

  const ordered = useMemo(
    () => [...families].sort((a, b) => a.order - b.order).filter((f) => products.some((p) => p.family === f.slug)),
    [families, products],
  );

  const groups = useMemo(() => {
    const needle = normalize(query);
    if (!needle) return [];
    return ordered
      .map((f) => ({
        family: f,
        items: products.filter(
          (p) => p.family === f.slug && [p.name, p.name_he, p.code, p.short_he, ...p.codes].some((s) => normalize(s).includes(needle)),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [ordered, products, query]);
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="pb-browser">
      <div data-anim="up" data-anim-delay="0.4" className="pb-toolbar pb-toolbar-search">
        <label className="pb-search">
          <Search className="size-4 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="חיפוש מוצר לפי שם או מק״ט"
            aria-label="חיפוש מוצר"
          />
          {q && (
            <button type="button" className="pb-search-clear" onClick={() => setQ("")} aria-label="ניקוי החיפוש">
              <X className="size-3.5" />
            </button>
          )}
        </label>
      </div>

      {!searching ? (
        <ul className="pf-grid" aria-label="משפחות מוצרים">
          {ordered.map((f, i) => {
            const members = products.filter((p) => p.family === f.slug);
            const cover = f.image || members[0]?.image;
            return (
              <li key={f.slug}>
                <Link href={`/products/family/${f.slug}`} className="pf-card">
                  <span className="pf-media" data-photo={Boolean(f.image)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {cover && <img src={optimizedImage(cover, 640)} alt="" loading={i < 4 ? "eager" : "lazy"} />}
                  </span>
                  <span className="pf-body">
                    <span className="pb-group-en" dir="ltr">{f.name}</span>
                    <span className="pf-name">{f.name_he}</span>
                    <span className="pf-desc">{f.description_he}</span>
                    <span className="pf-foot">
                      <span>לכל המוצרים במשפחה</span>
                      <span className="pb-go pf-go" aria-hidden><ArrowLeft className="size-4" strokeWidth={1.5} /></span>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <>
          <p className="pb-result" aria-live="polite">
            <span className="tabular-nums">{productCountLabel(total)}</span>{" "}
            עבור <span className="text-ink">&quot;{query.trim()}&quot;</span>
          </p>
          {groups.length === 0 ? (
            <div className="pb-empty">
              <p className="pb-empty-title">לא מצאנו מוצר שמתאים לחיפוש</p>
              <p className="text-muted">נסו מק״ט אחר או שם כללי יותר, כמו &quot;מפזר&quot; או &quot;תריס&quot;.</p>
              <div className="flex flex-wrap justify-center gap-3 mt-5">
                <button type="button" className="btn btn-outline" onClick={() => setQ("")}>
                  חזרה למשפחות המוצרים
                </button>
                <Link href="/contact" className="btn btn-dark">
                  עזרה באיתור מוצר
                </Link>
              </div>
            </div>
          ) : (
            groups.map(({ family: f, items }) => (
              <section key={f.slug} className="pb-group" aria-labelledby={`fam-${f.slug}`}>
                <header className="pb-group-head">
                  <div>
                    <p className="pb-group-en" dir="ltr">{f.name}</p>
                    <h2 id={`fam-${f.slug}`} className="pb-group-title">
                      <Link href={`/products/family/${f.slug}`}>{f.name_he}</Link>
                    </h2>
                  </div>
                  <p className="pb-group-desc">{f.description_he}</p>
                </header>
                <ul className="pb-grid">
                  {items.map((p, i) => <ProductTile key={p.slug} product={p} index={i} />)}
                </ul>
              </section>
            ))
          )}
        </>
      )}
    </div>
  );
}
