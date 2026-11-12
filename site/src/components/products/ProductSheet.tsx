"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Download, Loader2 } from "lucide-react";
import { FEATURE_ICONS } from "@/components/icons";
import { defaultInstall } from "./ProductActions";
import {
  productAccessories,
  productFeatures,
  productHasAttachedCatalog,
  productSheetFileStem,
  productSizes,
  productUsage,
} from "@/lib/product-text";
import type { Family, Product, Settings } from "@/lib/types";

/** When the sheet is built inside SheetDownloader's hidden frame, it tells the page that opened it how it went. */
function notifyHost(ok: boolean) {
  if (window.parent !== window) window.parent.postMessage({ type: "sheet-pdf", ok }, window.location.origin);
}

/**
 * A4 product sheet (per design PDF: "דף מוצר מלא בהורדת PDF").
 * Rendered as HTML with hex colours only, then rasterised client-side into a PDF.
 */
export default function ProductSheet({
  product,
  settings,
  family,
}: {
  product: Product;
  settings: Settings;
  family?: Family;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);
  const downloading = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const features = productFeatures(product);
  const sizes = productSizes(product);
  const usage = productUsage(product);
  const materials = product.materials_he ?? [];
  const install = (product.install_he.length ? product.install_he : defaultInstall(product, settings))
    .filter((section) => section.items.length > 0);
  const accessories = productAccessories(product);
  const specCols = [
    usage ? { key: "usage", title: settings.pp_usage, body: <p>{usage}</p> } : null,
    materials.length ? {
      key: "materials",
      title: settings.pp_materials,
      body: (
        <ul style={{ paddingRight: 12, margin: 0 }}>
          {materials.map((m) => <li key={m}>{m}</li>)}
        </ul>
      ),
    } : null,
    accessories.length ? {
      key: "accessories",
      title: settings.pp_accessories,
      body: (
        <ul style={{ paddingRight: 12, margin: 0 }}>
          {accessories.map((m) => <li key={m}>{m}</li>)}
        </ul>
      ),
    } : null,
    sizes.length ? {
      key: "sizes",
      title: settings.pp_sizes,
      body: (
        <ul style={{ paddingRight: 12, margin: 0 }}>
          {sizes.map((m) => <li key={m}>{m}</li>)}
        </ul>
      ),
    } : null,
  ].filter((col): col is { key: string; title: string; body: ReactNode } => Boolean(col));

  const website = settings.website.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const productUrl = `https://${website}/products/${product.slug}`;
  const drawQr = useCallback(async () => {
    const { default: QRCode } = await import("qrcode");
    if (qrRef.current) {
      await QRCode.toCanvas(qrRef.current, productUrl, { width: 128, margin: 1, color: { dark: "#1b1917", light: "#ffffff" } });
      qrRef.current.style.width = "48px";
      qrRef.current.style.height = "48px";
    }
  }, [productUrl]);

  const download = useCallback(async () => {
    if (!ref.current || downloading.current) return;
    downloading.current = true;
    setBusy(true);
    setError("");
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);
      await document.fonts.ready;
      await drawQr();
      await Promise.all(Array.from(ref.current.querySelectorAll("img")).map((img) => img.decode()));
      const canvas = await html2canvas(ref.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
      const maxHeight = Math.ceil(canvas.width * 297 / 210);
      const origin = ref.current.getBoundingClientRect().top;
      const scale = canvas.width / ref.current.offsetWidth;
      const breaks = Array.from(ref.current.querySelectorAll("[data-sheet-block]")).map((el) => Math.floor((el.getBoundingClientRect().top - origin) * scale));
      let top = 0;
      while (top < canvas.height) {
        const limit = Math.min(top + maxHeight, canvas.height);
        const candidates = breaks.filter((y) => y > top + maxHeight * 0.5 && y <= limit);
        const end = limit === canvas.height ? limit : candidates.at(-1) ?? limit;
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = end - top;
        slice.getContext("2d")!.drawImage(canvas, 0, top, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
        if (top > 0) pdf.addPage();
        const width = Math.min(210, 297 * slice.width / slice.height);
        pdf.addImage(slice.toDataURL("image/png"), "PNG", (210 - width) / 2, 0, width, slice.height * width / slice.width, undefined, "FAST");
        top = end;
      }
      pdf.save(`STRIPLINE-${productSheetFileStem(product)}.pdf`);
      notifyHost(true);
    } catch {
      setError(settings.sheet_error);
      notifyHost(false);
    } finally {
      downloading.current = false;
      setBusy(false);
    }
  }, [drawQr, product, settings.sheet_error]);

  useEffect(() => {
    void drawQr().catch(() => {});
    // ?download=1 is read here rather than on the server, so the page can be static HTML.
    if (new URLSearchParams(window.location.search).get("download") === "1") {
      const t = setTimeout(() => void download(), 0);
      return () => clearTimeout(t);
    }
  }, [download, drawQr]);

  const gold = "#b8894a";
  const ink = "#1b1917";
  const muted = "#7a736b";
  const line = "#e4dfd6";

  return (
    <div className="py-8" style={{ background: "#f3f0ea", paddingTop: "calc(var(--hdr-h) + 2rem)" }}>
      <div className="no-print mx-auto max-w-[794px] mb-4 flex justify-between items-center px-4">
        <span className="text-sm" style={{ color: muted }}>
          {settings.sheet_preview}
        </span>
        <button onClick={download} disabled={busy} className="btn btn-gold text-sm">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} {settings.pp_pdf}
        </button>
      </div>
      {error && <p role="alert" className="no-print mx-auto max-w-[794px] mb-4 px-4 text-sm text-red-800">{error} {product.pdf_url && <a href={product.pdf_url} className="underline">{settings.sheet_original}</a>}</p>}

      <div className="overflow-x-auto px-4 pb-6">
      <div
        ref={ref}
        dir="rtl"
        className="mx-auto shadow-2xl"
        style={{ width: 794, minHeight: 1123, background: "#fff", color: ink, padding: 40, fontFamily: "var(--font-body), sans-serif", boxSizing: "border-box" }}
      >
        {/* header */}
        <div dir="ltr" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- the client's logo (PNG copy of stripline-logo-dark.svg: html2canvas cannot draw an SVG without a fixed size) */}
          <img src={settings.sheet_logo} alt={`${settings.site_name} ${settings.site_tagline}`} style={{ width: 230, height: "auto", display: "block" }} />
          <span dir="rtl" style={{ fontSize: 12, color: muted }}>{settings.sheet_label}</span>
        </div>

        {/* hero */}
        <div data-sheet-block dir="ltr" style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 20, marginTop: 22 }}>
          <div dir="rtl">
            {product.code?.trim() ? (
              <div dir="ltr" style={{ fontSize: 36, fontWeight: 500, letterSpacing: "0.04em", lineHeight: 1.1, textAlign: "right" }}>{product.code}</div>
            ) : (
              <div style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.15, textAlign: "right" }}>{product.name_he}</div>
            )}
            <div style={{ color: gold, fontSize: 18, marginTop: 6 }}>{product.subtitle_he}</div>
            <p style={{ fontSize: 12, lineHeight: 1.7, marginTop: 12, whiteSpace: "pre-line", color: "#2c2926" }}>{product.description_he}</p>
            {family && (
              <div style={{ fontSize: 11, color: muted, marginTop: 10 }}>
                {settings.sheet_family} {family.name_he}
                {product.code?.trim() ? <> · {settings.sheet_code} <span dir="ltr">{product.code}</span></> : null}
              </div>
            )}
          </div>
          <div style={{ borderRadius: 10, overflow: "hidden", background: "#1b1917", height: 230, position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.hero_image || product.image}
              alt=""
              crossOrigin="anonymous"
              style={{ width: "100%", height: "100%", objectFit: product.hero_image ? "cover" : "contain", background: product.hero_image ? undefined : "#f8f6f2", padding: product.hero_image ? 0 : 20, boxSizing: "border-box" }}
            />
          </div>
        </div>

        {/* feature icons */}
        <div data-sheet-block style={{ display: "grid", gridTemplateColumns: `repeat(${features.length}, 1fr)`, gap: 8, marginTop: 22, borderTop: `1px solid ${line}`, borderBottom: `1px solid ${line}`, padding: "14px 0" }}>
          {features.map((f, i) => {
            const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
            return (
              <div key={i} style={{ textAlign: "center", fontSize: 10, lineHeight: 1.5, color: "#2c2926", padding: "0 6px", borderLeft: i < features.length - 1 ? `1px solid ${line}` : "none" }}>
                <Icon style={{ width: 22, height: 22, color: gold, margin: "0 auto 6px" }} strokeWidth={1.5} />
                {f}
              </div>
            );
          })}
        </div>

        {specCols.length > 0 && (
          <div
            data-sheet-block
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(specCols.length, 4)}, 1fr)`,
              gap: 18,
              marginTop: 20,
              fontSize: 10.5,
              lineHeight: 1.7,
            }}
          >
            {specCols.map((col) => (
              <Col key={col.key} title={col.title} gold={gold} line={line}>
                {col.body}
              </Col>
            ))}
          </div>
        )}

        {/* install + drawing */}
        <div
          data-sheet-block
          style={{
            display: "grid",
            gridTemplateColumns: install.length ? "1.1fr 1fr" : "1fr",
            gap: 20,
            marginTop: 20,
          }}
        >
          {install.length > 0 && (
            <div style={{ border: `1px solid ${line}`, borderRadius: 10, padding: 14, fontSize: 10, lineHeight: 1.6 }}>
              <div style={{ color: gold, fontWeight: 600, fontSize: 12, marginBottom: 6 }}>{settings.pp_install}</div>
              {install.map((s) => (
                <div key={s.title} style={{ marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, color: "#2c2926" }}>{s.title}</div>
                  <ul style={{ paddingRight: 12, margin: 0 }}>
                    {s.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          <div>
            <div style={{ border: `1px solid ${line}`, borderRadius: 10, padding: 10 }}>
              <div style={{ color: gold, fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{settings.pp_drawing}</div>
              {product.drawing_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.drawing_image} alt={`שרטוט היצרן ${product.code}`} crossOrigin="anonymous" style={{ width: "100%", height: 200, objectFit: "contain" }} />
              ) : productHasAttachedCatalog(product) ? (
                <p style={{ fontSize: 10, lineHeight: 1.6 }}>{settings.sheet_drawing_empty}</p>
              ) : null}
            </div>
          </div>
        </div>

        {/* footer */}
        <div data-sheet-block dir="ltr" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 26, paddingTop: 12, borderTop: `1px solid ${line}`, fontSize: 9, color: muted }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={settings.sheet_logo} alt={`${settings.site_name} ${settings.site_tagline}`} style={{ width: 130, height: "auto", display: "block" }} />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }} dir="ltr">
            <span>{settings.website}</span>
            {!settings.phone.includes("X") && <span>{settings.phone}</span>}
            <span>{settings.email}</span>
          </div>
          <a dir="rtl" href={productUrl} aria-label="קישור לעמוד המוצר" style={{ flexShrink: 0, textAlign: "center", fontSize: 7 }}>
            <canvas ref={qrRef} style={{ width: 48, height: 48 }} />
            {settings.sheet_scan}
          </a>
        </div>
      </div>
      </div>
    </div>
  );
}

function Col({ title, gold, line, children }: { title: string; gold: string; line: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ color: gold, fontWeight: 600, fontSize: 12, borderBottom: `1px solid ${line}`, paddingBottom: 4, marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}

