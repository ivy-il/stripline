import type { Metadata } from "next";
import Link from "next/link";
import Arrow from "@/components/design/Arrow";
import { getSettings } from "@/lib/wp";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: s.seo_thanks_title, robots: { index: false } };
}

export default async function ThanksPage() {
  const s = await getSettings();
  const [first, ...rest] = s.thanks_links;
  return (
    <section data-section="thanks" className="wrap msg-page">
      <h1>{s.thanks_title}</h1>
      {s.thanks_text && <p className="msg-lead">{s.thanks_text}</p>}
      <div className="msg-links">
        {first && <Link className="btn" href={first.href}>{first.label} <Arrow size={22} weight={1.4} /></Link>}
        {rest.map((l) => <Link key={l.href + l.label} className="arrow" href={l.href}>{l.label} <Arrow /></Link>)}
      </div>
    </section>
  );
}
