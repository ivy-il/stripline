"use client";

import { useState } from "react";
import { Download, FileText, PencilRuler } from "lucide-react";
import Modal from "@/components/Modal";
import { drawingPdf, productAccessories, productHasAttachedCatalog, productHasDrawing } from "@/lib/product-text";
import { fill } from "@/components/design/Rich";
import type { ProductLabels } from "@/lib/product-labels";
import type { Product } from "@/lib/types";

/** "שרטוט טכני" + "הוראות התקנה" buttons with their modals (behaviour per design PDF). */
export default function ProductActions({ product, labels: t }: { product: Product; labels: ProductLabels }) {
  const [drawing, setDrawing] = useState(false);
  const [install, setInstall] = useState(false);
  const sheetUrl = `/products/${product.slug}/sheet?download=1`;
  const hasDrawing = productHasDrawing(product);

  const drawingImages = product.drawing_images?.length ? product.drawing_images : [product.drawing_image].filter(Boolean);
  const installationDrawing = product.installation_drawing_image || product.drawing_image;
  const drawingEl = installationDrawing ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={installationDrawing} alt={`איור טכני ${product.code || product.name_he}`} className="w-full max-h-64 object-contain" />
  ) : (
    <p className="p-6 text-sm text-muted">{t.pp_install_empty}</p>
  );

  return (
    <>
      {hasDrawing && (
        <button type="button" onClick={() => setDrawing(true)} className="btn ghost">
          <PencilRuler className="size-4" strokeWidth={1.4} /> {t.pp_drawing}
        </button>
      )}
      <button type="button" onClick={() => setInstall(true)} className="btn ghost">
        <FileText className="size-4" strokeWidth={1.4} /> {t.pp_install}
      </button>

      {hasDrawing && (
      <Modal
        open={drawing}
        onClose={() => setDrawing(false)}
        title={t.pp_drawing}
        footer={
          <a href={drawingPdf(product)} download className="btn ghost">
            <Download className="size-4" /> {t.pp_pdf}
          </a>
        }
      >
        <div className="rounded-lg border border-line bg-cream-2 p-4 text-center text-sm text-muted mb-4">
          {product.code?.trim() ? <span dir="ltr" className="font-medium text-ink">{product.code}</span> : null}
          <p className="mt-1">{product.drawing_note || t.pp_modal_note}</p>
        </div>
        <div className="flex flex-col gap-4">
          {drawingImages.length ? drawingImages.map((src, index) => (
            <figure key={src} className="rounded-lg border border-line bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`שרטוט ${product.code || product.name_he}, איור ${index + 1}`} className="w-full max-h-[60vh] object-contain" />
              {drawingImages.length > 1 && <figcaption className="mt-2 text-center text-xs text-muted">{fill(t.pp_modal_figure, { n: index + 1, total: drawingImages.length })}</figcaption>}
            </figure>
          )) : drawingEl}
        </div>
      </Modal>
      )}

      <Modal
        open={install}
        onClose={() => setInstall(false)}
        title={t.pp_install}
        footer={
          <a href={product.installation_pdf_url || sheetUrl} download className="btn ghost">
            <Download className="size-4" /> {t.pp_pdf}
          </a>
        }
      >
        <div className="mb-5 rounded-lg border border-line bg-cream-2 px-4 py-3 text-center">
          {product.code?.trim() ? <span className="font-medium" dir="ltr">{product.code}</span> : <span className="font-medium">{product.name_he}</span>}
          {product.installation_source?.trim() ? (
            <p className="mt-1 text-xs text-muted">{product.installation_source.trim()}</p>
          ) : null}
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            {(product.install_he.length ? product.install_he : defaultInstall(product, t)).map((s) => (
              <div key={s.title}>
                <h4 className="text-gold font-medium text-sm mb-1">{s.title}</h4>
                <ul className="text-sm text-ink-2 leading-relaxed list-disc pr-5 marker:text-gold">
                  {s.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-4 self-start">
            <figure className="rounded-lg border border-line bg-white p-3">
              {drawingEl}
              <figcaption className="mt-2 text-center text-xs text-muted">{product.drawing_kind === "schematic" ? t.pp_fig_schematic : product.drawing_kind === "connection" ? t.pp_fig_connection : t.pp_fig_maker}</figcaption>
            </figure>
            <figure className="rounded-lg border border-line bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.image} alt={product.name_he} className="w-full max-h-44 object-contain" />
              <figcaption className="mt-2 text-center text-xs text-muted">{t.pp_fig_product}</figcaption>
            </figure>
          </div>
        </div>
      </Modal>
    </>
  );
}

/** Installation steps when none were written for the product: the supplier's assembly notes and the accessories. */
export function defaultInstall(p: Product, t: Pick<ProductLabels, "pp_install_title" | "pp_install_text" | "pp_install_acc">) {
  const catalogNote = productHasAttachedCatalog(p) && t.pp_install_text ? [t.pp_install_text] : [];
  return [
    {
      title: t.pp_install_title,
      items: p.assembly_en.length ? p.assembly_en : catalogNote,
    },
    { title: t.pp_install_acc, items: productAccessories(p) },
  ].filter((section) => section.items.length);
}
