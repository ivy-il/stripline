"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { filterProducts, type SearchableProduct } from "@/lib/product-search";

const ROW = 88;
const MAX_PREVIEW = 6;

type Labels = { search: string; none: string; more: string };

export default function HeaderSearch({
  products,
  labels,
  open,
  onOpenChange,
}: {
  products: SearchableProduct[];
  labels: Labels;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLLabelElement>(null);
  const listId = useId();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(-1);
  const [limit, setLimit] = useState(4);
  const [headerH, setHeaderH] = useState(72);
  const hits = useMemo(() => filterProducts(products, q), [products, q]);
  const shown = hits?.slice(0, limit) ?? [];
  const hasMore = Boolean(hits && hits.length > limit);
  const allHref = `/products?q=${encodeURIComponent(q.trim())}`;

  // The field lives in the header itself: typing there shows the results under the header, nothing else opens.
  const [phone, setPhone] = useState(false);
  const showing = open && Boolean(hits);

  useEffect(() => {
    const mq = window.matchMedia("(max-width:820px)");
    const update = () => setPhone(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Closing (Escape, a click outside, a pick, a new page) empties the field.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) {
      setQ("");
      setActive(-1);
    }
  }
  useEffect(() => {
    if (!open) inputRef.current?.blur();
  }, [open]);

  useEffect(() => {
    if (!showing) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showing]);

  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const hdr = document.getElementById("hdr");
      const nextH = Math.ceil(hdr?.getBoundingClientRect().height ?? varHdr());
      setHeaderH(nextH);
      const sheetTop = nextH;
      // Keep room for the "view all" CTA under the list so the panel never scrolls.
      const foot = 72;
      const pad = 64;
      const avail = Math.max(ROW, window.innerHeight - sheetTop - foot - pad);
      setLimit(Math.max(1, Math.min(MAX_PREVIEW, Math.floor(avail / ROW))));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open, hits]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const node = e.target as Node | null;
      if (!node) return;
      if (panelRef.current?.contains(node) || fieldRef.current?.contains(node)) return;
      onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open, onOpenChange]);

  const go = (slug: string) => {
    onOpenChange(false);
    router.push(`/products/${slug}`);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (!hits || hits.length === 0) {
      if (e.key === "Enter" && q.trim()) {
        e.preventDefault();
        onOpenChange(false);
        router.push(allHref);
      }
      return;
    }
    const max = shown.length - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i < max ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? max : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = active >= 0 ? shown[active] : shown[0];
      if (pick) go(pick.slug);
    }
  };

  return (
    <>
      <label className="hdr-search-btn" htmlFor="hdr-sq" ref={fieldRef}>
        <span className="sr-only">{labels.search}</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M20 20l-4.8-4.8" />
        </svg>
        <input
          ref={inputRef}
          id="hdr-sq"
          type="search"
          role="combobox"
          aria-expanded={showing}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showing && active >= 0 ? `${listId}-${shown[active]?.slug}` : undefined}
          placeholder={phone ? "חיפוש" : labels.search}
          autoComplete="off"
          enterKeyHint="search"
          value={q}
          onFocus={() => onOpenChange(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(-1);
            if (!open) onOpenChange(true);
          }}
          onKeyDown={onKeyDown}
        />
      </label>

      {showing && hits && (
        <div
          className="hdr-search"
          style={{ top: headerH }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onOpenChange(false);
          }}
        >
          <div className="hdr-search-sheet" ref={panelRef}>
            <div className="hdr-search-inner wrap">
              <ul className="hdr-hits" id={listId} role="listbox" aria-label={labels.search}>
                {hits.length === 0 && (
                  <li className="hdr-hits-empty">
                    <span className="none">{labels.none}</span>
                  </li>
                )}
                {shown.map((p, i) => (
                  <li key={p.slug} id={`${listId}-${p.slug}`} role="option" aria-selected={i === active} data-active={i === active || undefined}>
                    <Link
                      href={`/products/${p.slug}`}
                      className="hdr-hit"
                      onClick={() => onOpenChange(false)}
                      onMouseEnter={() => setActive(i)}
                    >
                      <span className="hdr-hit-ph" aria-hidden={p.image ? undefined : true}>
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt="" />
                        ) : null}
                      </span>
                      <span className="hdr-hit-body">
                        <span className="hdr-hit-name">{p.name}</span>
                        {p.familyName ? <span className="hdr-hit-fam">{p.familyName}</span> : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {hasMore && (
                <div className="hdr-hits-more">
                  <Link href={allHref} className="btn ghost" onClick={() => onOpenChange(false)}>
                    לכל התוצאות ({hits.length})
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function varHdr() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--hdr-h").trim();
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n + 8 : 72;
}
