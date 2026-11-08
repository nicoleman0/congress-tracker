import type { Metadata, Viewport } from "next";
import Link from "next/link";
// Self-hosted variable fonts, as on corvus-dev.com.
import "@fontsource-variable/funnel-display";
import "@fontsource-variable/funnel-sans";
import { MemberSearch } from "@/components/MemberSearch";
import { NavLinks } from "@/components/NavLinks";
import { lastChecked, searchEntries } from "@/lib/data";
import { formatChecked } from "@/lib/freshness";
import { REPO_URL, SITE_NAME } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: "Who the progressives in Congress are, how to back them, and how to get involved locally.",
};

export const viewport: Viewport = { themeColor: "#eef0f9" };

const NAV = [
  { href: "/#states", label: "states" },
  { href: "/members", label: "members" },
  { href: "/method", label: "how we pick" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <header className="site-header">
          <Link href="/" className="site-title">{SITE_NAME}</Link>
          <nav aria-label="Main">
            <NavLinks links={NAV} />
          </nav>
          <MemberSearch entries={searchEntries()} />
        </header>
        <div className="page-wrap page-wrap--wide">
          <main id="main">{children}</main>
        </div>
        <footer className="page-wrap page-wrap--wide">
          <div className="footer-inner">
            <p>Last checked {formatChecked(lastChecked)}.</p>
            <nav className="footer-links" aria-label="Site">
              <Link href="/faq">faq</Link>
              <Link href="/method">method and sources</Link>
              <a href={REPO_URL}>source code</a>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
