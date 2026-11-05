import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import { Rich, lines } from "@/components/design/Rich";
import { formLabels } from "@/lib/product-labels";
import { getSettings } from "@/lib/wp";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: s.seo_contact_title, description: s.seo_contact_desc };
}

export default async function ContactPage() {
  const s = await getSettings();
  return (
    <>
      <div data-section="contact-hero" className="phero light ct-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {s.contact_image && <img src={s.contact_image} alt="" />}
        <div className="wrap"><h1>{s.contact_title}</h1></div>
      </div>
      <div data-section="contact-main" className="wrap">
        <div className="ct">
          <div className="ct-l bleed-start">
            {s.contact_text && <p className="lead">{s.contact_text}</p>}
            <div className="people">
              <div className="head"><b>{s.contact_agents_title}</b><span><Rich text={s.contact_agents_text} /></span></div>
              {s.solutions_agents.map((a) => (
                <div key={a.name}>
                  <span className="k">{a.name}</span>
                  <a className="v" href={`tel:${a.phone?.replace(/\D/g, "")}`} dir="ltr">{a.phone}</a>
                  {a.whatsapp && <a className="wa" href={`https://wa.me/${a.whatsapp}`} target="_blank" rel="noopener">{s.contact_whatsapp}</a>}
                </div>
              ))}
              {s.email && <div><span className="k">{s.contact_email_label}</span><a className="v" href={`mailto:${s.email}`}>{s.email}</a></div>}
              {s.address && <div><span className="k">{s.contact_address_label}</span><span className="v he">{s.address}</span></div>}
            </div>
          </div>
          <ContactForm email={s.email} labels={formLabels(s)} />
        </div>
      </div>
      {(s.contact_attach_title || s.contact_attach.length > 0) && (
        <div data-section="contact-tips" className="tips2">
          <div className="wrap">
            <h2>{s.contact_attach_title}</h2>
            <ul>{lines(s.contact_attach).map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </div>
      )}
    </>
  );
}
