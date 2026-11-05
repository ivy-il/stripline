import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { FEATURE_ICONS, GrilleMark } from "@/components/icons";
import { productAccessories, productFeatures, productSizes, productUsage } from "@/lib/product-text";
import { productLabels } from "@/lib/product-labels";
import type { Product, Settings } from "@/lib/types";
import ProductActions from "./ProductActions";

/** Two distinct panels: the specification card, and the room photo with a small summary card in its corner. */
export default function ProductHero({ product, settings }: { product: Product; settings: Settings }) {
  const features = productFeatures(product).slice(0, 2);
  const sizes = productSizes(product);
  const accessories = productAccessories(product);
  // Installation scenes accompany the original supplier photo in the specification card.
  const sceneImage = product.hero_image || "/images/eilat-hero-v2.webp";

  return (
    <section className="product-showcase" aria-label={`מפרט ${product.name_he}`}>
      <aside data-anim="up" data-anim-delay="0.35" className="product-spec-panel">
        <div className="product-spec-card">
          <div className="product-spec-head">
            <div>
              <h1>{product.name_he}</h1>
              <p dir="ltr">{product.code}</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.image} alt={product.name_he} />
          </div>
          <Spec title="תיאור"><p className="whitespace-pre-line">{product.description_he}</p></Spec>
          <Spec title="מידות">
            <ul>
              {sizes.map((s) => <li key={s}>{s}</li>)}
              {product.sizes_he.length > 0 && product.lengths.length > 0 && <li>אורך (L): <span dir="ltr">{product.lengths.join(" | ")}</span> מ״מ</li>}
              {product.sizes_he.length > 0 && product.heights.length > 0 && <li>גובה (H): <span dir="ltr">{product.heights.join(" | ")}</span> מ״מ</li>}
              {(product.lengths.length > 0 || product.heights.length > 0) && <li>מידות נוספות זמינות לפי דרישה</li>}
            </ul>
          </Spec>
          {accessories.length > 0 && <Spec title="אביזרים"><ul>{accessories.map((s) => <li key={s}>{s}</li>)}</ul></Spec>}
          {accessories.length === 0 && product.install_he.length > 0 && <Spec title="התקנה"><p>{product.install_he[0].items.join(" ")}</p></Spec>}
          {product.materials_he.length > 0 && <Spec title="חומרים וגימור"><ul>{product.materials_he.map((s) => <li key={s}>{s}</li>)}</ul></Spec>}
          <Spec title="שימוש"><p>{productUsage(product)}</p></Spec>
          <div className="product-spec-actions"><ProductActions product={product} labels={productLabels(settings)} /></div>
        </div>
      </aside>

      <div className="product-scene">
        <Link href={`/products/family/${product.family}`} data-anim="up" className="product-back-link">
          <ArrowRight aria-hidden="true" /> חזרה למשפחת המוצרים
        </Link>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sceneImage} alt="" className="product-scene-image" />

        <div data-anim="up" data-anim-delay="0.5" className="product-feature-card">
          <p className="product-feature-title"><span dir="ltr">{product.code}</span><strong>{product.name_he}</strong></p>
          <ul>
            {features.map((feature, i) => {
              const Icon = i === 0 ? GrilleMark : FEATURE_ICONS[i % FEATURE_ICONS.length];
              return <li key={i}><Icon className="product-feature-icon" /><span>{feature}</span></li>;
            })}
          </ul>
          <a href={`/products/${product.slug}/sheet?download=1`} target="_blank" rel="noopener" className="btn product-download">
            <Download /> הורדת דף מוצר PDF
          </a>
        </div>
      </div>
    </section>
  );
}

function Spec({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="product-spec-group"><h2>{title}</h2><div>{children}</div></div>;
}
