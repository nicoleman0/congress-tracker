"use client";
import { useRef, useState } from "react";
import type { Headline } from "@/lib/news";

const PER_PAGE = 10;
const day = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function NewsPager({ headlines }: { headlines: Headline[] }) {
  const [page, setPage] = useState(0);
  const list = useRef<HTMLUListElement>(null);
  const pages = Math.ceil(headlines.length / PER_PAGE);
  const shown = headlines.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const go = (p: number) => {
    setPage(p);
    // Keep the reader at the top of the new page, not the bottom of the old one.
    list.current?.scrollIntoView({ block: "nearest" });
  };

  return (
    <>
      <ul className="news-list jd-ruled" ref={list}>
        {shown.map((h) => (
          <li key={h.url}>
            <a href={h.url} target="_blank" rel="noopener noreferrer">{h.title}</a>
            <span className="news-source jd-secondary">{h.source} · {day.format(new Date(h.date))}</span>
          </li>
        ))}
      </ul>
      {pages > 1 && (
        <nav className="pager" aria-label="Headline pages">
          <button type="button" onClick={() => go(page - 1)} disabled={page === 0}>Newer</button>
          <span aria-live="polite">Page {page + 1} of {pages}</span>
          <button type="button" onClick={() => go(page + 1)} disabled={page === pages - 1}>Older</button>
        </nav>
      )}
    </>
  );
}
