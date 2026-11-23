"use client";

import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck, Building2, Check, Download, Droplets, Filter, Gauge, Layers, LayoutGrid, Leaf, Lightbulb, Palette,
  Ruler, Settings2, ShieldCheck, Sparkles, Star, Thermometer, VolumeX, Wind, X, type LucideIcon,
} from "lucide-react";
import ProductActions from "./ProductActions";
import { FEATURE_ICON_NAMES, isUsageLine, productAccessories, productFeatureItems, productSizes, productUsage } from "@/lib/product-text";
import type { ProductLabels } from "@/lib/product-labels";
import type { Product, Settings } from "@/lib/types";
import "./product-popup.css";

type PopupLabels = ProductLabels & Pick<Settings, "pp_length" | "pp_height" | "pp_mm" | "pp_sheet_btn">;
type PopupData = { product: Product; scene: string; icons: Record<string, string>; labels: PopupLabels };

/** The popup's section headings. */
const HEAD = { desc: "תיאור", models: "דגמים", sizes: "מידות", accessories: "אביזרים נלווים", materials: "חומרים", usage: "שימוש" };

/** The built-in icons a highlight can name in WordPress ("אייקון | טקסט", names in product-text.ts FEATURE_ICON_NAMES). */
const ICONS: Record<string, LucideIcon> = {
  grid: LayoutGrid, airflow: Wind, shield: ShieldCheck, light: Lightbulb, palette: Palette, ruler: Ruler,
  quiet: VolumeX, temp: Thermometer, water: Droplets, layers: Layers, star: Star, leaf: Leaf,
  settings: Settings2, check: BadgeCheck, building: Building2, sparkles: Sparkles, filter: Filter, gauge: Gauge,
};
/** A highlight without a chosen icon gets these in turn. */
const DEFAULT_ICONS = [LayoutGrid, Wind, ShieldCheck, Lightbulb, Palette];

/**
 * A product over the flip book (WordPress > תוכן האתר > קטלוג > "חלון קופץ"), instead of its own page:
 * the specification card beside the room photo with the highlights and the product sheet PDF.
 * When the data cannot be read, `onFail` opens the product page instead.
 */
export default function ProductPopup({ slug, onClose, onFail }: { slug: string; onClose: () => void; onFail: (slug: string) => void }) {
  const [data, setData] = useState<PopupData | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/product-popup/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: PopupData) => live && setData(d))
      .catch(() => live && onFail(slug));
    return () => {
      live = false;
    };
  }, [slug, onFail]);

  useEffect(() => {
    closeRef.current?.focus();
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      // Escape in the drawing / installation window closes that window only.
      if (e.key === "Escape" && document.querySelectorAll('[aria-modal="true"]').length === 1) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = before;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const p = data?.product;
  return (
    <div className="ppop" role="dialog" aria-modal="true" aria-label={p?.name_he ?? "מוצר"} onClick={onClose}>
      <div className="ppop-box" onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} type="button" className="ppop-close" onClick={onClose} aria-label="סגירה">
          <X className="size-5" />
        </button>
        {data && p ? <PopupBody product={p} scene={data.scene} icons={data.icons ?? {}} t={data.labels} /> : <div className="ppop-loading" aria-live="polite">טוען…</div>}
      </div>
    </div>
  );
}

/* eslint-disable @next/next/no-img-element */
function PopupBody({ product: p, scene, icons, t }: { product: Product; scene: string; icons: Record<string, string>; t: PopupLabels }) {
  const lead = (p.description_he || p.short_he || "").trim();
  const features = productFeatureItems(p).filter(({ text }) => text !== lead && text !== p.short_he && !isUsageLine(p, text)).slice(0, 5);
  const models = p.codes?.length > 1 ? p.codes : [];
  const sizes = productSizes(p);
  // Size lines written as "cell | cell | …" form the technical table; its first line is the header row.
  const table = sizes.length > 1 && sizes.every((l) => l.includes("|")) ? sizes.map((l) => l.split("|").map((c) => c.trim())) : null;
  const accessories = productAccessories(p);
  const usage = productUsage(p);
  const sheet = `/products/${p.slug}/sheet?download=1`;
  const code = p.code?.trim();

  return (
    <div className="ppop-grid">
      <section className="ppop-info" aria-label="מפרט המוצר">
        <header className="ppop-head">
          <div>
            <h2>{p.name_he}</h2>
            {(p.subtitle_he || code) && (
              <p className="ppop-code">
                {p.subtitle_he ? <span>{p.subtitle_he} </span> : null}
                {code ? <bdi dir="ltr">{code}</bdi> : null}
              </p>
            )}
          </div>
          <div className="ppop-thumb"><img src={p.image} alt={p.name_he} /></div>
        </header>

        {lead && <Block title={HEAD.desc}><p>{lead}</p></Block>}
        {models.length > 0 && (
          <Block title={HEAD.models}>
            <ul className="ppop-checks">
              {models.map((m) => <li key={m}><Check className="size-4" aria-hidden="true" /> <bdi dir="ltr">{m}</bdi></li>)}
            </ul>
          </Block>
        )}
        {(sizes.length > 0 || p.lengths.length > 0 || p.heights.length > 0) && (
          <Block title={HEAD.sizes}>
            {table ? (
              <div className="ppop-table-wrap">
                <table className="ppop-table">
                  <thead><tr>{table[0].map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
                  <tbody>{table.slice(1).map((row, r) => <tr key={r}>{row.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody>
                </table>
              </div>
            ) : (
              <ul className="ppop-lines">{sizes.map((s) => <li key={s}>{s}</li>)}</ul>
            )}
            {p.lengths.length > 0 && <p>{t.pp_length} <bdi dir="ltr">{p.lengths.join(" | ")}</bdi> {t.pp_mm}</p>}
            {p.heights.length > 0 && <p>{t.pp_height} <bdi dir="ltr">{p.heights.join(" | ")}</bdi> {t.pp_mm}</p>}
          </Block>
        )}
        {accessories.length > 0 && <Block title={HEAD.accessories}><p>{accessories.join(", ")}.</p></Block>}
        {p.materials_he.length > 0 && <Block title={HEAD.materials}><ul className="ppop-lines">{p.materials_he.map((m) => <li key={m}>{m}</li>)}</ul></Block>}
        {usage && <Block title={HEAD.usage}><p>{usage}</p></Block>}

        <div className="ppop-acts">
          <ProductActions product={p} labels={t} />
        </div>
      </section>

      <section className="ppop-visual" aria-label="תמונת אווירה ונקודות בולטות">
        <img src={scene} alt="" className="ppop-scene" />
        <div className="ppop-feat">
          {features.length > 0 && (
            <ul>
              {features.map(({ icon, text }, i) => {
                // An icon uploaded in WordPress under this name, else a built-in one, else the next default.
                const uploaded = icon ? icons[icon] : undefined;
                const Icon = (icon && ICONS[FEATURE_ICON_NAMES[icon]]) || DEFAULT_ICONS[i % DEFAULT_ICONS.length];
                return (
                  <li key={text}>
                    <span>{text}</span>
                    {uploaded ? <img src={uploaded} alt="" className="ppop-ico ppop-ico-img" /> : <Icon className="ppop-ico" strokeWidth={1.3} aria-hidden="true" />}
                  </li>
                );
              })}
            </ul>
          )}
          <a className="ppop-pdf" href={sheet} target="_blank" rel="noopener">
            <span>{t.pp_sheet_btn}</span> <Download className="size-5" strokeWidth={1.6} aria-hidden="true" />
          </a>
        </div>
      </section>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="ppop-block">
      <h3>{title}</h3>
      {children}
    </div>
  );
}
