"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// In-page anchors (/#states) never mark themselves active.
export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const path = usePathname();
  return links.map((l) => {
    const active = !l.href.includes("#") && path.startsWith(l.href);
    return (
      <Link key={l.href} href={l.href} className={active ? "nav-link active" : "nav-link"} aria-current={active ? "page" : undefined}>
        {l.label}
      </Link>
    );
  });
}
