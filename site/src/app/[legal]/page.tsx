import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSettings } from "@/lib/wp";
import type { Settings } from "@/lib/types";

// Written in WordPress > תוכן האתר > עמודים משפטיים, with its rich editor (the HTML is filtered there by wp_kses_post).
const PAGES = ["privacy", "terms", "accessibility"] as const;
type Page = (typeof PAGES)[number];

function page(s: Settings, legal: string) {
  if (!PAGES.includes(legal as Page)) return null;
  const k = legal as Page;
  return { title: s[`${k}_title`], meta: s[`${k}_meta`], body: s[`${k}_body`] };
}

export function generateStaticParams() {
  return PAGES.map((legal) => ({ legal }));
}

export async function generateMetadata({ params }: { params: Promise<{ legal: string }> }): Promise<Metadata> {
  const p = page(await getSettings(), (await params).legal);
  return p ? { title: p.title } : {};
}

export default async function LegalPage({ params }: { params: Promise<{ legal: string }> }) {
  const p = page(await getSettings(), (await params).legal);
  if (!p) notFound();
  return (
    <section data-section="legal" className="wrap doc">
      <header className="doc-head">
        <h1>{p.title}</h1>
        {p.meta && <p className="doc-meta" dangerouslySetInnerHTML={{ __html: p.meta }} />}
      </header>
      <div className="doc-body" dangerouslySetInnerHTML={{ __html: p.body }} />
    </section>
  );
}
