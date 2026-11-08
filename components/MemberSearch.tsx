"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { searchMembers, type SearchEntry } from "@/lib/search";

export function MemberSearch({ entries }: { entries: SearchEntry[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const results = searchMembers(entries, query);
  const showing = open && query.trim() !== "";

  const close = () => {
    setQuery("");
    setOpen(false);
  };

  return (
    <form
      role="search"
      className="member-search"
      onSubmit={(e) => {
        e.preventDefault();
        if (results[0]) {
          router.push(`/member/${results[0].id}`);
          close();
        }
      }}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
      }}
    >
      <label htmlFor="member-search" className="visually-hidden">Find a member</label>
      <input
        id="member-search"
        type="search"
        placeholder="Name, state or seat"
        autoComplete="off"
        spellCheck={false}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
      />
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
