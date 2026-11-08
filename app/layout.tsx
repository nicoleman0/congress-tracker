import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { asOf } from "@/lib/data";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Progressive Bloc",
  description: "Who the progressives in Congress are, how to back them, and where to plug in locally.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} antialiased`}>
      <body className="min-h-screen font-sans flex flex-col">
        <header className="border-b border-line bg-surface">
          <nav className="mx-auto max-w-5xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/" className="font-semibold text-lg">Progressive Bloc</Link>
            <div className="flex gap-5 text-sm text-muted">
              <Link href="/#states" className="hover:text-ink">Browse by state</Link>
              <Link href="/watch" className="hover:text-ink">Races to watch</Link>
              <Link href="/method" className="hover:text-ink">How we pick</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 py-8 flex-1">{children}</main>
        <footer className="border-t border-line text-sm text-muted">
          <div className="mx-auto max-w-5xl px-4 py-6">
            Data as of {asOf}. Results can change as races are called. Every listing links to its source.{" "}
            <Link href="/method" className="underline">Method and sources</Link>.
          </div>
        </footer>
      </body>
    </html>
  );
}
