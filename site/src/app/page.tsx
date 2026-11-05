import Link from "next/link";
import HomeHero from "@/components/home/HomeHero";
import AlbumBook from "@/components/book/AlbumBook";
import SolFrame from "@/components/home/SolFrame";
import Arrow, { WhatsAppIcon } from "@/components/design/Arrow";
import { HeadLines, Rich, lines } from "@/components/design/Rich";
import { albumLabels, buildAlbumSpreads } from "@/lib/album";
import { agentButtonLabel } from "@/lib/design";
import { getFamilies, getProducts, getSettings } from "@/lib/wp";

/** Every text, image and the film on this page come from WordPress > תוכן האתר > עמוד הבית. */
export default async function HomePage() {
  const [s, families, products] = await Promise.all([getSettings(), getFamilies(), getProducts()]);
  const spreads = buildAlbumSpreads(s, families, products);

  return (
    <>
      <HomeHero video={s.hero_video} videoMobile={s.hero_video_mobile} poster={s.hero_poster}>
        <div className="wrap">
          <h1><HeadLines text={s.hero_title} /></h1>
          <div className="below">
            <p>{lines(s.hero_subtitle).join(" ")}</p>
            {s.book_cta && <Link className="btn light" href="#catalog">{s.book_cta} <Arrow size={22} weight={1.4} /></Link>}
          </div>
        </div>
      </HomeHero>

      <div data-section="home-categories" className="wrap">
        <div className="cats">
          {s.home_cards.map((c) => {
            const inner = (
              <span className="cat-in">
                <h2>{c.title}</h2>
                <p>{c.text}</p>
                {c.label && <span className="arrow">{c.label} <Arrow /></span>}
              </span>
            );
            return c.href.startsWith("#")
              ? <a key={c.title + c.href} className="cat" href={c.href}>{inner}</a>
              : <Link key={c.title + c.href} className="cat" href={c.href}>{inner}</Link>;
          })}
        </div>
      </div>

      <section data-section="home-catalog" className="catalog" id="catalog" aria-labelledby="cat-h">
        <div className="wrap cat2">
          <h2 id="cat-h">{lines(s.book_title).join(" ")}</h2>
          <AlbumBook spreads={spreads} labels={albumLabels(s)} tools cta={s.book_cta ? <Link className="btn" href="/catalog">{s.book_cta} <Arrow size={22} weight={1.4} /></Link> : null} />
        </div>
      </section>

      <section data-section="home-solutions" className="sols" id="solutions" aria-labelledby="sol-h">
        <div className="wrap sols-in">
          <div className="sol-intro">
            <h2 id="sol-h"><Rich text={s.solutions_heading} /></h2>
            {lines(s.solutions_intro).map((p, i) => <p key={i} className={i === 0 ? "first" : undefined}><Rich text={p} /></p>)}
            <SolFrame images={lines(s.sol_images)} />
          </div>
          <div className="sol-list">
            {s.solutions_items.map((item, i) => {
              const [lead, ...rest] = lines(item.text);
              return (
                <details key={item.title + i} className="sol" name="sol" open={i === 0}>
                  <summary><h3>{item.title}</h3><span className="pm" aria-hidden="true" /></summary>
                  <div className="sx">{lead && <p className="lead"><Rich text={lead} /></p>}{rest.map((p, j) => <p key={j}><Rich text={p} /></p>)}</div>
                </details>
              );
            })}
          </div>
        </div>
      </section>

      <section data-section="home-air-cta" className="air-cta" aria-labelledby="air-h">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {s.air_image && <div className="ph"><img src={s.air_image} alt="" /></div>}
        <div className="wrap">
          <div className="t">
            <h2 id="air-h"><Rich text={s.solutions_closing_title} /></h2>
            {s.solutions_closing_text && <p>{s.solutions_closing_text}</p>}
            {s.solutions_closing_kicker && <p className="ask">{s.solutions_closing_kicker}</p>}
            <div className="acts">
              {s.solutions_agents.map((a) => (
                <a key={a.name} className="btn sand" href={a.whatsapp ? `https://wa.me/${a.whatsapp}` : "/contact"} target="_blank" rel="noopener"><WhatsAppIcon /> <span>{agentButtonLabel(s.agent_cta, a.name)}</span></a>
              ))}
              {s.air_link.map((l) => <Link key={l.href + l.label} className="arrow" href={l.href}>{l.label} <Arrow /></Link>)}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
