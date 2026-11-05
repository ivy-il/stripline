import Link from "next/link";
import { getSettings } from "@/lib/wp";

export default async function NotFound() {
  const s = await getSettings();
  return (
    <section data-section="not-found" className="wrap msg-page">
      <h1>{s.notfound_title}</h1>
      {s.notfound_text && <p className="msg-lead">{s.notfound_text}</p>}
      <nav className="msg-nav" aria-label="עמודים באתר">
        {s.notfound_links.map((l) => <Link key={l.href + l.label} href={l.href}>{l.label}</Link>)}
      </nav>
    </section>
  );
}
