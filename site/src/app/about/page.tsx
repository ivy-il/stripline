import type { Metadata } from "next";
import Link from "next/link";
import FactoryVideo from "@/components/design/FactoryVideo";
import { HeadLines, Paras, Rich, lines } from "@/components/design/Rich";
import { getSettings } from "@/lib/wp";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: s.seo_about_title, description: s.seo_about_desc };
}

/** Optical sizes of the client logos the design was set with; a logo added later gets the plain size. */
const LOGO_SIZE: Record<string, { cls: string; k?: number }> = {
  dimri: { cls: "sm" }, psagot: { cls: "k", k: 0.97 }, briga: { cls: "k", k: 0.88 }, aura: { cls: "k", k: 0.97 },
  azorim: { cls: "sm" }, shikun: { cls: "lgx" }, tshuva: { cls: "k", k: 1.05 }, abrahami: { cls: "k", k: 0.9 },
};
const logoSize = (src: string) => LOGO_SIZE[src.split("/").pop()?.replace(/\.\w+$/, "") ?? ""];

/** "+ " a large paragraph, "# " a heading, "! " a bold paragraph, anything else a paragraph. */
function Blocks({ text }: { text: string }) {
  return (
    <>
      {lines(text).map((line, i) => {
        const body = line.replace(/^[+#!]\s*/, "");
        if (line.startsWith("#")) return <h3 key={i}><Rich text={body} /></h3>;
        const cls = line.startsWith("+") ? "big" : line.startsWith("!") ? "strong" : undefined;
        return <p key={i} className={cls}><Rich text={body} /></p>;
      })}
    </>
  );
}

/* eslint-disable @next/next/no-img-element */
/** Every text and image on this page comes from WordPress > תוכן האתר > אודות. */
export default async function AboutPage() {
  const s = await getSettings();
  return (
    <div id="p-about">
      <div data-section="about-hero" className="hero ab-hero">
        {s.about_image && <img src={s.about_image} alt="" style={{ objectPosition: "50% 30%" }} />}
        <div className="wrap">
          <h1><HeadLines text={s.about_title} sep=" " /></h1>
        </div>
      </div>

      <div data-section="about-intro" className="wrap">
        <div className="ab-intro">
          <div className="l"><Paras text={s.about_text} /></div>
          <div className="ab-cells">
            {s.about_stats.map((st) => (
              <div key={st.title + st.text} className="stat"><span className="lbl">{st.text}</span><span className="num">{st.title}</span></div>
            ))}
            {s.about_dark && <div className="dark"><p><Rich text={s.about_dark} /></p></div>}
            {s.about_intro_image && <div className="ph bleed-end"><img src={s.about_intro_image} alt="" /></div>}
          </div>
        </div>

        {s.about_clients.length > 0 && (
          <div className="clients2">
            <div className="ch"><h2>{s.about_clients_title}</h2><p>{s.about_clients_text}</p></div>
            <ul>
              {s.about_clients.map((c) => {
                const size = logoSize(c.text);
                return (
                  <li key={c.text} className="has-logo">
                    <img className={size?.cls} style={size?.k ? ({ "--k": size.k } as React.CSSProperties) : undefined} src={c.text} alt={c.title} loading="lazy" />
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="ab-split">
          {s.about_split_image && <div className="ph bleed-start"><img src={s.about_split_image} alt="" /></div>}
          <div className="t">
            <h2><Rich text={s.about_split_title} /></h2>
            <Paras text={s.about_split_text} first="strong" />
          </div>
        </div>
      </div>

      <div data-section="about-band" className="band">
        <div className="wrap">
          <h2><Rich text={s.about_band_title} /></h2>
          <div><Paras text={s.about_band_text} first="band-lead" /></div>
        </div>
      </div>

      <div data-section="about-factory" className="wrap factory">
        <div className="fac-top">
          <h2 className="fac-title"><Rich text={s.about_factory_title} /></h2>
          <div className="tx"><Paras text={s.about_factory_text} first="fac-lead" /></div>
        </div>

        <div className="ab-split fac-split">
          {s.about_video && <div className="ph bleed-start fac-vid"><FactoryVideo src={s.about_video} poster={s.about_video_poster} /></div>}
          <div className="t">
            <h3><Rich text={s.about_exp_title} /></h3>
            <Paras text={s.about_exp_text} />
          </div>
        </div>
        <div className="ab-split fac-split rev">
          {s.about_custom_image && <div className="ph bleed-end"><img src={s.about_custom_image} alt="" loading="lazy" /></div>}
          <div className="t">
            <h3><Rich text={s.about_custom_title} /></h3>
            <Paras text={s.about_custom_text} />
          </div>
        </div>

        <div className="fac-idea"><Blocks text={s.about_idea} /></div>

        {s.about_close && <p className="fac-close"><Rich text={s.about_close} /></p>}
      </div>

      <div data-section="about-partners" className="wrap">
        <div className="with2">
          <h2>{s.about_partners_title}</h2>
          <div className="roles">{lines(s.about_partners).map((r) => <span key={r}>{r}</span>)}</div>
        </div>
        <div className="summary"><p>{s.about_wordmark && <img className="sum-logo" src={s.about_wordmark} alt={s.site_name} />} <span className="sum-tx">{s.about_summary}</span></p></div>
      </div>

      <div data-section="about-cta" className="cta">
        <div className="wrap">
          <h2><Rich text={s.about_cta_title} /></h2>
          <div>
            {s.about_cta_text && <p>{s.about_cta_text}</p>}
            <div className="acts">
              {s.about_cta_links.map((l, i) => <Link key={l.href + l.label} className={i === 0 ? "btn light" : "btn ghost-l"} href={l.href}>{l.label}</Link>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
