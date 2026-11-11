"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
import Arrow from "@/components/design/Arrow";
import { Rich, lines } from "@/components/design/Rich";
import type { FormLabels } from "@/lib/product-labels";

type Field = "name" | "email" | "tel" | "consent";

const RULES: Record<Exclude<Field, "consent">, (v: string) => boolean> = {
  name: (v) => v.trim().length > 1,
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  tel: (v) => !v.trim() || /^[0-9+\-\s()]{9,}$/.test(v.trim()),
};

// Static export: PHP handler next to the HTML (public/contact.php); Node: the route handler.
const CONTACT_URL = process.env.NEXT_PUBLIC_STATIC_EXPORT ? "/contact.php" : "/api/contact";
const noSubscribe = () => () => {};

/** The design's contact form; it posts to WordPress (through CONTACT_URL) and moves on to the thank-you page. */
export default function ContactForm({ email, labels: t }: { email: string; labels: FormLabels }) {
  const roles = lines(t.form_roles);
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Partial<Record<Field, boolean>>>({});
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  // ?product=CODE from a product page; read in the browser so the page stays static HTML.
  const query = useSyncExternalStore(noSubscribe, () => window.location.search, () => "");
  const product = new URLSearchParams(query).get("product")?.slice(0, 60) || undefined;

  function check(f: HTMLFormElement) {
    const data = new FormData(f);
    const next: Partial<Record<Field, boolean>> = {};
    (Object.keys(RULES) as (keyof typeof RULES)[]).forEach((k) => { if (!RULES[k](String(data.get(k) ?? ""))) next[k] = true; });
    if (!data.get("consent")) next.consent = true;
    setErrors(next);
    const first = (["name", "tel", "email", "consent"] as Field[]).find((k) => next[k]);
    if (first) f.querySelector<HTMLElement>(`#f-${first === "email" ? "mail" : first}`)?.focus();
    return !first;
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFailed(false);
    const f = e.currentTarget;
    if (!check(f)) return;
    setSending(true);
    const d = new FormData(f);
    const role = String(d.get("role") ?? "");
    const message = [String(d.get("msg") ?? ""), d.get("newsletter") ? "✓ מעוניין/ת לקבל עדכונים" : ""].filter(Boolean).join("\n\n");
    try {
      const res = await fetch(CONTACT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: d.get("name"), email: d.get("email"), phone: d.get("tel"), role, message, product: product ?? "", website: d.get("website") }),
      });
      if (!res.ok) throw new Error(String(res.status));
      router.push("/thanks");
    } catch {
      setFailed(true);
      setSending(false);
    }
  }

  const clear = (k: Field) => errors[k] && setErrors((p) => ({ ...p, [k]: false }));
  const err = (k: Field) => (errors[k] ? " is-err" : "");

  return (
    <form className="ct-r" id="cform" noValidate ref={form} onSubmit={submit}>
      {product && <p className="cf-product">{t.form_about} <bdi dir="auto">{product}</bdi></p>}
      <div className={`fld${err("name")}`}>
        <label htmlFor="f-name">{t.form_name}</label>
        <input id="f-name" name="name" autoComplete="name" required aria-invalid={!!errors.name} aria-describedby="e-name" onInput={() => clear("name")} />
        <p className="ferr" id="e-name">{t.form_name_err}</p>
      </div>
      <div className="two">
        <div className={`fld${err("tel")}`}>
          <label htmlFor="f-tel">{t.form_tel} <i>{t.form_optional}</i></label>
          <input id="f-tel" name="tel" type="tel" autoComplete="tel" dir="ltr" className="ltr-r" aria-invalid={!!errors.tel} aria-describedby="e-tel" onInput={() => clear("tel")} />
          <p className="ferr" id="e-tel">{t.form_tel_err}</p>
        </div>
        <div className={`fld${err("email")}`}>
          <label htmlFor="f-mail">{t.form_email}</label>
          <input id="f-mail" name="email" type="email" autoComplete="email" dir="ltr" className="ltr-r" required aria-invalid={!!errors.email} aria-describedby="e-mail" onInput={() => clear("email")} />
          <p className="ferr" id="e-mail">{t.form_email_err}</p>
        </div>
      </div>
      {roles.length > 0 && <fieldset className="fld">
        <legend>{t.form_role} <i>{t.form_optional}</i></legend>
        <div className="chips">
          {roles.map((label, i) => (
            <span key={label} style={{ display: "contents" }}>
              <input type="radio" name="role" id={`r${i + 1}`} value={label} />
              <label htmlFor={`r${i + 1}`}>{label}</label>
            </span>
          ))}
        </div>
      </fieldset>}
      <div className="fld"><label htmlFor="f-msg">{t.form_msg}</label><textarea id="f-msg" name="msg" rows={4} /></div>
      {/* Spam trap: people never see or fill it. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp" />
      <div className="checks">
        <div className={`chk${err("consent")}`} id="w-consent">
          <input type="checkbox" id="f-consent" name="consent" required aria-invalid={!!errors.consent} aria-describedby="e-consent" onChange={() => clear("consent")} />
          <label htmlFor="f-consent"><Rich text={t.form_consent} /></label>
          <p className="ferr" id="e-consent">{t.form_consent_err}</p>
        </div>
        <div className="chk"><input type="checkbox" id="f-news" name="newsletter" /><label htmlFor="f-news">{t.form_news} <i>{t.form_optional}</i></label></div>
      </div>
      <div className="send">
        <button className={`btn${sending ? " is-sending" : ""}`} type="submit" aria-busy={sending} disabled={sending}>
          <span className="lbl">{sending ? t.form_sending : t.form_send}</span><span className="spin" aria-hidden="true" /><Arrow size={22} weight={1.4} />
        </button>
        {t.form_note && <small>{t.form_note}</small>}
      </div>
      {failed && (
        <div className="fail" role="alert"><Rich text={t.form_fail} /><a href={`mailto:${email}`} dir="ltr">{email}</a></div>
      )}
    </form>
  );
}
