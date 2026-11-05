import {
  Building2,
  FileText,
  Grip,
  Mail,
  LayoutGrid,
  ArrowLeftRight,
  Ruler,
  Award,
  Palette,
  Wind,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  solutions: Mail,
  products: Grip,
  projects: Building2,
  professional: FileText,
  grid: LayoutGrid,
  flow: ArrowLeftRight,
  ruler: Ruler,
  award: Award,
  palette: Palette,
  wind: Wind,
  wrench: Wrench,
};

export function EntryIcon({ name, className = "size-8" }: { name: string; className?: string }) {
  const I = MAP[name] ?? Grip;
  return <I className={className} strokeWidth={1.4} />;
}

/** Icon set used for the five product feature rows (in order). */
export const FEATURE_ICONS: LucideIcon[] = [Grip, ArrowLeftRight, Ruler, Award, Palette];

/** Thin, gold "grille" mark used in the hero cards. */
export function GrilleMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="3" y="7" width="26" height="18" rx="1.5" />
      <line x1="7" y1="12" x2="25" y2="12" />
      <line x1="7" y1="16" x2="25" y2="16" />
      <line x1="7" y1="20" x2="25" y2="20" />
    </svg>
  );
}
