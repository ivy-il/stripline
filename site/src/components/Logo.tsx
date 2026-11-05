import Link from "next/link";

/** The approved STRIPLINE logo (wordmark and tagline are part of the artwork). */
export default function Logo({
  light = false,
  size = "md",
  href = "/",
  tagline = "ARCHITECTURAL AIR SOLUTIONS",
  name = "STRIPLINE",
}: {
  light?: boolean;
  size?: "sm" | "md" | "lg";
  href?: string | null;
  tagline?: string;
  name?: string;
}) {
  const inner = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={light ? "/images/logo-light.png" : "/images/logo-dark.png"}
      width={1194}
      height={203}
      alt={`${name} – ${tagline}`}
      className={`logo-image logo-image-${size}`}
    />
  );
  if (!href) return inner;
  return (
    <Link href={href} aria-label={name} className="inline-flex">
      {inner}
    </Link>
  );
}
