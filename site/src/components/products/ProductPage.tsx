import Link from "next/link";
import { Download, PencilRuler } from "lucide-react";
import Arrow, { WhatsAppIcon } from "@/components/design/Arrow";
import { fill, Rich } from "@/components/design/Rich";
import { agentButtonLabel, familyScene, productImage } from "@/lib/design";
import { drawingPdf, productAccessories, productContactRef, productFeatures, productHasDrawing, productLabel, productSizes, productUsage } from "@/lib/product-text";
import { productLabels } from "@/lib/product-labels";
import type { Family, Product, Settings } from "@/lib/types";
import ProductActions from "./ProductActions";
import ProductCard from "./ProductCard";
import ProductGallery from "./ProductGallery";

/* eslint-disable @next/next/no-img-element */
/**
 * The product page, opened from the catalogue: the product, its specification, the technical drawing
 * at full size and the downloads (product sheet PDF, drawing PDF).
 */
export default function ProductPage({ product, family, related, s }: { product: Product; family?: Family; related: Product[]; s: Settings }) {
  const sizes = productSizes(product);
  const accessories = productAccessories(product);
  const lead = product.description_he || product.short_he;
  const features = productFeatures(product).filter((f) => f !== lead && f !== product.short_he);
  const drawings = product.drawing_images?.length ? product.drawing_images : [product.drawing_image].filter(Boolean);
  const hasDrawing = productHasDrawing(product);
  const sheet = `/products/${product.slug}/sheet?download=1`;
  const scene = product.hero_image || familyScene(family, s.default_scene);
  const waTitle = s.pp_wa_title.trim() || "מעוניינים במוצר הזה? יש לכם שאלה?";
  const waSub = s.pp_wa_sub.trim() || "צוות STRIPLINE זמין לכם בוואטסאפ";
  const productUrl = `https://stripline.co.il/products/${product.slug}`;
  const waMessage = fill(s.pp_whatsapp_msg, { product: productLabel(product), url: productUrl });
  const waText = encodeURIComponent(waMessage.includes(productUrl) ? waMessage : `${waMessage}\n${productUrl}`);
  const code = product.code?.trim();

  return (
    <>
      <div data-section="product-hero" className="phero">
        <img src={scene} alt="" />
        <div className="wrap">
          <Link className="arrow back" href={family ? `/products/family/${family.slug}` : "/products"}>
            <Arrow className="flip" /> {family?.name_he ?? s.products_title}
          </Link>
          <h1>{product.name_he}</h1>
          {code ? <p className="pp-code lat" dir="ltr">{code}</p> : null}
        </div>
      </div>

      <div data-section="product-main" className="wrap">
        <div className="prod">
          <ProductGallery main={productImage(product)} gallery={product.gallery} alt={product.name_he} />
          <div className="prod-tx">
            <p className="prod-lead">{lead}</p>
            {features.length > 0 && (
              <ul className="prod-feat">
                {features.slice(0, 4).map((f) => <li key={f}>{f}</li>)}
              </ul>
            )}
            <dl className="prod-spec">
              <div>
                <dt>{s.pp_sizes}</dt>
                <dd>
                  {sizes.map((s) => <span key={s}>{s}</span>)}
                  {product.lengths.length > 0 && <span>{s.pp_length} <bdi dir="ltr">{product.lengths.join(" | ")}</bdi> {s.pp_mm}</span>}
                  {product.heights.length > 0 && <span>{s.pp_height} <bdi dir="ltr">{product.heights.join(" | ")}</bdi> {s.pp_mm}</span>}
                </dd>
              </div>
              {product.materials_he.length > 0 && <div><dt>{s.pp_materials}</dt><dd>{product.materials_he.map((s) => <span key={s}>{s}</span>)}</dd></div>}
              {accessories.length > 0 && <div><dt>{s.pp_accessories}</dt><dd>{accessories.map((s) => <span key={s}>{s}</span>)}</dd></div>}
              <div><dt>{s.pp_usage}</dt><dd><span>{productUsage(product)}</span></dd></div>
            </dl>
            <div className="prod-cta">
              <div className="prod-acts">
                <a className="btn" href={sheet} target="_blank" rel="noopener"><Download className="size-4" strokeWidth={1.4} /> {s.pp_sheet_btn}</a>
                <ProductActions product={product} labels={productLabels(s)} />
              </div>
              {s.solutions_agents.some((a) => a.whatsapp) && (
                <div className="prod-ask">
                  <div className="prod-ask-copy">
                    <p className="prod-ask-title"><Rich text={waTitle} /></p>
                    <p className="prod-ask-sub"><Rich text={waSub} wordmark={false} /></p>
                  </div>
                  <div className="prod-wa">
                    {s.solutions_agents.filter((a) => a.whatsapp).map((a) => (
                      <a key={a.name} className="btn sand" href={`https://wa.me/${a.whatsapp}?text=${waText}`} target="_blank" rel="noopener"><WhatsAppIcon /> <span>{agentButtonLabel(s.agent_cta, a.name)}</span></a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {hasDrawing && (
          <section className="prod-draw" aria-labelledby="draw-h">
            <div className="prod-draw-head">
              <h2 id="draw-h"><PencilRuler className="size-6" strokeWidth={1.2} aria-hidden="true" /> {s.pp_drawing}</h2>
              <p>{product.drawing_note || s.pp_drawing_note}</p>
              <div className="acts">
                <a className="btn ghost" href={drawingPdf(product)} download><Download className="size-4" strokeWidth={1.4} /> {s.pp_drawing_pdf}</a>
              </div>
            </div>
            {drawings.length > 0 ? (
              <div className={`prod-draw-figs n${Math.min(drawings.length, 3)}`}>
                {drawings.map((src, i) => (
                  <a key={src} href={src} target="_blank" rel="noopener" className="prod-draw-fig" aria-label={`פתיחת השרטוט ${i + 1} בגודל מלא`}>
                    <img src={src} alt={`שרטוט ${code || product.name_he}${drawings.length > 1 ? `, איור ${i + 1}` : ""}`} loading="lazy" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="prod-draw-empty">{s.pp_drawing_empty}</p>
            )}
          </section>
        )}

        {related.length > 0 && (
          <section className="prod-rel" aria-labelledby="rel-h">
            <div className="pp-prod-head"><h2 id="rel-h">{s.pp_related}{family?.name_he ?? ""}</h2></div>
            <div className="pgrid">
              {related.slice(0, 4).map((p) => (
                <ProductCard key={p.slug} product={p} more={s.card_more} />
              ))}
            </div>
          </section>
        )}
      </div>

      <div data-section="product-cta" className="cta">
        <div className="wrap">
          <h2><Rich text={s.pp_cta_title} /></h2>
          <div>
            {s.pp_cta_text && <p>{s.pp_cta_text}</p>}
            <div className="acts">
              {s.pp_cta_contact && <Link className="btn light" href={`/contact?product=${encodeURIComponent(productContactRef(product))}`}>{s.pp_cta_contact}</Link>}
              {s.pp_cta_catalog && <Link className="btn ghost-l" href="/catalog">{s.pp_cta_catalog}</Link>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
