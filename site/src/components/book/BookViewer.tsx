"use client";

import { useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import FlipBook, { type FlipBookHandle } from "@/components/FlipBook";

type Props = {
  pages: ReactNode[];
  variant?: "preview" | "full";
  ctaHref?: string;
  ctaLabel?: string;
};

export default function BookViewer({ pages, variant = "full", ctaHref, ctaLabel }: Props) {
  const ref = useRef<FlipBookHandle>(null);
  const [state, setState] = useState({ page: 0, total: pages.length });
  const preview = variant === "preview";
  const width = preview ? 420 : 460;
  const height = preview ? 280 : 620;

  const spread = state.page === 0 ? "01" : String(state.page + 1).padStart(2, "0");

  return (
    <div className={`relative ${preview ? "home-book-viewer" : "py-4"}`}>
      <div className="flex items-center gap-3 md:gap-6">
        <NavButton dir="prev" onClick={() => ref.current?.prev()} label="עמוד קודם" />
        <div
          className={`flex-1 ${preview ? "text-[11px] md:text-[12px]" : "text-[13px] md:text-[16px]"}`}
          style={{ perspective: 2400 }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") { e.preventDefault(); ref.current?.next(); }
            if (e.key === "ArrowRight") { e.preventDefault(); ref.current?.prev(); }
          }}
          tabIndex={0}
          aria-label="קטלוג דיגיטלי, השתמשו בחצים כדי לדפדף"
        >
          <div className={preview ? "home-book-volume" : "drop-shadow-[0_30px_40px_rgba(27,25,23,0.35)]"}>
            <FlipBook
              ref={ref}
              openSpread={preview}
              pages={pages}
              width={width}
              height={height}
              minWidth={preview ? 100 : 200}
              minHeight={preview ? 66 : 270}
              onFlip={(page, total) => setState({ page, total })}
            />
          </div>
        </div>
        <NavButton dir="next" onClick={() => ref.current?.next()} label="עמוד הבא" />
      </div>
      <div aria-live="polite" className={`${preview ? "sr-only" : "mt-4 flex items-center justify-center gap-4 text-xs text-muted tabular-nums"}`} dir="ltr">
        <span>
          {spread} / {String(state.total).padStart(2, "0")}
        </span>
        {ctaHref && (
          <Link href={ctaHref} className="text-gold hover:underline" dir="rtl">
            {ctaLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

function NavButton({ dir, onClick, label }: { dir: "next" | "prev"; onClick: () => void; label: string }) {
  // In an RTL book "next" is to the left.
  const Icon = dir === "next" ? ArrowLeft : ArrowRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`shrink-0 size-10 md:size-11 rounded-full border border-ink/30 bg-cream-2/80 hover:bg-ink hover:text-white transition-colors flex items-center justify-center ${
        dir === "next" ? "order-last" : "order-first"
      }`}
    >
      <Icon className="size-4" />
    </button>
  );
}

