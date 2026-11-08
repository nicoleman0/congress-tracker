// Writes "congress" stances from sponsors and cosponsors of the bills below, via api.congress.gov.
// Campaign stances and record stances for other bills are left alone. Withdrawn cosponsors are skipped.
// Usage: CONGRESS_API_KEY=... tsx scripts/record.ts   (free key at https://api.data.gov/signup/)
import fs from "node:fs";
import type { Member, Stance } from "@/lib/data";
import { bare } from "@/lib/names";

const MEMBERS = "data/members.json";
const PLATFORM = "data/platform.json";
const API = "https://api.congress.gov/v3";

export type Bill = { issue: string; congress: number; type: "hr" | "s"; number: number; name: string };

export const BILLS: Bill[] = [
  { issue: "healthcare", congress: 119, type: "hr", number: 3069, name: "Medicare for All Act" },
  { issue: "healthcare", congress: 119, type: "s", number: 1506, name: "Medicare for All Act" },
  { issue: "gaza", congress: 119, type: "hr", number: 3565, name: "Block the Bombs Act" },
  { issue: "labor", congress: 119, type: "hr", number: 20, name: "PRO Act" },
];

export type Sponsor = {
  firstName: string; lastName: string; state: string; district?: number | null; sponsorshipWithdrawnDate?: string;
};

const label = (b: Bill) => `${b.type === "hr" ? "H.R." : "S."} ${b.number}`;
export const billUrl = (b: Bill) =>
  `https://www.congress.gov/bill/${b.congress}th-congress/${b.type === "hr" ? "house" : "senate"}-bill/${b.number}`;

// Same state and chamber, same last name and first initial. Not district: our district is the 2026 seat,
// which redistricting (Texas, California) can renumber.
export function matches(m: Member, s: Sponsor) {
  if (m.state !== s.state) return false;
  if ((m.office === "senate") !== (s.district == null)) return false;
  const ours = bare(m.name);
  return ours.endsWith(" " + bare(s.lastName).split(" ").at(-1)) && ours[0] === bare(s.firstName)[0];
}

export function stanceFor(b: Bill, role: "Sponsored" | "Cosponsored", checkedAt: string): Stance {
  return {
    issue: b.issue,
    text: `${role} the ${b.name} (${label(b)}).`,
    kind: "congress",
    source: { label: "Congress.gov", url: billUrl(b) },
    checkedAt,
  };
}

async function api(path: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams({ ...params, format: "json", api_key: process.env.CONGRESS_API_KEY! });
  const res = await fetch(`${API}${path}?${qs}`);
  if (!res.ok) throw new Error(`congress.gov ${path}: HTTP ${res.status}`);
  return res.json();
}

async function sponsorsOf(b: Bill) {
  const path = `/bill/${b.congress}/${b.type}/${b.number}`;
  const { bill } = await api(path);
  const cosponsors: Sponsor[] = [];
  for (let offset = 0; offset < bill.cosponsors.countIncludingWithdrawnCosponsors; offset += 250) {
    cosponsors.push(...(await api(`${path}/cosponsors`, { limit: "250", offset: String(offset) })).cosponsors);
  }
  return { sponsors: bill.sponsors as Sponsor[], cosponsors: cosponsors.filter((c) => !c.sponsorshipWithdrawnDate) };
}

async function main() {
  if (!process.env.CONGRESS_API_KEY) throw new Error("set CONGRESS_API_KEY (free at https://api.data.gov/signup/)");
  const members = (JSON.parse(fs.readFileSync(MEMBERS, "utf8")) as { members: Member[] }).members.filter((m) => m.incumbent);
  const platform = JSON.parse(fs.readFileSync(PLATFORM, "utf8")) as { stances: Record<string, Stance[]> };
  const today = new Date().toISOString().slice(0, 10);
  const ours = new Set(BILLS.map(billUrl));

  for (const id of Object.keys(platform.stances)) {
    platform.stances[id] = platform.stances[id].filter((s) => !(s.kind === "congress" && ours.has(s.source.url)));
  }
  const counts: string[] = [];
  for (const b of BILLS) {
    const { sponsors, cosponsors } = await sponsorsOf(b);
    let n = 0;
    for (const m of members) {
      const role = sponsors.some((s) => matches(m, s)) ? "Sponsored" : cosponsors.some((s) => matches(m, s)) ? "Cosponsored" : null;
      if (!role) continue;
      (platform.stances[m.id] ??= []).push(stanceFor(b, role, today));
      n++;
    }
    counts.push(`${label(b)} ${b.name}: ${n} of ours (of ${sponsors.length + cosponsors.length} total)`);
  }
  for (const id of Object.keys(platform.stances)) if (platform.stances[id].length === 0) delete platform.stances[id];
  fs.writeFileSync(PLATFORM, JSON.stringify(platform, null, 2) + "\n");
  console.log(counts.join("\n"));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
