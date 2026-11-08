import type { Metadata, Viewport } from "next";
import Link from "next/link";
// Self-hosted variable fonts, as on corvus-dev.com.
import "@fontsource-variable/funnel-display";
import "@fontsource-variable/funnel-sans";
import { NavLinks } from "@/components/NavLinks";
import { lastChecked } from "@/lib/data";
import "./globals.css";

export const metadata: Metadata = {
  title: "Progressive Bloc",
  description: "Who the progressives in Congress are, how to back them, and where to plug in locally.",
};

export const viewport: Viewport = { themeColor: "#eef0f9" };

const NAV = [
  { href: "/#states", label: "states" },
  { href: "/watch", label: "races to watch" },
  { href: "/method", label: "how we pick" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <header className="site-header">
          <Link href="/" className="site-title">Progressive Bloc</Link>
          <nav aria-label="Main">
            <NavLinks links={NAV} />
          </nav>
        </header>
        <div className="page-wrap page-wrap--wide">
          <main id="main">{children}</main>
        </div>
        <footer className="page-wrap page-wrap--wide">
          <div className="footer-inner">
            <p>Last checked {lastChecked}.</p>
            <nav className="footer-links" aria-label="Site">
              <Link href="/method">method and sources</Link>
              <a href="https://github.com/nicoleman0/congress-tracker">source code</a>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
