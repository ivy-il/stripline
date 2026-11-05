import type { ReactNode } from "react";
import type { Family, Product, Settings } from "@/lib/types";
import { optimizedImage } from "@/lib/image-url";

/**
 * Builds the pages of the digital catalog from CMS data.
 * Every page is plain HTML so texts and products stay editable from WordPress.
 */
/** Book pages are ~460px wide; serve a resized image instead of the full catalogue PNG. */
const bookImage = (src: string) => optimizedImage(src, 640);

export type BookPageDef = { key: string; kind: "cover" | "intro" | "toc" | "family" | "product" | "back"; node: ReactNode };

export function buildBookPages(settings: Settings, families: Family[], products: Product[], compact = false): BookPageDef[] {
  const pages: BookPageDef[] = [];
  const famsWithProducts = families.filter((f) => products.some((p) => p.family === f.slug));

  pages.push({ key: "cover", kind: "cover", node: <Cover key="cover" settings={settings} /> });
  pages.push({ key: "intro", kind: "intro", node: <Intro key="intro" settings={settings} /> });

  // page numbers (index in book) for toc
  let idx = pages.length + 1; // toc page itself
  const famStart: Record<string, number> = {};
  for (const f of famsWithProducts) {
    famStart[f.slug] = idx;
    idx += 1 + products.filter((p) => p.family === f.slug).length;
  }
  pages.push({ key: "toc", kind: "toc", node: <Toc key="toc" families={famsWithProducts} famStart={famStart} /> });

  for (const f of famsWithProducts) {
    const fp = products.filter((p) => p.family === f.slug);
    pages.push({ key: `fam-${f.slug}`, kind: "family", node: <FamilyDivider key={`fam-${f.slug}`} family={f} products={fp} /> });
    for (const p of fp) {
      pages.push({ key: `p-${p.slug}`, kind: "product", node: <ProductPage key={`p-${p.slug}`} product={p} family={f} compact={compact} /> });
    }
  }
  if (pages.length % 2 === 1) pages.push({ key: "blank", kind: "intro", node: <Blank key="blank" /> });
  pages.push({ key: "back", kind: "back", node: <BackCover key="back" settings={settings} /> });
  return pages;
}

function Wordmark({ light = false, className = "" }: { light?: boolean; className?: string }) {
  return (
    <div className={`flex flex-col items-start gap-[0.35em] ${light ? "text-white" : "text-ink"} ${className}`} dir="ltr">
      <span className="logo-wordmark">STRIPLINE</span>
      <span className={`logo-tagline ${light ? "text-white/60" : "text-muted"}`}>ARCHITECTURAL AIR SOLUTIONS</span>
    </div>
  );
}

function Cover({ settings }: { settings: Settings }) {
  return (
    <div className="h-full w-full book-cover-texture text-white p-[8%] flex flex-col justify-between">
      <Wordmark light className="text-[1.6em]" />
      <div>
        <div className="w-10 h-px bg-gold mb-[6%]" />
        <h2 className="text-[2.1em] leading-[1.15] font-light">
          קטלוג
          <br />
          מוצרים
        </h2>
        <p className="mt-[4%] text-white/70 text-[0.95em] leading-relaxed">פתרונות אוויר אדריכליים</p>
      </div>
      <div className="flex items-end justify-between text-white/50 text-[0.8em]">
        <span>{settings.catalog_year}</span>
        <span dir="ltr">{settings.website}</span>
      </div>
    </div>
  );
}

function Intro({ settings }: { settings: Settings }) {
  return (
    <div className="h-full w-full bg-paper p-[9%] flex flex-col">
      <span className="text-gold text-[0.8em] tracking-wide">{settings.site_name}</span>
      <h2 className="mt-[4%] text-[1.9em] leading-[1.2] font-medium whitespace-pre-line">{settings.hero_title}</h2>
      <p className="mt-[5%] text-muted leading-relaxed text-[0.95em] whitespace-pre-line">{settings.about_text}</p>
      <div className="mt-auto pt-[6%] text-[0.75em] text-muted flex justify-between">
        <span>{settings.address}</span>
        <span dir="ltr">{settings.email}</span>
      </div>
    </div>
  );
}

function Toc({ families, famStart }: { families: Family[]; famStart: Record<string, number> }) {
  return (
    <div className="h-full w-full bg-cream-2 p-[9%] flex flex-col">
      <h2 className="text-[1.5em] font-medium section-title-line inline-block self-start">תוכן העניינים</h2>
      <ol className="mt-[6%] flex flex-col gap-[0.55em] text-[0.95em]">
        {families.map((f) => (
          <li key={f.slug} className="flex items-baseline gap-2">
            <span className="text-ink-2">{f.name_he}</span>
            <span className="flex-1 border-b border-dotted border-line translate-y-[-3px]" />
            <span className="text-gold tabular-nums">{String(famStart[f.slug] + 1).padStart(2, "0")}</span>
          </li>
        ))}
      </ol>
      <p className="mt-auto text-[0.75em] text-muted">לחצו על מוצר בקטלוג כדי לעבור לעמוד המוצר המלא.</p>
    </div>
  );
}

function FamilyDivider({ family, products }: { family: Family; products: Product[] }) {
  const hero = products[0];
  return (
    <div className="h-full w-full bg-ink text-white flex flex-col">
      <div className="relative h-[46%] bg-cream-2 overflow-hidden">
        {hero && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bookImage(hero.image)} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-contain p-[6%]" />
        )}
      </div>
      <div className="p-[9%] flex-1 flex flex-col">
        <span className="text-gold text-[0.75em] tracking-widest" dir="ltr">
          {family.name}
        </span>
        <h2 className="text-[1.9em] font-light mt-1">{family.name_he}</h2>
        <p className="mt-[4%] text-white/65 text-[0.9em] leading-relaxed">{family.description_he}</p>
        <span className="mt-auto text-white/40 text-[0.75em]">{products.length} מוצרים</span>
      </div>
    </div>
  );
}

function ProductPage({ product, family, compact }: { product: Product; family: Family; compact: boolean }) {
  return (
    <a
      href={`/products/${product.slug}`}
      className="block h-full w-full bg-paper p-[8%] flex flex-col group"
      data-book-link
    >
      <div className="flex justify-between items-start text-[0.7em] text-muted">
        <span>{family.name_he}</span>
        <span dir="ltr">{product.code}</span>
      </div>
      <div className="mt-[4%] h-[42%] bg-cream-2 rounded-md overflow-hidden flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bookImage(product.image)} alt={product.name_he} className="max-h-full max-w-full object-contain p-[5%]" loading="lazy" />
      </div>
      <h3 className="mt-[6%] text-[1.35em] leading-tight font-medium">{product.name_he}</h3>
      <span className="text-gold text-[0.85em]" dir="ltr">
        {product.name}
      </span>
      {!compact && <p className="mt-[3%] text-[0.85em] text-muted leading-relaxed line-clamp-4">{product.short_he}</p>}
      <span className="mt-auto text-[0.8em] text-ink-2 group-hover:text-gold inline-flex items-center gap-1">
        לעמוד המוצר ←
      </span>
    </a>
  );
}

function Blank() {
  return <div className="h-full w-full bg-paper" />;
}

function BackCover({ settings }: { settings: Settings }) {
  return (
    <div className="h-full w-full book-cover-texture text-white p-[9%] flex flex-col justify-between">
      <Wordmark light />
      <div className="text-[0.9em] text-white/75 flex flex-col gap-2">
        <span>{settings.address}</span>
        <span dir="ltr">{settings.email}</span>
        <span dir="ltr">{settings.website}</span>
      </div>
    </div>
  );
}
