// Member search for the header. Runs in the browser over a list the server passes in.
import { norm } from "@/lib/names";

export type SearchEntry = { id: string; name: string; seat: string; stateName: string };

// Each word, plus its pieces split at punctuation: "Ocasio-Cortez" -> ocasiocortez, ocasio, cortez.
function tokens(s: string): string[] {
  return norm(s)
    .split(/\s+/)
    .flatMap((w) => [w.replace(/[^a-z0-9]/g, ""), ...w.split(/[^a-z0-9]+/)])
    .filter(Boolean);
}

// Every query piece must start some token. Exact token hits rank first, so "CO-1" puts CO-1 above CO-10.
export function searchMembers(entries: SearchEntry[], query: string, limit = 8): SearchEntry[] {
  const q = norm(query).split(/[^a-z0-9]+/).filter(Boolean);
  if (q.length === 0) return [];
  const scored: { e: SearchEntry; score: number }[] = [];
  for (const e of entries) {
    const t = tokens(`${e.name} ${e.seat} ${e.stateName}`);
    if (!q.every((p) => t.some((x) => x.startsWith(p)))) continue;
    scored.push({ e, score: q.filter((p) => t.includes(p)).length });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.e.name.localeCompare(b.e.name))
    .slice(0, limit)
    .map((s) => s.e);
}
