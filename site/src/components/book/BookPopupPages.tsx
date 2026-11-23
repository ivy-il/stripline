"use client";

/* eslint-disable @next/next/no-img-element */
import { Download, FileText, PencilRuler } from "lucide-react";
import { HighlightIcon } from "@/components/products/ProductPopup";
import { BOOK_PRODUCT_SIZES, BOOK_SCENE_SIZES } from "@/lib/media-sizes";
import type { AlbumLabels, AlbumSpread } from "@/lib/album";
import "./book-popup.css";

/** What a button on a page asks the book to open: the product image large, or the drawing / installation window. */
export type BookAct = "zoom" | "drawing" | "install";
type Props = { spread: AlbumSpread; labels: AlbumLabels; onAct: (slug: string, act: BookAct) => void; sharp?: boolean };

/**
 * The book in the popup's design (WordPress > תוכן האתר > קטלוג > "ספר מדפדף בעיצוב החלון הקופץ"): every page is
 * one product, its specification card beside its room photo with the highlights, so the book itself shows
 * everything the popup did. Inside BookWidePage on a wider screen; a phone's page has the photo on top.
 */
export function BookInfoPage({ spread: s, labels, onAct, sharp = false, phone = false }: Props & { phone?: boolean }) {
  return (
    <span className={`album-face bp-info${phone ? " bp-phone" : ""}`}>
      {phone && <Scene spread={s} labels={labels} sharp={sharp} compact />}
      <span className="bp-card">
        <span className="bp-head">
          <span className="bp-title">
            <span className="bp-name">{s.name}</span>
            {(s.subtitle || s.code) && (
              <span className="bp-code">
                {s.subtitle ? <span>{s.subtitle} </span> : null}
                {s.code ? <bdi dir="ltr">{s.code}</bdi> : null}
              </span>
            )}
          </span>
          <button type="button" className="bp-thumb" onClick={(e) => { e.stopPropagation(); onAct(s.slug, "zoom"); }} aria-label="הגדלת התמונה">
            <img draggable={false} src={s.image} srcSet={s.imageSrcSet} sizes={BOOK_PRODUCT_SIZES} alt={s.name} loading={sharp ? "eager" : "lazy"} />
          </button>
        </span>

        {s.description && <Block title="תיאור"><span className="bp-desc">{s.description}</span></Block>}
        {s.hasSizes && (
          <Block title="מידות">
            <a className="bp-link" href={`/products/${s.slug}`} onClick={(e) => e.stopPropagation()}>לפירוט המידות לחץ כאן</a>
          </Block>
        )}
        {s.usage && <Block title="שימוש"><span className="bp-usage">{s.usage}</span></Block>}

        {(s.hasDrawing || s.hasInstall || phone) && (
          <span className="bp-acts">
            {s.hasDrawing && (
              <button type="button" className="bp-btn" onClick={(e) => { e.stopPropagation(); onAct(s.slug, "drawing"); }}>
                <PencilRuler aria-hidden="true" strokeWidth={1.4} /> {labels.pp_drawing}
              </button>
            )}
            {s.hasInstall && (
              <button type="button" className="bp-btn" onClick={(e) => { e.stopPropagation(); onAct(s.slug, "install"); }}>
                <FileText aria-hidden="true" strokeWidth={1.4} /> {labels.pp_install}
              </button>
            )}
            {phone && <Pdf slug={s.slug} label={labels.pp_sheet_btn} />}
          </span>
        )}
      </span>
    </span>
  );
}

/** A wider screen: one wide page per product, the room photo (70%, on the right) beside the specification card (30%). */
export function BookWidePage({ spread, labels, onAct, sharp = false }: Props) {
  return (
    <span className="album-face bp-wide">
      <span className="bp-wide-visual"><Scene spread={spread} labels={labels} sharp={sharp} /></span>
      <BookInfoPage spread={spread} labels={labels} onAct={onAct} sharp={sharp} />
    </span>
  );
}

/**
 * The open book as a magazine spread: the room photo runs across both pages (the right page and 40% of the left),
 * the specification card sits on the rest of the left page, so the spread reads 70/30 while the pages turn on the
 * middle as in any book. Each page shows its own part of the same photo box (140% of a page wide).
 */
export function BookSpreadPage({ spread: s, labels, onAct, sharp = false, side }: Props & { side: "left" | "right" }) {
  return (
    <span className={`album-face bp-spread bp-spread-${side}`}>
      <img className="bp-spread-photo" draggable={false} src={s.scene} srcSet={s.sceneSrcSet} sizes={BOOK_SCENE_SIZES} alt="" loading={sharp ? "eager" : "lazy"} />
      {side === "left"
        ? <BookInfoPage spread={s} labels={labels} onAct={onAct} sharp={sharp} />
        : <Feat spread={s} labels={labels} pdf />}
    </span>
  );
}

/** `compact` (the phone's page): the photo as a band on top, the highlights in a strip under it, no PDF button there. */
function Scene({ spread: s, labels, sharp, compact = false }: { spread: AlbumSpread; labels: AlbumLabels; sharp: boolean; compact?: boolean }) {
  return (
    <span className={compact ? "bp-scene bp-scene-compact" : "bp-scene"}>
      <img className="bp-scene-img" draggable={false} src={s.scene} srcSet={s.sceneSrcSet} sizes={BOOK_SCENE_SIZES} alt="" loading={sharp ? "eager" : "lazy"} />
      {(s.highlights.length > 0 || !compact) && <Feat spread={s} labels={labels} pdf={!compact} />}
    </span>
  );
}

/** The dark panel over the photo: the highlights with their icons and, unless on the phone, the PDF button. */
function Feat({ spread: s, labels, pdf }: { spread: AlbumSpread; labels: AlbumLabels; pdf: boolean }) {
  return (
    <span className="bp-feat">
      {s.highlights.length > 0 && (
        <span className="bp-feat-list">
          {s.highlights.map(({ icon, text }, i) => (
            <span key={text} className="bp-feat-item">
              <span>{text}</span>
              <HighlightIcon icon={icon} index={i} icons={labels.icons} className="bp-ico" />
            </span>
          ))}
        </span>
      )}
      {pdf && <Pdf slug={s.slug} label={labels.pp_sheet_btn} />}
    </span>
  );
}

function Pdf({ slug, label }: { slug: string; label: string }) {
  return (
    <a className="bp-pdf" href={`/products/${slug}/sheet?download=1`} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>
      <span>{label}</span> <Download aria-hidden="true" strokeWidth={1.6} />
    </a>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <span className="bp-block">
      <span className="bp-h">{title}</span>
      {children}
    </span>
  );
}
