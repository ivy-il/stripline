"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, FileText, PencilRuler, Search, X } from "lucide-react";

// The PDF starts at printed catalog page 1, so printed page N is PDF page N.

export type LibraryProduct = {
  slug: string;
  code: string;
  name: string;
  nameEn: string;
  image: string;
  pages: [number, number];
  pdf: string;
  dwg: string;
};
export type LibraryGroup = { slug: string; name: string; products: LibraryProduct[] };

const normalize = (s: string) => s.toLowerCase().replace(/[\s\-–_/.,]+/g, "");

export default function ProfessionalLibrary({
  groups,
  catalogPdf,
  pageOffset,
}: {
  groups: LibraryGroup[];
  catalogPdf: string;
  /** PDF page = printed catalogue page + offset (the file may open with cover pages). */
  pageOffset: number;
}) {
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<string | null>(null);
  const deferred = useDeferredValue(query);

  const visible = useMemo(() => {
    const q = normalize(deferred);
    return groups
      .filter((g) => !family || g.slug === family)
      .map((g) => ({
        ...g,
        products: q
          ? g.products.filter((p) => normalize(`${p.code} ${p.name} ${p.nameEn}`).includes(q))
          : g.products,
      }))
      .filter((g) => g.products.length > 0);
  }, [groups, family, deferred]);
  const total = visible.reduce((n, g) => n + g.products.length, 0);

  return (
    <section className="pro-lib" aria-label="ספריית מוצרים">
      <div data-anim="up" className="pro-toolbar">
        <label className="pro-search">
          <Search className="size-4 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש לפי שם או מק״ט, למשל SLOT"
            aria-label="חיפוש מוצר"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="ניקוי החיפוש" className="pro-search-clear">
              <X className="size-3.5" />
            </button>
          )}
        </label>
        <div className="pro-chips" role="group" aria-label="סינון לפי משפחה">
          <button type="button" className="pro-chip" aria-pressed={family === null} onClick={() => setFamily(null)}>
            הכול
          </button>
          {groups.map((g) => (
            <button
              key={g.slug}
              type="button"
              className="pro-chip"
              aria-pressed={family === g.slug}
              onClick={() => setFamily(family === g.slug ? null : g.slug)}
            >
              {g.name}
              <span className="pro-chip-count tabular-nums">{g.products.length}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {total} מוצרים מוצגים
      </p>

      {visible.length === 0 ? (
        <div className="pro-empty">
          <p className="pro-empty-title">לא נמצא מוצר עבור &quot;{query}&quot;</p>
          <p className="text-muted">נסו מק״ט אחר, או כתבו לנו ונעזור לאתר את המוצר המתאים.</p>
          <div className="flex flex-wrap gap-3 justify-center mt-5">
            <button type="button" className="btn btn-outline" onClick={() => { setQuery(""); setFamily(null); }}>
              הצגת כל המוצרים
            </button>
            <Link href="/contact" className="btn btn-dark">
              פנייה לייעוץ טכני
            </Link>
          </div>
        </div>
      ) : (
        visible.map((g) => (
          <div key={g.slug} className="pro-group">
            <div className="pro-group-head">
              <h2>{g.name}</h2>
              <span className="tabular-nums">{g.products.length} מוצרים</span>
            </div>
            <ul className="pro-list">
              {g.products.map((p) => (
                <li key={p.slug} className="pro-row">
                  <Link href={`/products/${p.slug}`} className="pro-row-main">
                    <span className="pro-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image} alt="" loading="lazy" />
                    </span>
                    <span className="pro-names">
                      <span className="pro-code" dir="ltr">{p.code}</span>
                      <span className="pro-name">{p.name}</span>
                      <span className="pro-name-en" dir="ltr">{p.nameEn}</span>
                    </span>
                  </Link>
                  <div className="pro-actions">
                    <a
                      href={`${catalogPdf}#page=${p.pages[0] + pageOffset}`}
                      target="_blank"
                      rel="noopener"
                      className="pro-action pro-action-pages"
                      title="פתיחת העמוד בקטלוג הטכני"
                    >
                      <BookOpen className="size-3.5" strokeWidth={1.5} />
                      <span>עמ׳</span>
                      <span dir="ltr" className="tabular-nums">
                        {p.pages[0] === p.pages[1] ? p.pages[0] : `${p.pages[0]}–${p.pages[1]}`}
                      </span>
                    </a>
                    <a href={`/products/${p.slug}/sheet?download=1`} target="_blank" rel="noopener" className="pro-action">
                      <FileText className="size-3.5" strokeWidth={1.5} />
                      דף מוצר
                    </a>
                    {p.pdf && (
                      <a href={p.pdf} target="_blank" rel="noopener" className="pro-action">
                        <FileText className="size-3.5" strokeWidth={1.5} />
                        דף טכני
                      </a>
                    )}
                    {p.dwg ? (
                      <a href={p.dwg} download className="pro-action pro-action-dwg">
                        <PencilRuler className="size-3.5" strokeWidth={1.5} />
                        DWG
                      </a>
                    ) : (
                      <span className="pro-action" aria-disabled="true" data-muted>
                        <PencilRuler className="size-3.5" strokeWidth={1.5} />
                        DWG בקרוב
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
