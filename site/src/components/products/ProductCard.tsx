/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { productImage } from "@/lib/design";
import type { Product } from "@/lib/types";

/**
 * A product tile in the products grid. The name's link stretches over the whole card; the PDF sheet
 * download sits above it in the hover bar (design: .pc-acts), since one link cannot be nested inside another.
 */
export default function ProductCard({ product: p, more }: { product: Product; more: string }) {
  return (
    <div className="pc">
      <div className="ph">
        <img src={productImage(p)} alt="" loading="lazy" />
        <span className="pc-acts">
          <span className="go" aria-hidden="true">{more}<svg width="16" height="8" viewBox="0 0 26 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M26 6H1M6 1L1 6l5 5" /></svg></span>
          <a className="pdf" href={`/products/${p.slug}/sheet?download=1`} target="_blank" rel="noopener" aria-label={`הורדת דף מוצר PDF: ${p.name_he}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M4 20h16" /></svg>PDF
          </a>
        </span>
      </div>
      <h3><Link className="pc-link" href={`/products/${p.slug}`}>{p.name_he}</Link></h3>
      <p>{p.short_he}</p>
    </div>
  );
}
