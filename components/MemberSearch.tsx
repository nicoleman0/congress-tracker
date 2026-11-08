"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { searchMembers, type SearchEntry } from "@/lib/search";

export function MemberSearch({ entries }: { entries: SearchEntry[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const results = searchMembers(entries, query);
  const showing = open && query.trim() !== "";

  const close = () => {
    setQuery("");
    setOpen(false);
  };

  // Close on taps outside, not on blur: iOS doesn't focus a tapped link, so blur would unmount it before the click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!form.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  return (
    <form
      ref={form}
      role="search"
      className={open ? "member-search open" : "member-search"}
      onSubmit={(e) => {
        e.preventDefault();
        if (results[0]) {
          router.push(`/member/${results[0].id}`);
          close();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          close();
          toggle.current?.focus();
        }
      }}
    >
      <label htmlFor="member-search" className="visually-hidden">Find a member</label>
      <input
        ref={input}
        id="member-search"
        type="search"
        enterKeyHint="go"
        placeholder="Name, state or seat"
        autoComplete="off"
        spellCheck={false}
        tabIndex={open ? 0 : -1}
        aria-hidden={!open}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button
        ref={toggle}
        type="button"
        className="member-search-toggle"
        aria-label={open ? "Close search" : "Search members"}
        aria-expanded={open}
        aria-controls="member-search"
        onClick={() => (open ? close() : setOpen(true))}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <><circle cx="10.5" cy="10.5" r="6" /><path d="M15 15l5 5" /></>}
        </svg>
      </button>
      <p className="visually-hidden" aria-live="polite">
        {showing ? `${results.length} ${results.length === 1 ? "match" : "matches"}` : ""}
      </p>
      {showing && (
        <ul className="member-search-results">
          {results.length === 0 && <li className="member-search-empty">No match</li>}
          {results.map((r) => (
            <li key={r.id}>
              <Link href={`/member/${r.id}`} onClick={close}>
                {r.name} <span>{r.seat}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
