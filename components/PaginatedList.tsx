"use client";

import { Children, useRef, useState, type ReactNode } from "react";

const PAGE_SIZE = 10;

export function PaginatedList({ children, className, label, ordered = false }: { children: ReactNode; className: string; label: string; ordered?: boolean }) {
  const items = Children.toArray(children);
  const [page, setPage] = useState(0);
  const list = useRef<HTMLOListElement & HTMLUListElement>(null);
  const pages = Math.ceil(items.length / PAGE_SIZE);
  const current = Math.min(page, Math.max(0, pages - 1));
  const shown = items.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  const go = (next: number) => {
    setPage(next);
    list.current?.scrollIntoView({ block: "nearest" });
  };

  return <>
    {ordered ? <ol ref={list} className={className} start={current * PAGE_SIZE + 1}>{shown}</ol> : <ul ref={list} className={className}>{shown}</ul>}
    {pages > 1 && <nav className="pager" aria-label={`${label} pages`}>
      <button type="button" onClick={() => go(current - 1)} disabled={current === 0}>Previous</button>
      <span aria-live="polite">Page {current + 1} of {pages}</span>
      <button type="button" onClick={() => go(current + 1)} disabled={current === pages - 1}>Next</button>
    </nav>}
  </>;
}
