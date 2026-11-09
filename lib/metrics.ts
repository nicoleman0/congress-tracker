// Counts derived from the roster and platform, for the data page.
import rawChambers from "@/data/chambers.json";
import { listedMembers, platformOf, type Member, type Office, type Source } from "@/lib/data";
import { CHECKED_AT } from "@/lib/freshness";

export const SEATS: Record<Office, { total: number; majority: number }> = {
  house: { total: 435, majority: 218 },
  senate: { total: 100, majority: 51 },
};

// Democratic seats (with independents who caucus with them) in the next Congress, from projected results.
export type Chamber = { democrats: number; uncalled: number; source: Source; checkedAt: string };

export function validateChambers(c: Record<Office, Chamber>, bloc: Bloc[]): Record<Office, Chamber> {
  for (const b of bloc) {
    const ch = c[b.office];
    const fail = (msg: string): never => { throw new Error(`data/chambers.json ${b.office}: ${msg}`); };
    if (!ch) fail("missing");
    if (ch.democrats < b.seated) fail(`${ch.democrats} Democrats is fewer than ${b.seated} listed members`);
    if (ch.democrats + ch.uncalled > SEATS[b.office].total) fail("more seats than the chamber has");
    if (!ch.source?.url.startsWith("https://")) fail("source needs an https url");
    if (!CHECKED_AT.test(ch.checkedAt)) fail("checkedAt must be YYYY-MM-DD or YYYY-MM-DDTHH:MMZ");
  }
  return c;
}

export type Bloc = { office: Office; seated: number; returning: number; new: number; unresolved: number };

// "Seated" is won plus senators not up in 2026. Leading and not-called races are counted apart.
export function blocSize(members: Member[] = listedMembers()): Bloc[] {
  return (["house", "senate"] as Office[]).map((office) => {
    const here = members.filter((m) => m.office === office);
    const seated = here.filter((m) => m.status === "won" || m.status === "incumbent");
    return {
      office,
      seated: seated.length,
      returning: seated.filter((m) => m.incumbent).length,
      new: seated.filter((m) => !m.incumbent).length,
      unresolved: here.filter((m) => m.status === "leading" || m.status === "pending").length,
    };
  });
}

export type Coverage = { issue: string; name: string; members: Member[]; onRecord: Member[] };

// For each issue, the listed members with a sourced position on it, and those with a bill record on it.
export function issueCoverage(members: Member[] = listedMembers(), platform = platformOf): Coverage[] {
  const by = new Map<string, Coverage>();
  for (const m of members) {
    for (const g of platform(m.id)) {
      const c = by.get(g.issue) ?? { issue: g.issue, name: g.name, members: [], onRecord: [] };
      c.members.push(m);
      if (g.stances.some((s) => s.kind === "congress")) c.onRecord.push(m);
      by.set(g.issue, c);
    }
  }
  return [...by.values()].sort((a, b) => b.members.length - a.members.length);
}

const chambers = validateChambers(rawChambers as Record<Office, Chamber>, blocSize());
export const chamber = (office: Office) => chambers[office];
