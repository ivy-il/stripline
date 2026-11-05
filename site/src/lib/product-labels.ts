import type { Settings } from "./types";

/** The product page's own words (WordPress > תוכן האתר > עמוד מוצר), picked for the client components. */
export type ProductLabels = Pick<Settings,
  | "pp_drawing" | "pp_install" | "pp_pdf" | "pp_modal_note" | "pp_modal_figure" | "pp_install_source" | "pp_install_empty"
  | "pp_fig_maker" | "pp_fig_schematic" | "pp_fig_connection" | "pp_fig_product" | "pp_install_title" | "pp_install_text" | "pp_install_acc">;

const KEYS: (keyof ProductLabels)[] = [
  "pp_drawing", "pp_install", "pp_pdf", "pp_modal_note", "pp_modal_figure", "pp_install_source", "pp_install_empty",
  "pp_fig_maker", "pp_fig_schematic", "pp_fig_connection", "pp_fig_product", "pp_install_title", "pp_install_text", "pp_install_acc",
];

export function productLabels(s: Settings): ProductLabels {
  return Object.fromEntries(KEYS.map((k) => [k, s[k]])) as ProductLabels;
}

/** The contact form's words (WordPress > תוכן האתר > טופס פנייה). */
export type FormLabels = Pick<Settings, Extract<keyof Settings, `form_${string}`>>;

export function formLabels(s: Settings): FormLabels {
  return Object.fromEntries(Object.entries(s).filter(([k]) => k.startsWith("form_"))) as FormLabels;
}
