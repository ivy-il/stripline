"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AlbumLabels, AlbumSpread } from "@/lib/album";
import { fill } from "@/components/design/Rich";

/**
 * The catalogue tools from the design: a table of contents (the families in catalogue order, first
 * page of each) and "go to page". `part` renders one of them alone, for the phone layout where the
 * table of contents sits above the book and "go to page" below it.
 */
export default function CatalogTools({ spreads, labels, current, onGo, part = "both" }: {
  spreads: AlbumSpread[]; labels: AlbumLabels; current: number; onGo: (spread: number) => void; part?: "both" | "toc" | "jump";
}) {
  const toc = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const total = spreads.length;

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => { if (!toc.current?.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); button.current?.focus(); } };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  // Only the families the catalogue actually has, each with the page of its first product.
  const families = useMemo(() => {
    const rows: { title: string; spread: number }[] = [];
    spreads.forEach((s, spread) => { if (!rows.some((r) => r.title === s.familyName)) rows.push({ title: s.familyName, spread }); });
    return rows;
  }, [spreads]);
  const currentFamily = spreads[current]?.familyName;

  const jump = (event: React.FormEvent) => {
    event.preventDefault();
    const n = parseInt(value.replace(/[^0-9]/g, ""), 10);
    if (!(n >= 1 && n <= total)) { setError(fill(labels.catalog_jump_err, { total })); return; }
    setError("");
    setValue("");
    onGo(n - 1);
  };

  const tocEl = (
    <div ref={toc} className="toc">
      <button ref={button} type="button" className="pill" aria-expanded={open} aria-controls="toc-list" onClick={() => setOpen(!open)}>
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M0 1h14M0 5h14M0 9h14" /></svg>
        {labels.catalog_toc}
        <svg className="chev" width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M1 1l4 4 4-4" /></svg>
      </button>
      <ul className="toc-list" id="toc-list" hidden={!open}>
        {families.map((row) => (
          <li key={row.title}>
            <button type="button" aria-current={row.title === currentFamily ? "true" : "false"} onClick={() => { onGo(row.spread); setOpen(false); button.current?.focus(); }}>
              <span>{row.title}</span><span className="pn">{labels.catalog_page} {row.spread + 1}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  const jumpEl = (
    <form className="jump" noValidate onSubmit={jump}>
      <label htmlFor="jump-n">{labels.catalog_jump}</label>
      <input
        id="jump-n"
        className="pill"
        type="text"
        inputMode="numeric"
        placeholder={`1–${total}`}
        autoComplete="off"
        value={value}
        onChange={(event) => { setValue(event.target.value); setError(""); }}
        aria-invalid={error ? "true" : undefined}
        aria-describedby="jump-err"
      />
      <button type="submit" className="pill">{labels.catalog_go}</button>
      <span className="jump-err" id="jump-err" aria-live="polite">{error}</span>
    </form>
  );

  return (
    <div className="book-tools" dir="rtl">
      {part !== "jump" && tocEl}
      {part !== "toc" && jumpEl}
    </div>
  );
}
