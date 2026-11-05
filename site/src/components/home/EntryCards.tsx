import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EntryIcon, GrilleMark } from "@/components/icons";
import type { EntryCard } from "@/lib/types";

export default function EntryCards({ entries }: { entries: EntryCard[] }) {
  return (
    <section data-anim="stagger" data-anim-delay="0.75" className="home-entries" aria-label="גלו את STRIPLINE">
      {entries.map((entry) => (
        <Link key={entry.href} href={entry.href} className="home-entry">
          {entry.icon === "products" ? <GrilleMark className="home-entry-icon" /> : <EntryIcon name={entry.icon} className="home-entry-icon" />}
          <h2>{entry.title}</h2>
          <p>{entry.text}</p>
          <ArrowLeft className="home-entry-arrow" />
        </Link>
      ))}
    </section>
  );
}

