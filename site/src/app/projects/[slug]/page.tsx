import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Arrow from "@/components/design/Arrow";
import { productImage } from "@/lib/design";
import { getFamilies, getProducts, getProject, getProjects, getSettings } from "@/lib/wp";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getProjects()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const pr = await getProject((await params).slug);
  return pr ? { title: pr.title, description: pr.description_he } : {};
}

/* eslint-disable @next/next/no-img-element */
export default async function ProjectPage({ params }: Params) {
  const { slug } = await params;
  const [project, projects, products, families, s] = await Promise.all([getProject(slug), getProjects(), getProducts(), getFamilies(), getSettings()]);
  if (!project) notFound();
  const used = project.products.map((code) => products.find((p) => p.slug === code)).filter((p) => !!p);
  const index = projects.findIndex((p) => p.slug === project.slug);
  const next = projects.length > 1 ? projects[(index + 1) % projects.length] : undefined;
  const familyName = (slug: string) => families.find((f) => f.slug === slug)?.name_he ?? "";
  const photos = [project.image, ...project.gallery].filter(Boolean);
  const second = photos[1] ?? photos[0];
  const more = photos.slice(2);

  return (
    <div id="p-project">
      <div data-section="project-hero" className="phero">
        <img src={project.image} alt={project.title} />
        <div className="wrap">
          <Link className="arrow back" href="/projects"><Arrow className="flip" /> {s.project_back}</Link>
          <h1>{project.title}</h1>
        </div>
      </div>
      <div data-section="project-body" className="wrap">
        <dl className="facts">
          <div><dt>{s.project_fact_type}</dt><dd>{project.type}</dd></div>
          <div><dt>{s.project_fact_location}</dt><dd>{project.location}</dd></div>
          <div><dt>{s.project_fact_year}</dt><dd>{project.year}</dd></div>
          <div><dt>{s.project_fact_products}</dt><dd className="lat">{used.map((p) => p.code).join(" · ")}</dd></div>
        </dl>
        <div className="pp-split">
          <div className="solution">
            <h2>{s.project_story_label}</h2>
            <p>{project.description_he}</p>
          </div>
          <div className="pp-gallery bleed-end">
            <img src={second} alt={`${project.title}, תמונה ${photos.length > 1 ? 2 : 1}`} />
          </div>
        </div>

        {more.length > 0 && (
          <div className="pp-mosaic">
            {more.map((src, i) => <img key={src} src={src} alt={`${project.title}, תמונה ${i + 3}`} loading="lazy" />)}
          </div>
        )}

        {used.length > 0 && (
          <>
            <div className="pp-prod-head"><h2>{s.project_products_label}</h2></div>
            <div className="pp-prods">
              {used.map((p) => (
                <article key={p.slug}>
                  <Link href={`/products/${p.slug}`} className="pp-prod">
                    <div className="ph"><img src={productImage(p)} alt="" loading="lazy" /></div>
                    <h3>{p.name_he}</h3>
                    <span className="famname">{familyName(p.family)}</span>
                    <span className="lat code">{p.code}</span>
                    <p>{p.short_he}</p>
                  </Link>
                </article>
              ))}
            </div>
          </>
        )}

        {next && (
          <Link className="next" href={`/projects/${next.slug}`}>
            <div className="ph bleed-start"><img src={next.image} alt="" loading="lazy" /></div>
            <div className="t"><h2>{next.title}</h2><Arrow size={40} weight={1} /></div>
          </Link>
        )}
      </div>
    </div>
  );
}
