import type { Metadata } from "next";
import Link from "next/link";
import { Rich } from "@/components/design/Rich";
import { getProjects, getSettings } from "@/lib/wp";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: s.projects_title, description: s.seo_projects_desc };
}

/** Tile sizes of the design's mosaic, in order (a: wide, b: tall, c: small, d: half); repeats for more projects. */
const TILES = ["a", "b", "c", "c", "c", "b", "a", "d", "d", "b", "a"];

/* eslint-disable @next/next/no-img-element */
export default async function ProjectsPage() {
  const [projects, s] = await Promise.all([getProjects(), getSettings()]);
  return (
    <div id="p-projects">
      <div data-section="projects-hero" className="phero">
        {s.projects_image && <img src={s.projects_image} alt="" />}
        <div className="wrap"><h1>{s.projects_title}</h1></div>
      </div>
      <div data-section="projects-list" className="wrap fam-body">
        {projects.length === 0 && s.projects_empty && <p className="fam-lead">{s.projects_empty}</p>}
        <div className="pmosaic">
          {projects.map((p, i) => (
            <Link key={p.slug} className={`pjm pjm-${TILES[i % TILES.length]}`} href={`/projects/${p.slug}`}>
              <span className="pjm-ph"><img src={p.image} alt={p.title} loading={i < 3 ? "eager" : "lazy"} /></span>
              <span className="pjm-t"><b>{p.title}</b><span>{[p.type, p.location].filter(Boolean).join(" · ")}</span></span>
            </Link>
          ))}
        </div>
      </div>
      <div data-section="projects-cta" className="cta">
        <div className="wrap">
          <h2><Rich text={s.projects_cta_title} /></h2>
          <div>
            {s.projects_cta_text && <p>{s.projects_cta_text}</p>}
            <div className="acts">
              {s.projects_cta_links.map((l) => <Link key={l.href + l.label} className="btn light" href={l.href}>{l.label}</Link>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
