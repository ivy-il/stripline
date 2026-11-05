/* eslint-disable @next/next/no-img-element */
import { optimizedImage, originalImage } from "@/lib/image-url";
import type { AlbumSpread, PhoneBook } from "@/lib/album";

/** One leaf of the phone flip book. Everything on it comes from WordPress (settings and products). */
export type Leaf =
  | { id: string; kind: "cover" | "image" | "back"; title: string; src: string }
  | { id: string; kind: "toc" | "end"; title: string }
  | { id: string; kind: "product"; title: string; spread: AlbumSpread; spreadIndex: number };

export function buildLeaves(book: PhoneBook, spreads: AlbumSpread[]): Leaf[] {
  return [
    { id: "cover", kind: "cover", title: "כריכה", src: book.cover },
    ...book.openers.map((page, i): Leaf => ({ id: `opener-${i}`, kind: "image", title: page.title, src: page.src })),
    { id: "toc", kind: "toc", title: "תוכן עניינים" },
    ...spreads.map((spread, i): Leaf => ({ id: `p-${spread.slug}`, kind: "product", title: spread.name, spread, spreadIndex: i })),
    { id: "end", kind: "end", title: "יצירת קשר" },
    { id: "back", kind: "back", title: "כריכה אחורית", src: book.backCover },
  ];
}

/** The first leaf of every product family, for the table of contents. */
export function familyEntries(leaves: Leaf[]) {
  const rows: { title: string; index: number }[] = [];
  leaves.forEach((leaf, index) => {
    if (leaf.kind === "product" && leaf.spread.familyName !== rows[rows.length - 1]?.title) rows.push({ title: leaf.spread.familyName, index });
  });
  return rows;
}

const GRID = { headerHeight: 9, footerHeight: 6, pagePadX: 5 };
const PAPER = "#FFFEFA";

/** Falls back to the source file when the resized copy is unavailable. */
function onImageError(event: React.SyntheticEvent<HTMLImageElement>) {
  const img = event.currentTarget;
  const original = originalImage(img.getAttribute("src") || "");
  if (original) img.src = original;
}

/** A catalogue page: logo strip, atmosphere photo with the product's name, its details, and the footnote. */
function ProductLeaf({ spread, pageNumber, footnote }: { spread: AlbumSpread; pageNumber: number; footnote: string }) {
  const facts = [
    { title: "מידות", items: spread.sizes.slice(0, 2) },
    { title: "חומרים וגימור", items: spread.materials.slice(0, 2) },
  ].filter((group) => group.items.length);
  return (
    <div className="flex h-full w-full flex-col" style={{ background: PAPER, containerType: "inline-size" }}>
      <div className="relative flex shrink-0 items-center justify-between" style={{ height: `${GRID.headerHeight}%`, paddingInline: `${GRID.pagePadX}%` }} dir="ltr">
        <img src="/catalog-book/stripline-logo.png" alt="STRIPLINE" className="block h-[40%] w-[30%] object-contain object-left" draggable={false} />
        <img src="/catalog-book/partner.webp" alt="" className="block h-[72%] w-[12%] object-contain object-right" draggable={false} />
      </div>
      {/* The whole photo, uncropped: the product is usually installed high on the wall or in the ceiling. */}
      <div className="relative aspect-[3/2] shrink-0 overflow-hidden">
        <img src={optimizedImage(spread.scene, 828)} alt={`${spread.name} מותקן בחלל`} loading="lazy" onError={onImageError} className="block h-full w-full object-cover" draggable={false} />
        <div dir="rtl" className="absolute inset-x-0 bottom-0 flex flex-col items-start bg-gradient-to-t from-black/55 to-transparent px-[4.5%] pb-[3.5%] pt-[9%]">
          <span className="max-w-full whitespace-normal text-right font-extrabold leading-[1.05] text-white" style={{ fontSize: "5.2cqw", textShadow: "0 1px 8px rgba(23,23,23,.7)" }}>{spread.name}</span>
          <span className="mt-[0.9cqw] block h-[0.25cqw] w-[9.5cqw] bg-[var(--brass)]" />
        </div>
      </div>
      <div dir="rtl" className="flex min-h-0 flex-1 flex-col" style={{ paddingInline: `${GRID.pagePadX}%`, paddingTop: "2.6cqw" }}>
        <div className="tracking-[0.25em] text-[var(--brass)]" style={{ fontSize: "2cqw" }} dir="ltr"><span className="block text-right uppercase">{spread.familyNameEn}</span></div>
        <p className="mt-[1cqw] line-clamp-2 leading-relaxed" style={{ fontSize: "2.7cqw", color: "#4A4742" }}>{spread.description}</p>
        <div className="mt-[2.4cqw] mb-[2.4cqw] grid min-h-0 flex-1 grid-cols-[2fr_3fr] gap-[3cqw] overflow-hidden border border-[#E4DED3] bg-white" style={{ padding: "2.2cqw" }}>
          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden" style={{ fontSize: "2.3cqw", color: "#4A4742" }}>
            <div dir="ltr" className="truncate text-right font-bold tracking-[0.12em]" style={{ fontSize: "3.4cqw", color: "#171717" }}>{spread.code}</div>
            <div className="font-semibold" style={{ fontSize: "2.4cqw", color: "#2B2926" }}>{spread.familyName}</div>
            {facts.map((group) => (
              <div key={group.title} className="mt-[1.2cqw]">
                <div style={{ fontSize: "1.9cqw", color: "#8A857C" }}>{group.title}</div>
                <ul>
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start gap-[1cqw]">
                      <span className="mt-[1.3cqw] block h-[0.7cqw] w-[0.7cqw] shrink-0 bg-[var(--brass)]" />
                      <span className="line-clamp-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="relative min-h-0 min-w-0">
            <img src={optimizedImage(spread.image, 384)} alt={spread.name} loading="lazy" onError={onImageError} className="absolute inset-0 h-full w-full object-contain" draggable={false} />
          </div>
        </div>
      </div>
      <div dir="rtl" className="relative flex shrink-0 items-center" style={{ height: `${GRID.footerHeight}%`, paddingInline: `${GRID.pagePadX}%` }}>
        <p className="max-w-[42%] text-right leading-snug" style={{ fontSize: "1.3cqw", color: "#706C65" }}>{footnote}</p>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-medium tabular-nums tracking-[0.2em] text-[var(--brass)]" style={{ fontSize: "1.9cqw" }}>{pageNumber}</div>
      </div>
    </div>
  );
}

function TocLeaf({ rows, onGoto }: { rows: { title: string; index: number }[]; onGoto: (index: number) => void }) {
  return (
    <div className="flex h-full w-full flex-col bg-white p-[9%] text-slate-950">
      <div className="text-[length:clamp(0.5rem,1.3cqw,0.8rem)] tracking-[0.45em] text-[var(--brass)]">STRIPLINE</div>
      <h2 className="mt-[2%] text-[length:clamp(1.3rem,4.4cqw,2.6rem)] font-semibold">תוכן עניינים</h2>
      <div className="mt-[3%] h-px w-full bg-slate-200" />
      <ul className="mt-[4%] flex min-h-0 flex-1 flex-col justify-start gap-[1.2%] overflow-hidden">
        {rows.map((row) => (
          <li key={row.index}>
            <button type="button" onClick={() => onGoto(row.index)} className="group flex w-full items-baseline gap-3 py-[0.6%] text-right">
              <span className="text-[length:clamp(0.7rem,2.1cqw,1.2rem)] font-medium transition-colors group-hover:text-[var(--brass)]">{row.title}</span>
              <span className="mx-2 flex-1 border-b border-dotted border-slate-200" />
              <span className="text-[length:clamp(0.6rem,1.6cqw,0.95rem)] tabular-nums text-slate-500">{row.index + 1}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="text-[length:clamp(0.5rem,1.3cqw,0.78rem)] text-slate-500">לחיצה על שורה תעביר ישירות לעמוד המבוקש.</div>
    </div>
  );
}

function EndLeaf({ book }: { book: PhoneBook }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-[4%] bg-[var(--ink)] p-[10%] text-center text-[var(--ink-foreground)]">
      <div className="text-[length:clamp(1.4rem,4.6cqw,3rem)] font-light tracking-[0.4em]">STRIP<span className="font-semibold">LINE</span></div>
      <div className="h-px w-[45%] bg-[var(--brass)]" />
      <p className="whitespace-pre-line text-[length:clamp(0.75rem,2.2cqw,1.25rem)] leading-relaxed text-[var(--ink-muted)]">{book.endText}</p>
      <div className="flex flex-col gap-[1.5cqw] text-[length:clamp(0.8rem,2.4cqw,1.35rem)] font-medium">
        {book.agents.map((agent) => agent.phone
          ? <a key={agent.name} href={`tel:${agent.phone.replace(/\D/g, "")}`} dir="rtl">{agent.name} – <span dir="ltr" className="tabular-nums">{agent.phone}</span></a>
          : <span key={agent.name}>{agent.name}</span>)}
      </div>
      {book.tagline && <div className="mt-[4%] text-[length:clamp(0.6rem,1.6cqw,0.95rem)] tracking-[0.3em] text-[var(--brass)]">{book.tagline}</div>}
    </div>
  );
}

export function LeafView({ leaf, leaves, book, pageNumber, onGoto }: {
  leaf: Leaf; leaves: Leaf[]; book: PhoneBook; pageNumber: number; onGoto: (index: number) => void;
}) {
  if (leaf.kind === "product") return <ProductLeaf spread={leaf.spread} pageNumber={pageNumber} footnote={book.footnote} />;
  if (!("src" in leaf)) return leaf.kind === "toc" ? <TocLeaf rows={familyEntries(leaves)} onGoto={onGoto} /> : <EndLeaf book={book} />;
  return (
    <div className="relative h-full w-full">
      <img src={leaf.src} alt={leaf.title} draggable={false} className="block h-full w-full select-none object-contain" />
      {leaf.kind === "back" && (
        <img src="/catalog-book/stripline-logo-back.webp" alt="STRIPLINE" draggable={false} className="pointer-events-none absolute left-1/2 top-1/2 w-[55%] -translate-x-1/2 -translate-y-1/2 select-none object-contain" />
      )}
    </div>
  );
}
