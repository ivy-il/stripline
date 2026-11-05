import { Fragment } from "react";
import Link from "next/link";
import { Lg } from "./Arrow";

/**
 * Copy typed in WordPress: **words** are bold, [label](/href) is a link and STRIPLINE is the wordmark.
 * Plain text otherwise; nothing is read as HTML.
 */
const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\)|STRIPLINE)/g;

export function Rich({ text }: { text?: string | null }) {
  if (!text) return null;
  return (
    <>
      {text.split(TOKEN).map((part, i) => {
        if (!part) return null;
        if (part === "STRIPLINE") return <Lg key={i} />;
        if (part.startsWith("**") && part.endsWith("**")) return <b key={i}><Rich text={part.slice(2, -2)} /></b>;
        const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
        if (link) {
          const [, label, href] = link;
          return /^https?:\/\//.test(href)
            ? <a key={i} href={href} target="_blank" rel="noopener"><Rich text={label} /></a>
            : <Link key={i} href={href}><Rich text={label} /></Link>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

/** One line per entry: a text field's lines, or a list field's items. Empty lines are dropped. */
export function lines(value?: string | string[] | null): string[] {
  const all = Array.isArray(value) ? value : (value ?? "").split("\n");
  return all.map((l) => l.trim()).filter(Boolean);
}

/** Paragraphs, one per line; `first` styles the opening paragraph differently (a lead or a bold line). */
export function Paras({ text, first, className }: { text?: string | string[] | null; first?: string; className?: string }) {
  return (
    <>
      {lines(text).map((line, i) => (
        <p key={i} className={(i === 0 && first) || className}><Rich text={line} /></p>
      ))}
    </>
  );
}

/** A heading set line by line, as the design breaks it (each line a span). */
export function HeadLines({ text, sep = "" }: { text?: string | null; sep?: string }) {
  return (
    <>
      {lines(text).map((line, i) => (
        <Fragment key={i}>{i > 0 && sep}<span><Rich text={line} /></span></Fragment>
      ))}
    </>
  );
}

/** Fills {name} placeholders, e.g. "ועוד {n} מוצרים". */
export function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (all, key) => (key in values ? String(values[key]) : all));
}
