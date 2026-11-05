import type { Metadata } from "next";
import { getFamilies, getProducts, getSettings } from "@/lib/wp";
import ProfessionalLibrary from "@/components/professional/ProfessionalLibrary";
import "./professional.css";

export const metadata: Metadata = { title: "המרחב המקצועי", description: "שרטוטים, מפרטים, קבצי DWG והוראות התקנה לאדריכלים ויועצים." };


export default async function ProfessionalPage() {
  const [families, products, s] = await Promise.all([getFamilies(), getProducts(), getSettings()]);
  const groups = [...families]
    .sort((a, b) => a.order - b.order)
    .map((f) => ({
      slug: f.slug,
      name: f.name_he,
      products: products
        .filter((p) => p.family === f.slug)
        .map((p) => ({
          slug: p.slug,
          code: p.code,
          name: p.name_he,
          nameEn: p.name,
          image: p.image,
          pages: p.catalog_pages,
          pdf: p.pdf_url,
          dwg: p.dwg_url,
        })),
    }))
    .filter((g) => g.products.length > 0);
  const dwgCount = products.filter((p) => p.dwg_url).length;

  return (
    <div className="pro container-x">
      <header className="pro-intro">
        <div className="pro-intro-main">
          <p data-anim="up" className="pro-kicker">{s.pro_kicker}</p>
          <h1 data-anim="heading" className="pro-title">{s.pro_title}</h1>
        </div>
        <div data-anim="stagger" data-anim-delay="0.2" className="pro-intro-side">
          <p className="pro-lede">{s.pro_text}</p>
          <dl className="pro-stats">
            <div>
              <dt>מוצרים</dt>
              <dd data-anim="count" className="tabular-nums">{products.length}</dd>
            </div>
            <div>
              <dt>משפחות</dt>
              <dd data-anim="count" className="tabular-nums">{groups.length}</dd>
            </div>
            <div>
              <dt>קבצי DWG</dt>
              <dd data-anim="count" className="tabular-nums">{dwgCount}</dd>
            </div>
          </dl>
        </div>
      </header>

      <ProfessionalLibrary groups={groups} catalogPdf={s.catalog_pdf} pageOffset={Number(s.catalog_pdf_page_offset) || 0} />
    </div>
  );
}
