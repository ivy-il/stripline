import type { CmsSettings } from "./cms-settings";

export type Family = {
  slug: string;
  name: string;
  name_he: string;
  description_he: string;
  order: number;
  /** Room photo: the family page and its products' pages. */
  image?: string;
  /** The family's tile on the products page. */
  tile?: string;
};

export type InstallSection = { title: string; items: string[] };

export type Product = {
  slug: string;
  code: string;
  codes: string[];
  name: string;
  name_he: string;
  subtitle_he: string;
  family: string;
  short_he: string;
  description_he: string;
  description_en: string;
  application_en: string;
  characteristics_en: string[];
  accessories_en: string[];
  materials_en: string[];
  assembly_en: string[];
  catalog_pages: [number, number];
  image: string;
  hero_image: string;
  /** More hero photos; they cross-fade after `hero_image`. */
  hero_slides: string[];
  drawing_image: string;
  drawing_images?: string[];
  drawing_pdf_url?: string;
  drawing_note?: string;
  drawing_kind?: string;
  installation_pdf_url?: string;
  installation_drawing_image?: string;
  installation_source?: string;
  features_he: string[];
  sizes_he: string[];
  accessories_he: string[];
  materials_he: string[];
  usage_he: string;
  lengths: string[];
  heights: string[];
  install_he: InstallSection[];
  dwg_url: string;
  pdf_url: string;
  featured: boolean;
};

export type Project = {
  slug: string;
  title: string;
  location: string;
  year: string;
  type: string;
  description_he: string;
  image: string;
  gallery: string[];
  products: string[];
};

export type EntryCard = { title: string; text: string; href: string; icon: string };

/** Everything editable in WordPress (CmsSettings) plus older keys the unlinked pages still read. */
export type Settings = CmsSettings & {
  site_name: string;
  site_tagline: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image: string;
  /** More hero photos; they cross-fade after `hero_image`. */
  hero_slides: string[];
  entries: EntryCard[];
  book_kicker: string;
  book_title: string;
  book_cta: string;
  book_image?: string;
  catalog_year: string;
  about_title: string;
  /** One paragraph per line. "# " opens a large statement, "## " an emphasised paragraph. */
  about_text: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  footer_links: Link[];
  contact_title: string;
  contact_text: string;
  // Page copy, all editable in WordPress > Settings > STRIPLINE (one tab per page).
  nav_links: Link[];
  visual_disclosure: string;
  projects_title: string;
  projects_text: string;
  projects_empty: string;
  projects_cta_title: string;
  projects_cta_text: string;
  project_story_label: string;
  project_products_label: string;
  project_next_label: string;
  project_cta_title: string;
  project_cta_text: string;
  products_kicker: string;
  products_title: string;
  products_text: string;
  products_pro_link: string;
  pro_kicker: string;
  pro_title: string;
  pro_text: string;
  pro_feature_kicker: string;
  pro_feature_title: string;
  pro_feature_cta: string;
  pro_consult_cta: string;
  catalog_pdf: string;
  catalog_pdf_page_offset: string;
  catalog_hint: string;
  /** Phone flip book: covers, the full-page images that open it ("title | image URL"), and its fixed copy. */
  mbook_cover: string;
  mbook_back_cover: string;
  mbook_pages: { title: string; text: string }[];
  mbook_footnote: string;
  mbook_end_text: string;
  mbook_tagline: string;
  solutions_kicker: string;
  solutions_title: string;
  solutions_text: string;
  solutions_heading: string;
  solutions_intro: string[];
  /** YouTube/Vimeo embed URL or a video file; the block is hidden while empty. */
  solutions_video: string;
  solutions_items: { title: string; text: string }[];
  /** The closing banner: a photo fading into the copy and the agents' buttons. */
  solutions_closing_image: string;
  solutions_closing_kicker: string;
  solutions_closing_title: string;
  solutions_closing_text: string;
  /** The sales team. `whatsapp` is the number in international format (9725…); empty falls back to the contact page. */
  solutions_agents: { name: string; phone?: string; whatsapp: string }[];
  contact_agents_title: string;
  families_kicker: string;
  book_hint: string;
  about_image: string;
  about_story_label: string;
  about_principles_label: string;
  about_principles: { title: string; text: string }[];
  about_audience_kicker: string;
  about_audience: string[];
  about_audience_text: string;
  about_audience_cta: string;
  about_families_label: string;
  about_projects_label: string;
  about_cta_title: string;
  about_cta_text: string;
  contact_attach_title: string;
  contact_attach: string[];
  contact_pro_kicker: string;
  contact_pro_title: string;
  privacy_title: string;
  privacy_body: string[];
  accessibility_title: string;
  accessibility_body: string[];
  terms_title: string;
  terms_body: string[];
};

export type Link = { label: string; href: string };
