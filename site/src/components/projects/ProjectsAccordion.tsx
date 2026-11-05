"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Project } from "@/lib/types";

export type AccordionProject = Project & { productCodes: { slug: string; code: string; name: string }[] };

export default function ProjectsAccordion({ projects, disclosure }: { projects: AccordionProject[]; disclosure: string }) {
  const [active, setActive] = useState(0);

  return (
    <div className="pacc" style={{ "--n": projects.length } as React.CSSProperties}>
      {projects.map((pr, i) => {
        const open = i === active;
        return (
          <article key={pr.slug} className="pacc-panel" data-open={open} onClick={() => !open && setActive(i)}>
            <div className="pacc-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pr.image} alt={open ? pr.title : ""} loading={i < 2 ? "eager" : "lazy"} />
            </div>
            <div className="pacc-shade" />
            {disclosure && <span className="pacc-visual-disclosure">{disclosure}</span>}

            <button
              type="button"
              className="pacc-closed"
              aria-expanded={open}
              aria-label={pr.title}
              tabIndex={open ? -1 : 0}
              onClick={() => setActive(i)}
            >
              <span className="pacc-vname">{pr.title}</span>
              <span className="pacc-vyear tabular-nums">{pr.year}</span>
            </button>

            <div className="pacc-open" aria-hidden={!open}>
              <div className="pacc-open-inner">
                <p className="pacc-meta">
                  <span className="text-gold-2 font-medium">{pr.type}</span>
                  <span aria-hidden className="mx-2 opacity-40">/</span>
                  {pr.location}
                  <span aria-hidden className="mx-2 opacity-40">/</span>
                  <span className="tabular-nums">{pr.year}</span>
                </p>
                <h2 className="pacc-title">{pr.title}</h2>
                <p className="pacc-desc">{pr.description_he}</p>
                <div className="pacc-foot">
                  {pr.productCodes.length > 0 && (
                    <ul className="flex flex-wrap gap-2" aria-label="מוצרים בפרויקט">
                      {pr.productCodes.map((p) => (
                        <li key={p.slug} title={p.name} dir="ltr" className="pacc-code">
                          {p.code}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link href={`/projects/${pr.slug}`} className="pacc-cta" tabIndex={open ? 0 : -1}>
                    לעמוד הפרויקט
                    <ArrowLeft className="size-4" strokeWidth={1.5} />
                  </Link>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
