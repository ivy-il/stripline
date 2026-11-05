import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Product } from "@/lib/types";

export default function ProductTile({ product: p, index }: { product: Product; index: number }) {
  return (
    <li className="pb-cell" style={{ "--i": Math.min(index, 8) } as React.CSSProperties}>
      <Link href={`/products/${p.slug}`} className="pb-tile">
        <span className="pb-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.image} alt={p.name_he} loading={index < 8 ? "eager" : "lazy"} />
        </span>
        <span className="pb-body">
          <span className="pb-name">{p.name_he}</span>
          <span className="pb-code" dir="ltr">{p.code}</span>
          <span className="pb-short">{p.short_he}</span>
        </span>
        <span className="pb-go" aria-hidden>
          <ArrowLeft className="size-4" strokeWidth={1.5} />
        </span>
      </Link>
    </li>
  );
}
